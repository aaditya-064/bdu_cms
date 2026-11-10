"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
//* folder schema
const folderSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "folder name is required"],
        minLength: [1, "folder name must not be empty"],
        maxLength: [200, "folder name cannot exceed 200 characters"],
        trim: true,
    },
    // Parent folder; null means root folder
    parentFolder: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "folder",
        default: null,
    },
    category: {
        type: String,
        trim: true,
        default: "General",
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "folder creator is required"],
    },
    updatedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });
//* folder indexes
folderSchema.index({ parentFolder: 1, name: 1 }, {
    unique: true,
    partialFilterExpression: {
        deletedAt: { $type: "null" },
    },
});
//* folder model
const Folder = mongoose_1.default.model("Folder", folderSchema);
exports.default = Folder;
