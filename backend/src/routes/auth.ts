import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: 'Account is deactivated' });
      return;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      action: 'LOGIN',
      resourceType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'LOGOUT',
      resourceType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
