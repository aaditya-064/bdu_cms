"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.getById = exports.getAll = exports.update = exports.create = void 0;
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const file_model_1 = __importDefault(require("../models/file.model"));
const folder_model_1 = __importDefault(require("../models/folder.model"));
const cloudinary_utils_1 = require("../utils/cloudinary.utils");
//* create
exports.create = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { name, parentFolder } = req.body;
    const file = req.file;
    if (!file) {
        throw new appError_utils_1.default("File is required", 400);
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
    const { path, public_id } = await (0, cloudinary_utils_1.upload)(file);
    const newFile = await file_model_1.default.create({
        name: name || file.originalname,
        parentFolder: parentFolder || null,
        file: {
            path,
            public_id,
        },
        uploadedBy: req.user._id,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "File created successfully",
        statusCode: 201,
        data: newFile,
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
// GET /files?sortBy=date&order=desc
// GET /files?sortBy=date&order=asc
// GET /files?sortBy=name&order=asc
// GET /files?sortBy=name&order=desc
// GET /files?query=report
// GET /files?parentFolder=root
// GET /files?parentFolder=folderId
exports.getAll = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { query, parentFolder, sortBy = "date", order = "desc" } = req.query;
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
    const sortField = sortBy === "name" ? "name" : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const files = await file_model_1.default.find(filter).sort({
        [sortField]: sortOrder,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Files fetched successfully",
        statusCode: 200,
        data: files,
    });
});
//* get by id
exports.getById = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const file = await file_model_1.default.findOne({
        _id: id,
        deletedAt: null,
    });
    if (!file) {
        throw new appError_utils_1.default("File not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `File:${id} fetched successfully`,
        statusCode: 200,
        data: file,
    });
});
//* remove (soft delete)
exports.remove = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const file = await file_model_1.default.findOneAndUpdate({
        _id: id,
        deletedAt: null,
    }, {
        $set: {
            deletedAt: new Date(),
            updatedBy: req.user._id,
        },
    }, { new: true });
    if (!file) {
        throw new appError_utils_1.default("File not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `File:${id} deleted successfully`,
        statusCode: 200,
        data: null,
    });
});
