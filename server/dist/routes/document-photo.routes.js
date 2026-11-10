"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
const sharp_1 = __importDefault(require("sharp"));
const node_crypto_1 = require("node:crypto");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const file_model_1 = __importDefault(require("../models/file.model"));
const folder_model_1 = __importDefault(require("../models/folder.model"));
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const document_access_service_1 = require("../services/document-access.service");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const router = express_1.default.Router();
const MAX_BYTES = 10 * 1024 * 1024;
const allowedRoles = ["ADMIN", "DIRECTOR", "STAFF", "DIR_SUBASH"];
const photoMarker = "private-document-photo";
const multipart = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_BYTES,
        files: 1,
        fields: 1,
        parts: 2,
        fieldSize: 1024,
    },
});
router.use((0, auth_middleware_1.authenticate)());
router.use((0, catchAsync_utils_1.catchAsync)(async (req, res, next) => {
    const account = await user_model_1.default.findById(req.user._id).select("role");
    if (!account || !allowedRoles.includes(account.role)) {
        throw new appError_utils_1.default("Access denied", 403);
    }
    req.user.role = account.role;
    res.setHeader("Cache-Control", "private, no-store");
    next();
}));
async function checkFolderAccess(id, role) {
    if (!mongoose_1.default.isObjectIdOrHexString(id)) {
        throw new appError_utils_1.default("Invalid folder", 400);
    }
    const scope = await (0, document_access_service_1.documentScope)(role);
    const folder = await folder_model_1.default.findOne({
        $and: [
            {
                _id: id,
                deletedAt: null,
            },
            scope.folderFilter,
        ],
    });
    if (!folder) {
        throw new appError_utils_1.default("Folder unavailable or access denied", 404);
    }
}
router.post("/folders/:folderId/photo", (0, catchAsync_utils_1.catchAsync)(async (req, _res, next) => {
    // Forces a CORS preflight for browser requests from another origin.
    if (req.get("X-Document-Upload") !== "1") {
        throw new appError_utils_1.default("Invalid upload request", 403);
    }
    await checkFolderAccess(String(req.params.folderId), req.user.role);
    next();
}), (req, res, next) => {
    multipart.single("file")(req, res, (error) => {
        if (error) {
            return next(new appError_utils_1.default("Upload one photo, no larger than 10 MB", 400));
        }
        next();
    });
}, (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const folderId = String(req.params.folderId);
    const name = typeof req.body?.name === "string"
        ? req.body.name.trim().replace(/\.(jpe?g|png|webp)$/i, "")
        : "";
    if (!name || name.length > 150 || /[<>:"/\\|?*\u0000-\u001f]/.test(name)) {
        throw new appError_utils_1.default("Enter a valid document name, up to 150 characters", 400);
    }
    if (!req.file?.buffer.length) {
        throw new appError_utils_1.default("Photo is required", 400);
    }
    let jpeg;
    try {
        const image = (0, sharp_1.default)(req.file.buffer, {
            limitInputPixels: 50000000,
            failOn: "error",
        });
        const metadata = await image.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
            (metadata.pages ?? 1) !== 1) {
            throw new Error("Unsupported image");
        }
        // Decode actual image data, correct phone orientation and remove metadata.
        // Keep the entire document without resizing or cropping.
        jpeg = await image
            .rotate()
            .flatten({ background: "white" })
            .jpeg({ quality: 95 })
            .toBuffer();
    }
    catch {
        throw new appError_utils_1.default("Use a valid JPG, PNG or WebP photo, up to 50 megapixels", 400);
    }
    if (jpeg.length > MAX_BYTES) {
        throw new appError_utils_1.default("Photo is too large; use a lower camera resolution", 400);
    }
    const publicId = `BDUPL/document-photos/${(0, node_crypto_1.randomUUID)()}`;
    let uploaded = false;
    try {
        await new Promise((resolve, reject) => {
            const stream = cloudinary_config_1.default.uploader.upload_stream({
                public_id: publicId,
                resource_type: "image",
                type: "authenticated",
                overwrite: false,
                timeout: 90000,
            }, (error, result) => {
                if (error || !result) {
                    reject(new appError_utils_1.default("Photo storage unavailable. Please try again", 502));
                }
                else {
                    resolve();
                }
            });
            stream.on("error", reject);
            stream.end(jpeg);
        });
        uploaded = true;
        // Recheck access because uploading can take some time.
        const account = await user_model_1.default.findById(req.user._id).select("role");
        if (!account || !allowedRoles.includes(account.role)) {
            throw new appError_utils_1.default("Access denied", 403);
        }
        await checkFolderAccess(folderId, account.role);
        const saved = await file_model_1.default.create({
            name: `${name}.jpg`,
            parentFolder: folderId,
            uploadedBy: req.user._id,
            file: {
                path: photoMarker,
                public_id: publicId,
            },
        });
        // The saved database record now owns the uploaded asset.
        uploaded = false;
        (0, sendResponse_utils_1.sendResponse)(res, {
            statusCode: 201,
            message: "Photo saved",
            data: saved,
        });
    }
    finally {
        // Avoid leaving an uploaded asset when saving its record fails.
        if (uploaded) {
            await cloudinary_config_1.default.uploader
                .destroy(publicId, {
                resource_type: "image",
                type: "authenticated",
                invalidate: true,
            })
                .catch(() => {
                console.error("Photo cleanup failed:", publicId);
            });
        }
    }
}));
router.get("/:id/photo", (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    if (!mongoose_1.default.isObjectIdOrHexString(req.params.id)) {
        throw new appError_utils_1.default("Invalid file", 400);
    }
    const scope = await (0, document_access_service_1.documentScope)(req.user.role);
    const file = await file_model_1.default.findOne({
        $and: [
            {
                _id: req.params.id,
                deletedAt: null,
                "file.path": photoMarker,
            },
            scope.fileFilter,
        ],
    });
    if (!file?.file || !file.parentFolder) {
        throw new appError_utils_1.default("Photo not found", 404);
    }
    await checkFolderAccess(String(file.parentFolder), req.user.role);
    const url = cloudinary_config_1.default.url(file.file.public_id, {
        resource_type: "image",
        type: "authenticated",
        format: "jpg",
        secure: true,
        sign_url: true,
    });
    let data;
    try {
        // The signed Cloudinary URL stays on the server.
        const response = await fetch(url, {
            signal: AbortSignal.timeout(30000),
            redirect: "error",
        });
        if (!response.ok || !response.body) {
            throw new Error("Storage unavailable");
        }
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
            while (true) {
                const chunk = await reader.read();
                if (chunk.done)
                    break;
                size += chunk.value.byteLength;
                if (size > MAX_BYTES) {
                    throw new Error("Photo too large");
                }
                chunks.push(Buffer.from(chunk.value));
            }
        }
        finally {
            await reader.cancel();
        }
        data = Buffer.concat(chunks);
    }
    catch {
        throw new appError_utils_1.default("Unable to open photo. Please try again", 502);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Photo fetched",
        data: {
            filename: file.name,
            base64: data.toString("base64"),
        },
    });
}));
exports.default = router;
