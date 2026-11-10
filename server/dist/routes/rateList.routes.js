"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const rateList_model_1 = require("../models/rateList.model");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const router = express_1.default.Router();
const sheetId = "current";
const editors = new Set([
    "STAFF",
    "DIR_SUBASH",
    "DIRECTOR",
    "ADMIN",
    "SUPER_ADMIN",
]);
router.use((0, auth_middleware_1.authenticate)());
async function getAccess(userId) {
    const account = await user_model_1.default.findById(userId).select("role");
    if (!account)
        throw new appError_utils_1.default("Account not found", 401);
    const canEdit = editors.has(account.role);
    if (!canEdit && account.role !== "USER") {
        throw new appError_utils_1.default("Access denied", 403);
    }
    return canEdit;
}
function validRate(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
router.get("/", (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const canEdit = await getAccess(req.user._id);
    const saved = await rateList_model_1.ProductRateSheet.findById(sheetId).lean();
    res.setHeader("Cache-Control", "private, no-store");
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Feed rates loaded",
        data: {
            effectiveDate: saved?.effectiveDate ?? "2083.07.18",
            revision: saved?.revision ?? 0,
            rows: saved?.rows ?? rateList_model_1.initialRows,
            canEdit,
        },
    });
}));
router.put("/", (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    if (!(await getAccess(req.user._id))) {
        throw new appError_utils_1.default("You cannot edit feed rates", 403);
    }
    const { effectiveDate, revision, rows } = req.body ?? {};
    if (typeof effectiveDate !== "string" ||
        !/^\d{4}\.(0[1-9]|1[0-2])\.(0[1-9]|[12]\d|3[0-2])$/.test(effectiveDate)) {
        throw new appError_utils_1.default("Enter the BS date as YYYY.MM.DD", 400);
    }
    if (!Number.isSafeInteger(revision) || revision < 0) {
        throw new appError_utils_1.default("Reload the price list before saving", 400);
    }
    if (!Array.isArray(rows) || rows.length !== rateList_model_1.initialRows.length) {
        throw new appError_utils_1.default("The product list is incomplete", 400);
    }
    const checkedRows = rateList_model_1.initialRows.map(({ product }, index) => {
        const row = rows[index];
        if (!row || row.product !== product || !validRate(row.rate)) {
            throw new appError_utils_1.default(`Check the new rate for ${product}`, 400);
        }
        if (row.outOfValley !== null && !validRate(row.outOfValley)) {
            throw new appError_utils_1.default(`Check the out-of-valley rate for ${product}`, 400);
        }
        return { product, rate: row.rate, outOfValley: row.outOfValley };
    });
    const conflict = () => new appError_utils_1.default("Someone updated the rates. Reload before saving.", 409);
    try {
        const saved = await rateList_model_1.ProductRateSheet.findOneAndUpdate({ _id: sheetId, revision }, {
            $set: {
                effectiveDate,
                rows: checkedRows,
                updatedBy: req.user._id,
            },
            $inc: { revision: 1 },
        }, {
            new: true,
            upsert: revision === 0,
            runValidators: true,
            setDefaultsOnInsert: false,
        });
        if (!saved)
            throw conflict();
    }
    catch (error) {
        // Another editor may have created the first sheet before this save.
        if (error.code === 11000)
            throw conflict();
        throw error;
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Feed rates saved",
        data: { revision: revision + 1 },
    });
}));
exports.default = router;
