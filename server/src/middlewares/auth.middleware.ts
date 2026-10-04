import { Request, Response, NextFunction } from "express";
import { Role } from "../types/enum.types";
import { verifyJwtToken } from "../utils/jwt.utils";
import ENV_CONFIG from "../config/env.config";
// import mongoose from "mongoose";
import { IJwtPayload } from "../types/global.types"; // Import your payload interface here

// 1. Create a custom interface that extends the base Express Request
interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

export const authenticate = (roles?: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const cookies = req.cookies;
      const access_token = cookies["access_token"];
      if (!access_token) {
        throw new Error("Unauthroized Login");
      }
      const decoded_data = verifyJwtToken(access_token);

      if (!decoded_data) {
        throw new Error("Invalid Token. Login Required");
      }
      if (decoded_data.exp * 1000 <= Date.now()) {
        res.clearCookie("access_token", {
          httpOnly: ENV_CONFIG.NODE_ENV === "development" ? false : true,
          secure: ENV_CONFIG.NODE_ENV === "development" ? false : true,
          maxAge: Date.now(),
          sameSite: ENV_CONFIG.NODE_ENV === "development" ? "lax" : "none",
        });
        throw new Error("Token Expired");
      }
      if (roles && roles.length > 0 && !roles.includes(decoded_data.role)) {
        throw new Error("Forbidden. Access denied.");
      }
      //   req.user = decoded_data;
      authenticatedReq.user = {
        _id: decoded_data._id,
        email: decoded_data.email,
        role: decoded_data.role,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
};
