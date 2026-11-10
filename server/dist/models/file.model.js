"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const image_model_1 = __importDefault(require("./image.model"));
//* file schema
const fileSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "file name is required"],
        trim: true,
        maxLength: [255, "file name cannot exceed 255 characters"],
    },
    parentFolder: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Folder",
        default: null,
    },
    file: {
        type: image_model_1.default,
        required: [true, "file is required"],
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    uploadedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "file uploader is required"],
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
//* file indexes
fileSchema.index({ parentFolder: 1, name: 1 });
fileSchema.index({ "file.public_id": 1 }, { unique: true });
//* file model
const File = mongoose_1.default.model("file", fileSchema);
exports.default = File;
