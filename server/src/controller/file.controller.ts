import mongoose from "mongoose";
import { unlink } from "node:fs/promises";

import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import File from "../models/file.model";
import Folder from "../models/folder.model";
import { upload } from "../utils/cloudinary.utils";
import { documentScope } from "../services/document-access.service";

export const create = catchAsync(async (req, res) => {
  const file = req.file;

  if (!file) {
    throw new AppError("File is required", 400);
  }

  try {
    const { name, parentFolder } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim() || name.trim().length > 255)
    ) {
      throw new AppError("Enter a valid file name", 400);
    }

    if (parentFolder) {
      if (
        typeof parentFolder !== "string" ||
        !mongoose.isObjectIdOrHexString(parentFolder)
      ) {
        throw new AppError("Invalid folder", 400);
      }

      const scope = await documentScope(req.user.role);

      const folder = await Folder.findOne({
        $and: [
          {
            _id: parentFolder,
            deletedAt: null,
          },
          scope.folderFilter,
        ],
      });

      if (!folder) {
        throw new AppError("Folder unavailable or access denied", 404);
      }
    }

    const { path, public_id } = await upload(file, "/files", true);

    const newFile = await File.create({
      name: name?.trim() || file.originalname,
      parentFolder: parentFolder || null,
      file: {
        path,
        public_id,
      },
      uploadedBy: req.user._id,
    });

    sendResponse(res, {
      message: "File created successfully",
      statusCode: 201,
      data: newFile,
    });
  } finally {
    await unlink(file.path).catch(() => undefined);
  }
});

export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, parentFolder } = req.body;

  const existingFile = await File.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!existingFile) {
    throw new AppError("File not found", 404);
  }

  if (parentFolder) {
    const folder = await Folder.findOne({
      _id: parentFolder,
      deletedAt: null,
    });

    if (!folder) {
      throw new AppError("Parent folder not found", 404);
    }
  }

  const updatedFile = await File.findOneAndUpdate(
    {
      _id: id,
      deletedAt: null,
    },
    {
      $set: {
        name: name ?? existingFile.name,
        parentFolder: parentFolder ?? existingFile.parentFolder,
        updatedBy: req.user._id,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  sendResponse(res, {
    message: "File updated successfully",
    statusCode: 200,
    data: updatedFile,
  });
});

export const getAll = catchAsync(async (req, res) => {
  const { query, parentFolder, sortBy = "date", order = "desc" } = req.query;

  const filter: any = {
    deletedAt: null,
  };

  if (query) {
    filter.name = {
      $regex: query,
      $options: "i",
    };
  }

  if (parentFolder) {
    filter.parentFolder = parentFolder === "root" ? null : parentFolder;
  }

  const sortField = sortBy === "name" ? "name" : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;
  const scope = await documentScope(req.user.role);

  const files = await File.find({
    $and: [filter, scope.fileFilter],
  }).sort({
    [sortField]: sortOrder,
  } as any);

  sendResponse(res, {
    message: "Files fetched successfully",
    statusCode: 200,
    data: files,
  });
});

export const getById = catchAsync(async (req, res) => {
  const scope = await documentScope(req.user.role);

  const file = await File.findOne({
    $and: [
      {
        _id: req.params.id,
        deletedAt: null,
      },
      scope.fileFilter,
    ],
  });

  if (!file) {
    throw new AppError("File not found", 404);
  }

  sendResponse(res, {
    message: "File fetched successfully",
    statusCode: 200,
    data: file,
  });
});

export const remove = catchAsync(async (req, res) => {
  const file = await File.findOneAndUpdate(
    {
      _id: req.params.id,
      deletedAt: null,
    },
    {
      $set: {
        deletedAt: new Date(),
        updatedBy: req.user._id,
      },
    },
    {
      new: true,
    },
  );

  if (!file) {
    throw new AppError("File not found", 404);
  }

  sendResponse(res, {
    message: "File deleted successfully",
    statusCode: 200,
    data: null,
  });
});

export const setLock = catchAsync(async (req, res) => {
  const { isLocked } = req.body;

  if (typeof isLocked !== "boolean") {
    throw new AppError("isLocked must be true or false", 400);
  }

  const file = await File.findOneAndUpdate(
    {
      _id: req.params.id,
      deletedAt: null,
    },
    {
      $set: {
        isLocked,
        updatedBy: req.user._id,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!file) {
    throw new AppError("File not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: isLocked ? "File locked" : "File unlocked",
    data: file,
  });
});
