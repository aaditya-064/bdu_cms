"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vault_controller_1 = require("../controller/vault.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const enum_types_1 = require("../types/enum.types");
const router = express_1.default.Router();
router.get("/", vault_controller_1.getAll);
router.get("/:id", vault_controller_1.getById);
router.post("/create", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), vault_controller_1.create);
router.patch("/update/:id", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), vault_controller_1.update);
router.delete("/delete/:id", (0, auth_middleware_1.authenticate)(enum_types_1.Admin_and_Director), vault_controller_1.remove);
exports.default = router;
