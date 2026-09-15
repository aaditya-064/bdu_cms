import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AuditLog } from '../models/AuditLog.js';

const router = Router();

// GET /api/audit-logs
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', action, userId, resourceType, startDate, endDate } = req.query;

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action as string;
    if (userId) filter.userId = userId as string;
    if (resourceType) filter.resourceType = resourceType as string;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (filter.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email'),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs: logs.map((log) => ({
        _id: log._id,
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        resourceLabel: log.resourceLabel,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
