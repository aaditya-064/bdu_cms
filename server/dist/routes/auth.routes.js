"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controller/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
//* register
router.post("/register", auth_controller_1.register);
//* login
router.post("/login", auth_controller_1.login);
router.get("/me", (0, auth_middleware_1.authenticate)(), auth_controller_1.getProfile);
router.post("/logout", auth_controller_1.logout);
router.post("/change-profile-image", (0, auth_middleware_1.authenticate)(), auth_controller_1.changeProfileImage);
exports.default = router;
