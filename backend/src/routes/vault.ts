import { Router, Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth.js";
import { VaultRecord } from "../models/VaultRecord.js";
import { encrypt, decrypt } from "../services/encryption.js";
import { createAuditLog } from "../services/auditService.js";

const router = Router();

// GET /api/vault
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category as string;

    const records = await VaultRecord.find(filter)
      .select("-encryptedPassword")
      .sort({ category: 1, title: 1 })
      .populate("createdBy", "name email");

    res.json({ records });
  } catch (err) {
    console.error("Get vault records error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vault/categories
router.get(
  "/categories",
  authenticate,
  async (_req: AuthRequest, res: Response) => {
    try {
      const categories = await VaultRecord.distinct("category");
      res.json({ categories: categories.filter(Boolean).sort() });
    } catch (err) {
      console.error("Get vault categories error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /api/vault
router.post(
  "/",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, category, username, password, url, notes } = req.body;

      if (!title || !category || !password) {
        res
          .status(400)
          .json({ error: "Title, category, and password are required" });
        return;
      }

      const encryptedPassword = encrypt(password);

      const record = await VaultRecord.create({
        title: title.trim(),
        category: category.trim(),
        username: (username || "").trim(),
        encryptedPassword,
        url: (url || "").trim(),
        notes: (notes || "").trim(),
        createdBy: req.user!._id,
      });

      await createAuditLog({
        userId: req.user!._id,
        userName: req.user!.name,
        action: "VAULT_CREATE",
        resourceType: "vault",
        resourceId: record._id.toString(),
        resourceLabel: record.title,
        metadata: { category: record.category },
        ipAddress: req.ip,
      });

      // Return without encrypted password
      const safeRecord = record.toObject();
      delete safeRecord.encryptedPassword;
      res.status(201).json({ record: safeRecord });
    } catch (err) {
      console.error("Create vault record error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PUT /api/vault/:id
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, category, username, password, url, notes } = req.body;
      const record = await VaultRecord.findById(req.params.id);
      if (!record) {
        res.status(404).json({ error: "Vault record not found" });
        return;
      }

      if (title) record.title = title.trim();
      if (category) record.category = category.trim();
      if (username !== undefined) record.username = username.trim();
      if (password) record.encryptedPassword = encrypt(password);
      if (url !== undefined) record.url = url.trim();
      if (notes !== undefined) record.notes = notes.trim();

      await record.save();

      await createAuditLog({
        userId: req.user!._id,
        userName: req.user!.name,
        action: "VAULT_UPDATE",
        resourceType: "vault",
        resourceId: record._id.toString(),
        resourceLabel: record.title,
        ipAddress: req.ip,
      });

      const safeRecord = record.toObject();
      delete safeRecord.encryptedPassword;
      res.json({ record: safeRecord });
    } catch (err) {
      console.error("Update vault record error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// DELETE /api/vault/:id
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const record = await VaultRecord.findById(req.params.id);
      if (!record) {
        res.status(404).json({ error: "Vault record not found" });
        return;
      }

      await createAuditLog({
        userId: req.user!._id,
        userName: req.user!.name,
        action: "VAULT_DELETE",
        resourceType: "vault",
        resourceId: record._id.toString(),
        resourceLabel: record.title,
        ipAddress: req.ip,
      });

      await VaultRecord.findByIdAndDelete(record._id);
      res.json({ message: "Vault record deleted" });
    } catch (err) {
      console.error("Delete vault record error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /api/vault/:id/reveal
router.post(
  "/:id/reveal",
  authenticate,
  // requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const record = await VaultRecord.findById(req.params.id);
      if (!record) {
        res.status(404).json({ error: "Vault record not found" });
        return;
      }

      const password = decrypt(record.encryptedPassword);

      // Update last access
      record.lastAccessedBy = new mongoose.Types.ObjectId(req.user!._id);
      record.lastAccessedAt = new Date();
      await record.save();

      await createAuditLog({
        userId: req.user!._id,
        userName: req.user!.name,
        action: "VAULT_REVEAL",
        resourceType: "vault",
        resourceId: record._id.toString(),
        resourceLabel: record.title,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ password });
    } catch (err) {
      console.error("Reveal vault record error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
