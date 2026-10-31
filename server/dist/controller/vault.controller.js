"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.getById = exports.getAll = exports.update = exports.create = void 0;
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const vault_model_1 = __importDefault(require("../models/vault.model"));
// title: String;
// username: String;
// password: String;
// website_url: String;
// category: String;
// notes: String;
// status: String;
// updated_at: Date;
exports.create = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { title, username, password, website_url, category, notes, status } = req.body;
    if (!username && !password && !!title) {
        throw new appError_utils_1.default("Every field is required", 400);
    }
    const vault = await vault_model_1.default.create({
        title,
        username,
        password,
        website_url,
        category,
        notes,
        status,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Vault added successfully",
        statusCode: 201,
        data: {
            vault,
        },
    });
});
exports.update = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { title, username, password, website_url, category, notes, status } = req.body;
    const existingVault = await vault_model_1.default.findById(id);
    if (!existingVault) {
        throw new appError_utils_1.default("Vault not found", 404);
    }
    const newVault = await vault_model_1.default.findOneAndUpdate({ _id: id }, {
        $set: {
            title: title,
            username: username,
            password: password,
            website_url: website_url,
            category: category,
            notes: notes,
            status: status,
        },
    }, { new: true, runValidators: true });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `${id} has been updated successfully`,
        statusCode: 201,
        data: newVault,
    });
});
// GET /vault?sortBy=date&order=desc — Newest first
// GET /vault?sortBy=date&order=asc — Oldest first
// GET /vault?sortBy=name&order=asc — A to Z
// GET /vault?sortBy=name&order=desc — Z to A
// GET /vault?query=google — Search vaults
exports.getAll = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { query, category, status, sortBy = "date", order = "desc", } = req.query;
    const filter = {};
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } },
            { website_url: { $regex: query, $options: "i" } },
        ];
    }
    if (category) {
        filter.category = category;
    }
    if (status) {
        filter.status = status;
    }
    const sortField = sortBy === "name" ? "title" : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const vaults = await vault_model_1.default.find(filter).sort({
        [sortField]: sortOrder,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        data: vaults,
        message: "Vaults fetched successfully",
        statusCode: 200,
    });
});
exports.getById = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const vault = await vault_model_1.default.findById(id);
    if (!vault) {
        throw new appError_utils_1.default("Vault not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        data: vault,
        message: `Vault:${id} fetched successfully`,
        statusCode: 200,
    });
});
exports.remove = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const vault = await vault_model_1.default.findByIdAndDelete(id);
    if (!vault) {
        throw new appError_utils_1.default("Vault not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `Vault:${id} deleted successfully`,
        statusCode: 200,
        data: null,
    });
});
