import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import File from "../models/file.model";
import { upload } from "../utils/cloudinary.utils";
import path from "path";

//* create
export const create = catchAsync(async (req, res) => {
  const file = req.file;
  const { name, parentFolder } = req.body;

  if (!file) {
    throw new AppError("File is required", 400);
  }

  const uploaded = await upload(file);

  const newFile = await File.create({
    name: name || file.originalname,
    originalName: file.originalname,
    parentFolder: parentFolder || null,
    mimeType: file.mimetype,
    extension: path.extname(file.originalname).slice(1),
    size: file.size,
    publicId: uploaded.public_id,
    resourceType: "image",
    url: uploaded.path,
    uploadedBy: req.user._id,
  });

  sendResponse(res, {
    message: "File uploaded successfully",
    statusCode: 201,
    data: newFile,
  });
});

//* update (rename or move)
export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, parentFolder } = req.body;

  const file = await File.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!file) {
    throw new AppError("File not found", 404);
  }

  const updatedFile = await File.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(name !== undefined && { name }),
        ...(parentFolder !== undefined && { parentFolder }),
        updatedBy: req.user._id,
      },
    },
    { new: true, runValidators: true },
  );

  sendResponse(res, {
    message: `File:${id} updated successfully`,
    statusCode: 200,
    data: updatedFile,
  });
});

//* get all
// GET /files?sortBy=date&order=desc
// GET /files?sortBy=name&order=asc
// GET /files?sortBy=size&order=desc
// GET /files?query=report
// GET /files?parentFolder=folderId

export const getAll = catchAsync(async (req, res) => {
  const {
    query,
    parentFolder,
    mimeType,
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

  if (mimeType) {
    filter.mimeType = mimeType;
  }

  const sortField =
    sortBy === "name" ? "name" : sortBy === "size" ? "size" : "createdAt";

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
