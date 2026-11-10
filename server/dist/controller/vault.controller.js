"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.changeAccess = exports.update = exports.getById = exports.getAll = exports.create = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const vault_model_1 = __importDefault(require("../models/vault.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
function validId(value) {
    const id = String(value);
    if (!mongoose_1.default.isObjectIdOrHexString(id)) {
        throw new appError_utils_1.default("Vault entry not found", 404);
    }
    return id;
}
function requireManager(allowed) {
    if (allowed !== true) {
        throw new appError_utils_1.default("Access denied", 403);
    }
}
exports.create = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    requireManager(res.locals.manageVault);
    const { title, username, password, website_url, category, notes, status } = req.body;
    const entry = await vault_model_1.default.create({
        title,
        username,
        password,
        website_url,
        category,
        notes,
        status,
        isLocked: true,
        sharedWith: [],
        updated_at: new Date(),
    });
    // Keep the response shape used by createVault() in the frontend.
    const saved = await vault_model_1.default.findById(entry._id).select("-sharedWith");
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 201,
        message: "Vault entry created",
        data: { vault: saved },
    });
});
exports.getAll = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const filter = {};
    if (res.locals.manageVault !== true) {
        filter.isLocked = false;
        filter.sharedWith = req.user._id;
    }
    const { query, category, status, sortBy, order } = req.query;
    if (typeof query === "string" && query.trim()) {
        const search = query
            .trim()
            .slice(0, 100)
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = ["title", "username", "website_url"].map((field) => ({
            [field]: { $regex: search, $options: "i" },
        }));
    }
    if (typeof category === "string" && category) {
        filter.category = category;
    }
    if (typeof status === "string" && status) {
        filter.status = status;
    }
    const sortField = sortBy === "name" ? "title" : "_id";
    const sortOrder = order === "asc" ? 1 : -1;
    const entries = await vault_model_1.default.find(filter)
        .select("title username category status website_url isLocked")
        .sort({ [sortField]: sortOrder })
        .lean();
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Vault entries fetched",
        data: entries.map((entry) => ({
            ...entry,
            // Older records are locked until a manager explicitly unlocks them.
            isLocked: entry.isLocked !== false,
        })),
    });
});
exports.getById = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const id = validId(req.params.id);
    const filter = res.locals.manageVault === true
        ? { _id: id }
        : { _id: id, isLocked: false, sharedWith: req.user._id };
    const entry = await vault_model_1.default.findOne(filter)
        .select("+password -sharedWith")
        .lean();
    if (!entry) {
        throw new appError_utils_1.default("Vault entry not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Vault entry fetched",
        data: {
            ...entry,
            isLocked: entry.isLocked !== false,
        },
    });
});
exports.update = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    requireManager(res.locals.manageVault);
    const id = validId(req.params.id);
    // Lock state and sharing can only be changed through changeAccess.
    const { title, username, password, website_url, category, notes, status } = req.body;
    const entry = await vault_model_1.default.findByIdAndUpdate(id, {
        $set: {
            title,
            username,
            password,
            website_url,
            category,
            notes,
            status,
            updated_at: new Date(),
        },
    }, { new: true, runValidators: true }).select("-sharedWith");
    if (!entry) {
        throw new appError_utils_1.default("Vault entry not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Vault entry updated",
        data: entry,
    });
});
exports.changeAccess = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    requireManager(res.locals.manageVault);
    const id = validId(req.params.id);
    const { action, email } = req.body ?? {};
    if (action === "lock" || action === "unlock") {
        const isLocked = action === "lock";
        const entry = await vault_model_1.default.findByIdAndUpdate(id, { $set: { isLocked, updated_at: new Date() } }, { new: true }).select("isLocked");
        if (!entry) {
            throw new appError_utils_1.default("Vault entry not found", 404);
        }
        (0, sendResponse_utils_1.sendResponse)(res, {
            statusCode: 200,
            message: isLocked ? "Password locked" : "Password unlocked",
            data: { isLocked: entry.isLocked },
        });
        return;
    }
    if (action !== "share") {
        throw new appError_utils_1.default("Invalid vault action", 400);
    }
    if (typeof email !== "string" || !email.trim()) {
        throw new appError_utils_1.default("Enter an account email", 400);
    }
    const recipient = await user_model_1.default.findOne({
        email: email.trim(),
    }).select("_id");
    if (!recipient) {
        throw new appError_utils_1.default("No account found with that email", 404);
    }
    const entry = await vault_model_1.default.findByIdAndUpdate(id, {
        $addToSet: { sharedWith: recipient._id },
        $set: { updated_at: new Date() },
    }, { new: true }).select("isLocked");
    if (!entry) {
        throw new appError_utils_1.default("Vault entry not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Recipient saved",
        data: { isLocked: entry.isLocked !== false },
    });
});
exports.remove = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    requireManager(res.locals.manageVault);
    const entry = await vault_model_1.default.findByIdAndDelete(validId(req.params.id));
    if (!entry) {
        throw new appError_utils_1.default("Vault entry not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Vault entry deleted",
        data: null,
    });
});
