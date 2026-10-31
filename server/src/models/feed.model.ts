import mongoose from "mongoose";

const rateSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    kind: { type: String, enum: ["ingredient", "additive"], required: true },
    price: { type: Number, default: null, min: 0 }, // Always NPR/kg.
    changedAt: Date,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    history: [
      { price: Number, date: Date, by: mongoose.Schema.Types.ObjectId },
    ],
  },
  { timestamps: true },
);
rateSchema.index({ brand: 1, kind: 1, key: 1 }, { unique: true });

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true },
    codes: [String],
    rows: [{ name: String, kind: String, quantities: [Number], _id: false }],
    // Snapshot from the server calculation. Never return this field to workers.
    sheets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    publishedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },
    bagPrice: { type: Number, default: null, min: 0 },
  },
  { timestamps: true },
);

// Separate collections preserve records from the earlier feed version.
export const FeedRate = mongoose.model("FeedBrandRate", rateSchema);
export const FeedRecipe = mongoose.model("FeedRecipeSheet", recipeSchema);
export const FeedSettings = mongoose.model("FeedSheetSettings", settingsSchema);
