import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import Folder from "../models/folder.model";
import File from "../models/file.model";
import { documentScope } from "../services/document-access.service";
// import { isValidObjectId } from "mongoose";
// import User from "../models/user.model";
// import { describeAudit } from "../middlewares/audit.middleware";
// import { Role } from "../types/enum.types";

//* create
export const create = catchAsync(async (req, res) => {
  const { name, parentFolder, category } = req.body;

  if (!name || !name.trim()) {
    throw new AppError("Folder name is required", 400);
  }

  if (parentFolder) {
    const parent = await Folder.findOne({
      _id: parentFolder,
      deletedAt: null,
    });

    if (!parent) {
      throw new AppError("Parent folder not found", 404);
    }
  }

  const folder = await Folder.create({
    name,
    parentFolder: parentFolder || null,
    category,
    createdBy: req.user._id,
  });

  sendResponse(res, {
    message: "Folder created successfully",
    statusCode: 201,
    data: folder,
  });
});

//* update (rename or move)
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body ?? {};

  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("Invalid folder ID", 400);
  }

  if (name === undefined && category === undefined) {
    throw new AppError("Enter a folder name or category to update", 400);
  }

  const changes: { name?: string; category?: string } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 200) {
      throw new AppError("Folder name must be between 1 and 200 characters", 400);
    }
    changes.name = name.trim();
  }

  if (category !== undefined) {
    if (typeof category !== "string") {
      throw new AppError("Category must be text", 400);
    }
    changes.category = category.trim() || "General";
  }

  const folder = await Folder.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { ...changes, updatedBy: req.user._id } },
    { new: true, runValidators: true },
  ).catch((error: unknown) => {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError("Another folder in this location already has that name", 409);
    }
    throw error;
  });

  if (!folder) {
    throw new AppError("Folder not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Folder updated successfully",
    data: folder,
  });
});

export const getAll = catchAsync(async (req, res) => {
  const {
    query,
    parentFolder,
    category,
    sortBy = "date",
    order = "desc",
  } = req.query;

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

  if (category) {
    filter.category = category;
  }

  const sortField = sortBy === "name" ? "name" : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const scope = await documentScope(req.user.role);

  const folders = await Folder.find({
    $and: [filter, scope.folderFilter],
  }).sort({
    [sortField]: sortOrder,
  } as any);

  sendResponse(res, {
    message: "Folders fetched successfully",
    statusCode: 200,
    data: folders,
  });
});

//* get by id
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const scope = await documentScope(req.user.role);

  const folder = await Folder.findOne({
    $and: [{ _id: id, deletedAt: null }, scope.folderFilter],
  });

  if (!folder) {
    throw new AppError("Folder not found", 404);
  }

  const subfolders = await Folder.find({
    $and: [{ parentFolder: id, deletedAt: null }, scope.folderFilter],
  });

  const files = await File.find({
    $and: [{ parentFolder: id, deletedAt: null }, scope.fileFilter],
  });

  sendResponse(res, {
    message: `Folder:${id} fetched successfully`,
    statusCode: 200,
    data: {
      folder,
      subfolders,
      files,
    },
  });
});

//* remove (soft delete)
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const folder = await Folder.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!folder) {
    throw new AppError("Folder not found", 404);
  }

  const subfolder = await Folder.exists({
    parentFolder: id,
    deletedAt: null,
  });

  const file = await File.exists({
    parentFolder: id,
    deletedAt: null,
  });

  if (subfolder || file) {
    throw new AppError("Cannot delete a folder that is not empty", 400);
  }

  folder.deletedAt = new Date();
  folder.updatedBy = req.user._id;
  await folder.save();

  sendResponse(res, {
    message: `Folder:${id} deleted successfully`,
    statusCode: 200,
    data: null,
  });
});

export const setLock = catchAsync(async (req, res) => {
  const { isLocked } = req.body;

  if (typeof isLocked !== "boolean") {
    throw new AppError("isLocked must be true or false", 400);
  }

  const folder = await Folder.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    {
      $set: {
        isLocked,
        updatedBy: req.user._id,
      },
    },
    { new: true, runValidators: true },
  );

  if (!folder) {
    throw new AppError("Folder not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: isLocked ? "Folder locked" : "Folder unlocked",
    data: folder,
  });
});
