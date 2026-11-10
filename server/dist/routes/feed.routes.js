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
const feed = __importStar(require("../controller/feed.controller"));
const feed_controller_1 = require("../controller/feed.controller");
const router = express_1.default.Router();
router.use((0, auth_middleware_1.authenticate)());
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    next();
});
const allow = (...roles) => (0, catchAsync_utils_1.catchAsync)(async (req, _res, next) => {
    const user = await user_model_1.default.findById(req.user._id).select("role");
    if (!user || !roles.includes(user.role)) {
        throw new appError_utils_1.default("Access denied", 403);
    }
    next();
});
const staff = ["DIRECTOR", "ADMIN", "DIR_SUBASH", "USER", "STAFF"];
const management = ["DIRECTOR", "ADMIN"];
const viewers = ["DIRECTOR", "ADMIN", "DIR_SUBASH"];
router.delete("/recipes/:id", allow(...management), feed_controller_1.deleteFormulation);
router.get("/batches", allow(...staff), feed.listBatches);
router.get("/batches/:id/excel", allow(...management), feed.exportBatchExcel);
router.get("/batches/:id", allow(...staff), feed.getBatch);
router.get("/pl", allow(...viewers), feed.listProfitSheets);
router.get("/pl/:id/excel", allow(...management), feed.exportProfitExcel);
router.get("/pl/:id", allow(...viewers), feed.getProfitSheet);
router.get("/settings", allow(...viewers), feed.getSettings);
router.patch("/settings", allow(...management), feed.setSettings);
router.get("/rates", allow(...viewers), feed.getRates);
router.patch("/rates", allow(...management), feed.setRates);
// Keep your existing Director-only formulation editing.
router.get("/recipes", allow("DIRECTOR"), feed.listRecipes);
router.post("/recipes", allow("DIRECTOR"), feed.createRecipe);
router.get("/recipes/:id", allow("DIRECTOR"), feed.getRecipe);
router.post("/recipes/:id/calculate", allow("DIRECTOR"), feed.saveCalculation);
exports.default = router;
