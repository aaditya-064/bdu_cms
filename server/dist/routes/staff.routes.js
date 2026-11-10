"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const staff_controller_1 = require("../controller/staff.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const enum_types_1 = require("../types/enum.types");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
router.get("/", staff_controller_1.getAll);
router.get("/:id", staff_controller_1.getById);
router.post("/create", (0, auth_middleware_1.authenticate)(enum_types_1.All_Roles), upload.single("profile_image"), staff_controller_1.create);
router.patch("/update/:id", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), upload.single("profile_image"), staff_controller_1.update);
router.delete("/delete/:id", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), staff_controller_1.remove);
exports.default = router;
