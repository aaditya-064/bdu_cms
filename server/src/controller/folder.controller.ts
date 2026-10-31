import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import Folder from "../models/folder.model";
import File from "../models/file.model";

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
// GET /folders?sortBy=date&order=desc
// GET /folders?sortBy=name&order=asc
// GET /folders?query=reports
// GET /folders?parentFolder=root
// GET /folders?parentFolder=folderId

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

  const folders = await Folder.find(filter).sort({
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

  const folder = await Folder.findOne({
    _id: id,
    deletedAt: null,
  });

  if (!folder) {
    throw new AppError("Folder not found", 404);
  }

  const subfolders = await Folder.find({
    parentFolder: id,
    deletedAt: null,
  });

  const files = await File.find({
    parentFolder: id,
    deletedAt: null,
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
