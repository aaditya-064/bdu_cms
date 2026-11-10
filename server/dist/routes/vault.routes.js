"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const vault = __importStar(require("../controller/vault.controller"));
const router = express_1.default.Router();
router.use((0, auth_middleware_1.authenticate)());
router.use((0, catchAsync_utils_1.catchAsync)(async (req, res, next) => {
    const account = await user_model_1.default.findById(req.user._id).select("role");
    if (!account)
        throw new appError_utils_1.default("Account not found", 401);
    res.locals.manageVault =
        account.role === "ADMIN" || account.role === "DIRECTOR";
    res.setHeader("Cache-Control", "private, no-store");
    next();
}));
router.get("/", vault.getAll);
router.get("/:id", vault.getById);
// Every route below this point requires ADMIN or DIRECTOR.
router.use((_req, res, next) => {
    if (!res.locals.manageVault) {
        return next(new appError_utils_1.default("Access denied", 403));
    }
    next();
});
router.post("/create", vault.create);
router.patch("/update/:id", vault.update);
router.patch("/:id/access", vault.changeAccess);
router.delete("/delete/:id", vault.remove);
exports.default = router;
// router.get("/", getAll);
// router.get("/:id", getById);
// router.post("/create", authenticate(Admin_and_Director), create);
// router.patch("/update/:id", authenticate(Admin_and_Director), update);
// router.delete("/delete/:id", authenticate(Admin_and_Director), remove);
