"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRateSheet = exports.initialRows = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const products = [
    ["SHRADDHA B0", 85.3],
    ["SHRADDHA B1", 84.3],
    ["SHRADDHA B2", 83.3],
    ["SRIJAN SB0", 83.35],
    ["SRIJAN SB1", 82.8],
    ["SRIJAN SB2", 81.85],
    ["SAURYA B1", 81.55],
    ["SAURYA B2", 80.6],
    ["SHRADDHA L1", 75.05],
    ["SHRADDHA L2", 68],
    ["SHRADDHA L3", 70.3],
    ["PIG P0", 69.8],
    ["PIG P1", 66.8],
    ["PIG P2", 63.35],
    ["PIG P3", 68.35],
    ["SIRJAN/SAURYA G1", 47.5, 49.5],
    ["SIRJAN/SAURYA G2", 46.5, 48.5],
    ["CATTLE 25 KG", 55.65],
    ["CATTLE 35 KG", 55.65],
    ["CATTLE 50 KG", 55.65],
    ["FISH NORMAL", 61.8],
    ["SAURYA B1 (5 KG)", 83.05],
    ["SAURYA B2 (5 KG)", 82.1],
    ["SAURYA G2 (5 KG)", 48.5],
];
exports.initialRows = products.map(([product, rate, outside]) => ({
    product,
    rate,
    outOfValley: outside ?? null,
}));
const rowSchema = new mongoose_1.default.Schema({
    product: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    outOfValley: { type: Number, default: null, min: 0 },
}, { _id: false });
const sheetSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    effectiveDate: { type: String, required: true },
    revision: { type: Number, required: true },
    rows: [rowSchema],
    updatedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.ProductRateSheet = mongoose_1.default.model("ProductRateSheet", sheetSchema);
