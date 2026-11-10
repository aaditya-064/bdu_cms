"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const folder_controller_1 = require("../controller/folder.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const enum_types_1 = require("../types/enum.types");
const router = express_1.default.Router();
router.use((0, auth_middleware_1.authenticate)(enum_types_1.Staff_And_Management));
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    next();
});
router.get("/", folder_controller_1.getAll);
router.get("/:id", folder_controller_1.getById);
router.post("/create", (0, auth_middleware_1.authenticate)(enum_types_1.All_Roles), folder_controller_1.create);
router.patch("/update/:id", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), folder_controller_1.update);
router.delete("/delete/:id", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), folder_controller_1.remove);
router.patch("/:id/lock", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), folder_controller_1.setLock);
exports.default = router;
