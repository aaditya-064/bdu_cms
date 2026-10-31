import mongoose from "mongoose";
import { FeedRate, FeedRecipe, FeedSettings } from "../models/feed.model";
import {
  calculate,
  number,
  validateRecipe,
  workerSheets,
} from "../services/feed.service";
import { PRODUCTS, RecipeInput, Calculation, keyOf } from "../types/feed.types";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";

const ok = (
  res: Parameters<typeof sendResponse>[0],
  data: unknown,
  message = "Success",
) => sendResponse(res, { data, message, statusCode: 200 });
async function recipeById(id: string) {
  if (!mongoose.isObjectIdOrHexString(id))
    throw new AppError("Invalid recipe ID", 400);
  const recipe = await FeedRecipe.findById(id);
  if (!recipe) throw new AppError("Recipe not found", 404);
  return recipe;
}
export const getSettings = catchAsync(async (_req, res) =>
  ok(res, (await FeedSettings.findById("global")) ?? { bagPrice: null }),
);
export const setSettings = catchAsync(async (req, res) => {
  const bagPrice = number(req.body?.bagPrice, "bag price");
  ok(
    res,
    await FeedSettings.findByIdAndUpdate(
      "global",
      { bagPrice },
      { upsert: true, new: true, runValidators: true },
    ),
  );
});
export const getRates = catchAsync(async (req, res) => {
  const brand = String(req.query.brand);
  if (!Object.prototype.hasOwnProperty.call(PRODUCTS, brand))
    throw new AppError("Invalid brand", 400);
  ok(res, await FeedRate.find({ brand }).sort({ kind: 1, name: 1 }));
});
export const setRates = catchAsync(async (req, res) => {
  const rows = req.body?.rates;
  if (!Array.isArray(rows) || !rows.length || rows.length > 100)
    throw new AppError("Provide 1–100 rates", 400);
  const ids = new Set<string>();
  for (const row of rows) {
    if (
      !row ||
      typeof row.id !== "string" ||
      !mongoose.isObjectIdOrHexString(row.id) ||
      ids.has(row.id.toLowerCase())
    )
      throw new AppError("Invalid or duplicate rate ID", 400);
    ids.add(row.id.toLowerCase());
    number(row.price, "ingredient price");
  }
  const existing = await FeedRate.find({ _id: { $in: [...ids] } });
  if (existing.length !== rows.length)
    throw new AppError("An ingredient rate was not found", 400);
  for (const row of rows) {
    const old = existing.find(
      (item) => String(item._id) === row.id.toLowerCase(),
    )!;
    if (old.price === row.price) continue;
    const date = new Date();
    await FeedRate.updateOne(
      { _id: old._id },
      {
        $set: { price: row.price, changedAt: date, changedBy: req.user._id },
        $push: { history: { price: row.price, date, by: req.user._id } },
      },
    );
  }
  ok(res, null, "Rates saved");
});
export const createRecipe = catchAsync(async (req, res) => {
  const input = req.body as RecipeInput;
  validateRecipe(input);
  // Upload defines this brand's ingredient list. Missing prices stay null.
  await FeedRate.bulkWrite(
    input.rows.map((row) => ({
      updateOne: {
        filter: { brand: input.brand, kind: row.kind, key: keyOf(row.name) },
        update: {
          $setOnInsert: {
            brand: input.brand,
            kind: row.kind,
            key: keyOf(row.name),
            name: row.name.trim(),
            price: null,
          },
        },
        upsert: true,
      },
    })),
  );
  const saved = await FeedRecipe.create({
    title: input.title.trim(),
    brand: input.brand,
    codes: input.codes,
    rows: input.rows,
    createdBy: req.user._id,
  });
  ok(res, { _id: saved._id }, "Recipe imported");
});
export const listRecipes = catchAsync(async (_req, res) =>
  ok(
    res,
    await FeedRecipe.find()
      .select("title brand codes createdAt publishedAt")
      .sort({ createdAt: -1 })
      .limit(100),
  ),
);
export const getRecipe = catchAsync(async (req, res) =>
  ok(res, await recipeById(String(req.params.id))),
);
export const saveCalculation = catchAsync(async (req, res) => {
  const recipe = await recipeById(String(req.params.id));
  const settings = await FeedSettings.findById("global");
  if (settings?.bagPrice == null)
    throw new AppError(
      "Set the shared bag price in Ingredient rates first",
      400,
    );
  const rates = await FeedRate.find({ brand: recipe.brand }).lean();
  const input = recipe.toObject() as unknown as RecipeInput;
  const sheets = calculate(
    input,
    rates as Parameters<typeof calculate>[1],
    settings.bagPrice,
    req.body?.costs,
  );
  // A single recipe update publishes all its product sheets together.
  const saved = await FeedRecipe.findByIdAndUpdate(
    recipe._id,
    { sheets, publishedAt: new Date() },
    { new: true },
  );
  ok(res, saved, "Calculated and saved using current rates");
});
export const listBatches = catchAsync(async (_req, res) =>
  ok(
    res,
    await FeedRecipe.find({ publishedAt: { $exists: true } })
      .select("title brand codes publishedAt")
      .sort({ publishedAt: -1 })
      .limit(100),
  ),
);
export const getBatch = catchAsync(async (req, res) => {
  const recipe = await recipeById(String(req.params.id));
  if (!recipe.publishedAt)
    throw new AppError("This batch sheet has not been published", 404);
  ok(res, {
    _id: recipe._id,
    title: recipe.title,
    brand: recipe.brand,
    publishedAt: recipe.publishedAt,
    sheets: workerSheets(recipe.sheets as Calculation[]),
  });
});
