import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { importData } from '../services/importService.js';
import { createAuditLog } from '../services/auditService.js';
import { config } from '../config/index.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.xlsx', '.xls', '.csv', '.json'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

// POST /api/import/:type
router.post('/:type', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    if (!['sales', 'purchases', 'expenses'].includes(type)) {
      res.status(400).json({ error: 'Invalid import type. Must be sales, purchases, or expenses.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const result = await importData(
      req.file.buffer,
      req.file.originalname,
      type as 'sales' | 'purchases' | 'expenses',
      req.user!._id
    );

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'DATA_IMPORT',
      resourceType: type,
      resourceLabel: req.file.originalname,
      metadata: {
        totalRows: result.totalRows,
        imported: result.imported,
        duplicates: result.duplicates,
        invalid: result.invalid,
        qualityScore: result.qualityScore,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      type,
      fileName: req.file.originalname,
      ...result,
    });
  } catch (err) {
    console.error('Import error:', err);
    const message = err instanceof Error ? err.message : 'Import failed';
    res.status(400).json({ error: message });
  }
});

export default router;
