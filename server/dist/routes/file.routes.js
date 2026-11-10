"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const node_fs_1 = require("node:fs");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const user_model_1 = __importDefault(require("../models/user.model"));
const enum_types_1 = require("../types/enum.types");
const file_controller_1 = require("../controller/file.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const router = express_1.default.Router();
(0, node_fs_1.mkdirSync)("uploads", { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        const extension = (0, node_path_1.extname)(file.originalname).toLowerCase();
        const safeExtension = /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
        cb(null, (0, node_crypto_1.randomUUID)() + safeExtension);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
router.use((0, auth_middleware_1.authenticate)());
router.use((0, catchAsync_utils_1.catchAsync)(async (req, _res, next) => {
    const user = await user_model_1.default.findById(req.user._id).select("role");
    if (!user || !enum_types_1.Staff_And_Management.includes(user.role)) {
        throw new appError_utils_1.default("Access denied", 403);
    }
    req.user.role = user.role;
    next();
}));
const manage = (0, catchAsync_utils_1.catchAsync)(async (req, _res, next) => {
    if (!enum_types_1.Admin_and_Director.includes(req.user.role)) {
        throw new appError_utils_1.default("Access denied", 403);
    }
    next();
});
const createAllowed = (0, catchAsync_utils_1.catchAsync)(async (req, _res, next) => {
    const roles = [enum_types_1.Role.ADMIN, enum_types_1.Role.DIRECTOR, enum_types_1.Role.STAFF, enum_types_1.Role.DIR_SUBASH];
    if (!roles.includes(req.user.role)) {
        throw new appError_utils_1.default("Access denied", 403);
    }
    next();
});
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    next();
});
router.get("/", file_controller_1.getAll);
router.get("/:id", file_controller_1.getById);
router.post("/create", createAllowed, upload.single("file"), file_controller_1.create);
router.patch("/update/:id", manage, file_controller_1.update);
router.delete("/delete/:id", manage, file_controller_1.remove);
router.patch("/:id/lock", manage, file_controller_1.setLock);
exports.default = router;
