import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

import { authenticate } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import File from "../models/file.model";
import Folder from "../models/folder.model";
import cloudinary from "../config/cloudinary.config";
import { Role } from "../types/enum.types";
import { documentScope } from "../services/document-access.service";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import { sendResponse } from "../utils/sendResponse.utils";

const router = express.Router();

const MAX_BYTES = 10 * 1024 * 1024;
const allowedRoles = ["ADMIN", "DIRECTOR", "STAFF", "DIR_SUBASH"];
const photoMarker = "private-document-photo";

const multipart = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_BYTES,
    files: 1,
    fields: 1,
    parts: 2,
    fieldSize: 1024,
  },
});

router.use(authenticate());

router.use(
  catchAsync(async (req, res, next) => {
    const account = await User.findById(req.user._id).select("role");

    if (!account || !allowedRoles.includes(account.role)) {
      throw new AppError("Access denied", 403);
    }

    req.user.role = account.role as Role;

    res.setHeader("Cache-Control", "private, no-store");
    next();
  }),
);

async function checkFolderAccess(id: string, role: Role) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("Invalid folder", 400);
  }

  const scope = await documentScope(role);

  const folder = await Folder.findOne({
    $and: [
      {
        _id: id,
        deletedAt: null,
      },
      scope.folderFilter,
    ],
  });

  if (!folder) {
    throw new AppError("Folder unavailable or access denied", 404);
  }
}

router.post(
  "/folders/:folderId/photo",

  catchAsync(async (req, _res, next) => {
    // Forces a CORS preflight for browser requests from another origin.
    if (req.get("X-Document-Upload") !== "1") {
      throw new AppError("Invalid upload request", 403);
    }

    await checkFolderAccess(String(req.params.folderId), req.user.role);

    next();
  }),

  (req, res, next) => {
    multipart.single("file")(req, res, (error) => {
      if (error) {
        return next(
          new AppError("Upload one photo, no larger than 10 MB", 400),
        );
      }

      next();
    });
  },

  catchAsync(async (req, res) => {
    const folderId = String(req.params.folderId);

    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim().replace(/\.(jpe?g|png|webp)$/i, "")
        : "";

    if (!name || name.length > 150 || /[<>:"/\\|?*\u0000-\u001f]/.test(name)) {
      throw new AppError(
        "Enter a valid document name, up to 150 characters",
        400,
      );
    }

    if (!req.file?.buffer.length) {
      throw new AppError("Photo is required", 400);
    }

    let jpeg: Buffer;

    try {
      const image = sharp(req.file.buffer, {
        limitInputPixels: 50_000_000,
        failOn: "error",
      });

      const metadata = await image.metadata();

      if (
        !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
        (metadata.pages ?? 1) !== 1
      ) {
        throw new Error("Unsupported image");
      }

      // Decode actual image data, correct phone orientation and remove metadata.
      // Keep the entire document without resizing or cropping.
      jpeg = await image
        .rotate()
        .flatten({ background: "white" })
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch {
      throw new AppError(
        "Use a valid JPG, PNG or WebP photo, up to 50 megapixels",
        400,
      );
    }

    if (jpeg.length > MAX_BYTES) {
      throw new AppError(
        "Photo is too large; use a lower camera resolution",
        400,
      );
    }

    const publicId = `BDUPL/document-photos/${randomUUID()}`;
    let uploaded = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: "image",
            type: "authenticated",
            overwrite: false,
            timeout: 90_000,
          },
          (error, result) => {
            if (error || !result) {
              reject(
                new AppError(
                  "Photo storage unavailable. Please try again",
                  502,
                ),
              );
            } else {
              resolve();
            }
          },
        );

        stream.on("error", reject);
        stream.end(jpeg);
      });

      uploaded = true;

      // Recheck access because uploading can take some time.
      const account = await User.findById(req.user._id).select("role");

      if (!account || !allowedRoles.includes(account.role)) {
        throw new AppError("Access denied", 403);
      }

      await checkFolderAccess(folderId, account.role as Role);

      const saved = await File.create({
        name: `${name}.jpg`,
        parentFolder: folderId,
        uploadedBy: req.user._id,
        file: {
          path: photoMarker,
          public_id: publicId,
        },
      });

      // The saved database record now owns the uploaded asset.
      uploaded = false;

      sendResponse(res, {
        statusCode: 201,
        message: "Photo saved",
        data: saved,
      });
    } finally {
      // Avoid leaving an uploaded asset when saving its record fails.
      if (uploaded) {
        await cloudinary.uploader
          .destroy(publicId, {
            resource_type: "image",
            type: "authenticated",
            invalidate: true,
          })
          .catch(() => {
            console.error("Photo cleanup failed:", publicId);
          });
      }
    }
  }),
);

router.get(
  "/:id/photo",

  catchAsync(async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      throw new AppError("Invalid file", 400);
    }

    const scope = await documentScope(req.user.role);

    const file = await File.findOne({
      $and: [
        {
          _id: req.params.id,
          deletedAt: null,
          "file.path": photoMarker,
        },
        scope.fileFilter,
      ],
    });

    if (!file?.file || !file.parentFolder) {
      throw new AppError("Photo not found", 404);
    }

    await checkFolderAccess(String(file.parentFolder), req.user.role);

    const url = cloudinary.url(file.file.public_id, {
      resource_type: "image",
      type: "authenticated",
      format: "jpg",
      secure: true,
      sign_url: true,
    });

    let data: Buffer;

    try {
      // The signed Cloudinary URL stays on the server.
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        redirect: "error",
      });

      if (!response.ok || !response.body) {
        throw new Error("Storage unavailable");
      }

      const reader = response.body.getReader();
      const chunks: Buffer[] = [];
      let size = 0;

      try {
        while (true) {
          const chunk = await reader.read();

          if (chunk.done) break;

          size += chunk.value.byteLength;

          if (size > MAX_BYTES) {
            throw new Error("Photo too large");
          }

          chunks.push(Buffer.from(chunk.value));
        }
      } finally {
        await reader.cancel();
      }

      data = Buffer.concat(chunks);
    } catch {
      throw new AppError("Unable to open photo. Please try again", 502);
    }

    sendResponse(res, {
      statusCode: 200,
      message: "Photo fetched",
      data: {
        filename: file.name,
        base64: data.toString("base64"),
      },
    });
  }),
);

export default router;
