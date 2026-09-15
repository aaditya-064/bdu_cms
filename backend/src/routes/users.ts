import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

// GET /api/users
router.get('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
    });

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'USER_CREATE',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceLabel: user.name,
      metadata: { role: user.role },
      ipAddress: req.ip,
    });

    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.passwordHash = await bcrypt.hash(password, 12);

    await user.save();

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'USER_UPDATE',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceLabel: user.name,
      ipAddress: req.ip,
    });

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.user!._id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'USER_DELETE',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceLabel: user.name,
      ipAddress: req.ip,
    });

    await User.findByIdAndDelete(user._id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
