"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedSettings = exports.FeedRecipe = exports.FeedRate = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const rateSchema = new mongoose_1.default.Schema({
    brand: { type: String, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    kind: { type: String, enum: ["ingredient", "additive"], required: true },
    price: { type: Number, default: null, min: 0 }, // Always NPR/kg.
    changedAt: Date,
    changedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    history: [
        { price: Number, date: Date, by: mongoose_1.default.Schema.Types.ObjectId },
    ],
}, { timestamps: true });
rateSchema.index({ brand: 1, kind: 1, key: 1 }, { unique: true });
const recipeSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    brand: { type: String, required: true },
    codes: [String],
    rows: [
        {
            name: String,
            kind: String,
            quantities: [Number],
            unit: { type: String, enum: ["kg", "g"] },
            rateId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "FeedBrandRate" },
            _id: false,
        },
    ],
    // Snapshot from the server calculation. Never return this field to workers.
    sheets: { type: [mongoose_1.default.Schema.Types.Mixed], default: [] },
    publishedAt: Date,
    recalculatedAt: Date,
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const settingsSchema = new mongoose_1.default.Schema({
    _id: { type: String, default: "global" },
    bagPrice: { type: Number, default: null, min: 0 },
}, { timestamps: true });
// Separate collections preserve records from the earlier feed version.
exports.FeedRate = mongoose_1.default.model("FeedBrandRate", rateSchema);
exports.FeedRecipe = mongoose_1.default.model("FeedRecipeSheet", recipeSchema);
exports.FeedSettings = mongoose_1.default.model("FeedSheetSettings", settingsSchema);
