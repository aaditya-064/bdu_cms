import express from "express";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import User from "../models/user.model";
import {
  Role,
  Admin_and_Director,
  Staff_And_Management,
} from "../types/enum.types";

import {
  create,
  getAll,
  getById,
  update,
  remove,
  setLock,
} from "../controller/file.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";

const router = express.Router();

mkdirSync("uploads", { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },

  filename: (_req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase();

    const safeExtension = /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";

    cb(null, randomUUID() + safeExtension);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.use(authenticate());

router.use(
  catchAsync(async (req, _res, next) => {
    const user = await User.findById(req.user._id).select("role");

    if (!user || !Staff_And_Management.includes(user.role as Role)) {
      throw new AppError("Access denied", 403);
    }

    req.user.role = user.role as Role;
    next();
  }),
);

const manage = catchAsync(async (req, _res, next) => {
  if (!Admin_and_Director.includes(req.user.role)) {
    throw new AppError("Access denied", 403);
  }

  next();
});

const createAllowed = catchAsync(async (req, _res, next) => {
  const roles = [Role.ADMIN, Role.DIRECTOR, Role.STAFF, Role.DIR_SUBASH];

  if (!roles.includes(req.user.role)) {
    throw new AppError("Access denied", 403);
  }

  next();
});

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

router.get("/", getAll);
router.get("/:id", getById);

router.post("/create", createAllowed, upload.single("file"), create);

router.patch("/update/:id", manage, update);
router.delete("/delete/:id", manage, remove);
router.patch("/:id/lock", manage, setLock);

export default router;
