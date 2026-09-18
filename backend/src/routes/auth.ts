import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { config } from "../config/index.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { createAuditLog } from "../services/auditService.js";

const router = Router();

/**
 * POST /api/auth/login
 *
 * Authenticates a user using email + password.
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({
        error: "Email and password are required",
      });
      return;
    }

    // Find user in MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
      });
      return;
    }

    // Check account status
    if (user.isActive === false) {
      res.status(401).json({
        error: "Account is deactivated",
      });
      return;
    }

    // Compare supplied password with bcrypt hash
    const isValid = await user.comparePassword(password);

    if (!isValid) {
      res.status(401).json({
        error: "Invalid credentials",
      });
      return;
    }

    // Make sure JWT secret exists
    if (!config.jwtSecret) {
      console.error("JWT_SECRET is not configured");
      res.status(500).json({
        error: "Authentication configuration error",
      });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn,
      },
    );

    // Record successful login
    try {
      await createAuditLog({
        userId: user._id.toString(),
        userName: user.name,
        action: "LOGIN",
        resourceType: "auth",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (auditError) {
      // Do not prevent a successful login because audit logging failed.
      console.error("Login audit log error:", auditError);
    }

    res.status(200).json({
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user.
 */
router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?._id) {
        res.status(401).json({
          error: "Not authenticated",
        });
        return;
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      if (user.isActive === false) {
        res.status(401).json({
          error: "Account is deactivated",
        });
        return;
      }

      res.status(200).json({
        user: user.toSafeJSON(),
      });
    } catch (error) {
      console.error("Get current user error:", error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

/**
 * POST /api/auth/logout
 *
 * JWT logout is stateless. The frontend should remove its token.
 * We still record the logout event for auditing.
 */
router.post(
  "/logout",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?._id) {
        res.status(401).json({
          error: "Not authenticated",
        });
        return;
      }

      try {
        await createAuditLog({
          userId: req.user._id.toString(),
          userName: req.user.name,
          action: "LOGOUT",
          resourceType: "auth",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      } catch (auditError) {
        console.error("Logout audit log error:", auditError);
      }

      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);

      res.status(500).json({
        error: "Internal server error",
      });
    }
  },
);

export default router;
