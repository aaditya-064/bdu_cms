"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.getById = exports.getAll = exports.update = exports.create = void 0;
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const folder_model_1 = __importDefault(require("../models/folder.model"));
const file_model_1 = __importDefault(require("../models/file.model"));
//* create
exports.create = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { name, parentFolder, category } = req.body;
    if (!name || !name.trim()) {
        throw new appError_utils_1.default("Folder name is required", 400);
    }
    if (parentFolder) {
        const parent = await folder_model_1.default.findOne({
            _id: parentFolder,
            deletedAt: null,
        });
        if (!parent) {
            throw new appError_utils_1.default("Parent folder not found", 404);
        }
    }
    const folder = await folder_model_1.default.create({
        name,
        parentFolder: parentFolder || null,
        category,
        createdBy: req.user._id,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Folder created successfully",
        statusCode: 201,
        data: folder,
    });
});
//* update (rename or move)
exports.update = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { name, parentFolder } = req.body;
    const existingFile = await file_model_1.default.findOne({
        _id: id,
        deletedAt: null,
    });
    if (!existingFile) {
        throw new appError_utils_1.default("File not found", 404);
    }
    if (parentFolder) {
        const folder = await folder_model_1.default.findOne({
            _id: parentFolder,
            deletedAt: null,
        });
        if (!folder) {
            throw new appError_utils_1.default("Parent folder not found", 404);
        }
    }
    const updatedFile = await file_model_1.default.findOneAndUpdate({ _id: id, deletedAt: null }, {
        $set: {
            name: name ?? existingFile.name,
            parentFolder: parentFolder ?? existingFile.parentFolder,
            updatedBy: req.user._id,
        },
    }, { new: true, runValidators: true });
    (0, sendResponse_utils_1.sendResponse)(res, {
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
exports.getAll = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { query, parentFolder, category, sortBy = "date", order = "desc", } = req.query;
    const filter = {
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
    const folders = await folder_model_1.default.find(filter).sort({
        [sortField]: sortOrder,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Folders fetched successfully",
        statusCode: 200,
        data: folders,
    });
});
//* get by id
exports.getById = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const folder = await folder_model_1.default.findOne({
        _id: id,
        deletedAt: null,
    });
    if (!folder) {
        throw new appError_utils_1.default("Folder not found", 404);
    }
    const subfolders = await folder_model_1.default.find({
        parentFolder: id,
        deletedAt: null,
    });
    const files = await file_model_1.default.find({
        parentFolder: id,
        deletedAt: null,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
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
exports.remove = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const folder = await folder_model_1.default.findOne({
        _id: id,
        deletedAt: null,
    });
    if (!folder) {
        throw new appError_utils_1.default("Folder not found", 404);
    }
    const subfolder = await folder_model_1.default.exists({
        parentFolder: id,
        deletedAt: null,
    });
    const file = await file_model_1.default.exists({
        parentFolder: id,
        deletedAt: null,
    });
    if (subfolder || file) {
        throw new appError_utils_1.default("Cannot delete a folder that is not empty", 400);
    }
    folder.deletedAt = new Date();
    folder.updatedBy = req.user._id;
    await folder.save();
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `Folder:${id} deleted successfully`,
        statusCode: 200,
        data: null,
    });
});
