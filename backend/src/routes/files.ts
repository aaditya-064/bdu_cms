import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { FileRecord, Folder } from '../models/FileRecord.js';
import { createAuditLog } from '../services/auditService.js';
import { config } from '../config/index.js';

const router = Router();

// Ensure upload directory exists
if (!existsSync(config.uploadDir)) {
  fs.mkdir(config.uploadDir, { recursive: true }).catch(console.error);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
});

// GET /api/files/folders
router.get('/folders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { parentId } = req.query;
    const filter = parentId ? { parentId: parentId as string } : { parentId: null };
    const folders = await Folder.find(filter).sort({ name: 1 });
    res.json({ folders });
  } catch (err) {
    console.error('Get folders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/files/folders
router.post('/folders', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, parentId } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }
    const folder = await Folder.create({
      name: name.trim(),
      parentId: parentId || null,
      createdBy: req.user!._id,
    });

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'FOLDER_CREATE',
      resourceType: 'folder',
      resourceId: folder._id.toString(),
      resourceLabel: folder.name,
      ipAddress: req.ip,
    });

    res.status(201).json({ folder });
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/files/folders/:id
router.put('/folders/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Folder name is required' });
      return;
    }
    const folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'FOLDER_RENAME',
      resourceType: 'folder',
      resourceId: folder._id.toString(),
      resourceLabel: folder.name,
      ipAddress: req.ip,
    });

    res.json({ folder });
  } catch (err) {
    console.error('Rename folder error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/files/folders/:id
router.delete('/folders/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      res.status(404).json({ error: 'Folder not found' });
      return;
    }

    // Delete all files in folder
    const files = await FileRecord.find({ folderId: folder._id });
    for (const file of files) {
      try {
        await fs.unlink(file.storagePath);
      } catch {
        // File may not exist on disk
      }
    }
    await FileRecord.deleteMany({ folderId: folder._id });

    // Delete subfolders recursively
    const subfolders = await Folder.find({ parentId: folder._id });
    for (const sub of subfolders) {
      const subFiles = await FileRecord.find({ folderId: sub._id });
      for (const file of subFiles) {
        try {
          await fs.unlink(file.storagePath);
        } catch {
          // ignore
        }
      }
      await FileRecord.deleteMany({ folderId: sub._id });
    }
    await Folder.deleteMany({ parentId: folder._id });

    await Folder.findByIdAndDelete(folder._id);

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'FOLDER_DELETE',
      resourceType: 'folder',
      resourceId: folder._id.toString(),
      resourceLabel: folder.name,
      ipAddress: req.ip,
    });

    res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/files
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { folderId } = req.query;
    const filter = folderId ? { folderId: folderId as string } : { folderId: null };
    const files = await FileRecord.find(filter).sort({ createdAt: -1 }).populate('uploadedBy', 'name email');
    res.json({ files });
  } catch (err) {
    console.error('Get files error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/files/upload
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { folderId } = req.body;
    const fileRecord = await FileRecord.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      folderId: folderId || null,
      uploadedBy: req.user!._id,
    });

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'FILE_UPLOAD',
      resourceType: 'file',
      resourceId: fileRecord._id.toString(),
      resourceLabel: fileRecord.originalName,
      metadata: { size: fileRecord.size, mimeType: fileRecord.mimeType },
      ipAddress: req.ip,
    });

    res.status(201).json({ file: fileRecord });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/files/:id/download
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await FileRecord.findById(req.params.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    if (!existsSync(file.storagePath)) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    res.download(file.storagePath, file.originalName);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/files/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const file = await FileRecord.findById(req.params.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    try {
      await fs.unlink(file.storagePath);
    } catch {
      // File may not exist
    }

    await FileRecord.findByIdAndDelete(file._id);

    await createAuditLog({
      userId: req.user!._id,
      userName: req.user!.name,
      action: 'FILE_DELETE',
      resourceType: 'file',
      resourceId: file._id.toString(),
      resourceLabel: file.originalName,
      ipAddress: req.ip,
    });

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
