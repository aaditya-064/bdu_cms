import multer, { FileFilterCallback } from "multer";
import fs from "fs";
import { Request } from "express";
import AppError from "../utils/appError.utils";

export const uploader = () => {
  const folder = "uploads/";
  const file_size = 5 * 1024 * 1024; // 5MB

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  //* multer disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const file_name = Date.now() + "-" + file.originalname;
      cb(null, file_name);
    },
  });

  //* file  filter
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    const allowed_mime_types = [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "application/pdf",
    ];

    if (!allowed_mime_types.includes(file.mimetype)) {
      callback(new AppError(`${file.mimetype} is not allowed`, 422));
    } else {
      callback(null, true);
    }
  };

  //* multer upload instance
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: file_size,
    },
  });

  return upload;
};
