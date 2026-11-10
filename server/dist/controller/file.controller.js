"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLock = exports.remove = exports.getById = exports.getAll = exports.update = exports.create = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const promises_1 = require("node:fs/promises");
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const file_model_1 = __importDefault(require("../models/file.model"));
const folder_model_1 = __importDefault(require("../models/folder.model"));
const cloudinary_utils_1 = require("../utils/cloudinary.utils");
const document_access_service_1 = require("../services/document-access.service");
exports.create = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const file = req.file;
    if (!file) {
        throw new appError_utils_1.default("File is required", 400);
    }
    try {
        const { name, parentFolder } = req.body;
        if (name !== undefined &&
            (typeof name !== "string" || !name.trim() || name.trim().length > 255)) {
            throw new appError_utils_1.default("Enter a valid file name", 400);
        }
        if (parentFolder) {
            if (typeof parentFolder !== "string" ||
                !mongoose_1.default.isObjectIdOrHexString(parentFolder)) {
                throw new appError_utils_1.default("Invalid folder", 400);
            }
            const scope = await (0, document_access_service_1.documentScope)(req.user.role);
            const folder = await folder_model_1.default.findOne({
                $and: [
                    {
                        _id: parentFolder,
                        deletedAt: null,
                    },
                    scope.folderFilter,
                ],
            });
            if (!folder) {
                throw new appError_utils_1.default("Folder unavailable or access denied", 404);
            }
        }
        const { path, public_id } = await (0, cloudinary_utils_1.upload)(file, "/files", true);
        const newFile = await file_model_1.default.create({
            name: name?.trim() || file.originalname,
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
    }
    finally {
        await (0, promises_1.unlink)(file.path).catch(() => undefined);
    }
});
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
    const updatedFile = await file_model_1.default.findOneAndUpdate({
        _id: id,
        deletedAt: null,
    }, {
        $set: {
            name: name ?? existingFile.name,
            parentFolder: parentFolder ?? existingFile.parentFolder,
            updatedBy: req.user._id,
        },
    }, {
        new: true,
        runValidators: true,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "File updated successfully",
        statusCode: 200,
        data: updatedFile,
    });
});
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
    const scope = await (0, document_access_service_1.documentScope)(req.user.role);
    const files = await file_model_1.default.find({
        $and: [filter, scope.fileFilter],
    }).sort({
        [sortField]: sortOrder,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Files fetched successfully",
        statusCode: 200,
        data: files,
    });
});
exports.getById = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const scope = await (0, document_access_service_1.documentScope)(req.user.role);
    const file = await file_model_1.default.findOne({
        $and: [
            {
                _id: req.params.id,
                deletedAt: null,
            },
            scope.fileFilter,
        ],
    });
    if (!file) {
        throw new appError_utils_1.default("File not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "File fetched successfully",
        statusCode: 200,
        data: file,
    });
});
exports.remove = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const file = await file_model_1.default.findOneAndUpdate({
        _id: req.params.id,
        deletedAt: null,
    }, {
        $set: {
            deletedAt: new Date(),
            updatedBy: req.user._id,
        },
    }, {
        new: true,
    });
    if (!file) {
        throw new appError_utils_1.default("File not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "File deleted successfully",
        statusCode: 200,
        data: null,
    });
});
exports.setLock = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { isLocked } = req.body;
    if (typeof isLocked !== "boolean") {
        throw new appError_utils_1.default("isLocked must be true or false", 400);
    }
    const file = await file_model_1.default.findOneAndUpdate({
        _id: req.params.id,
        deletedAt: null,
    }, {
        $set: {
            isLocked,
            updatedBy: req.user._id,
        },
    }, {
        new: true,
        runValidators: true,
    });
    if (!file) {
        throw new appError_utils_1.default("File not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: isLocked ? "File locked" : "File unlocked",
        data: file,
    });
});
