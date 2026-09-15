import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    User.findById(decoded.userId).then((user) => {
      if (!user || !user.isActive) {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }
      req.user = {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
      next();
    }).catch(() => {
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function requireStaffOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  next();
}
