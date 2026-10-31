import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import File from "../models/file.model";
import Folder from "../models/folder.model";
import { upload } from "../utils/cloudinary.utils";

//* create

export const create = catchAsync(async (req, res) => {
  const { name, parentFolder } = req.body;
  const file = req.file;

  if (!file) {
    throw new AppError("File is required", 400);
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

  const { path, public_id } = await upload(file);

  const newFile = await File.create({
    name: name || file.originalname,
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
});

//* update (rename or move)
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
    { _id: id, deletedAt: null },
    {
      $set: {
        name: name ?? existingFile.name,
        parentFolder: parentFolder ?? existingFile.parentFolder,
        updatedBy: req.user._id,
      },
    },
    { new: true, runValidators: true },
  );

  sendResponse(res, {
    message: "File updated successfully",
    statusCode: 200,
    data: updatedFile,
  });
});

//* get all
// GET /files?sortBy=date&order=desc
// GET /files?sortBy=date&order=asc
// GET /files?sortBy=name&order=asc
// GET /files?sortBy=name&order=desc
// GET /files?query=report
// GET /files?parentFolder=root
// GET /files?parentFolder=folderId

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

  const files = await File.find(filter).sort({
    [sortField]: sortOrder,
  } as any);

  sendResponse(res, {
    message: "Files fetched successfully",
    statusCode: 200,
    data: files,
  });
});

//* get by id
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const file = await File.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!file) {
    throw new AppError("File not found", 404);
  }

  sendResponse(res, {
    message: `File:${id} fetched successfully`,
    statusCode: 200,
    data: file,
  });
});

//* remove (soft delete)
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const file = await File.findOneAndUpdate(
    {
      _id: id,
      deletedAt: null,
    },
    {
      $set: {
        deletedAt: new Date(),
        updatedBy: req.user._id,
      },
    },
    { new: true },
  );

  if (!file) {
    throw new AppError("File not found", 404);
  }

  sendResponse(res, {
    message: `File:${id} deleted successfully`,
    statusCode: 200,
    data: null,
  });
});
