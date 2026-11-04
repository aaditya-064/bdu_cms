import { Buffer } from "node:buffer";
import {
  buildBatchWorkbook,
  buildProfitWorkbook,
} from "../services/feed-excel.service";
import mongoose from "mongoose";
import { FeedRate, FeedRecipe, FeedSettings } from "../models/feed.model";
import {
  calculate,
  number,
  validateRecipe,
  workerSheets,
  formatProfitSheet,
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
// export const setRates = catchAsync(async (req, res) => {
//   const rows = req.body?.rates;
//   if (!Array.isArray(rows) || !rows.length || rows.length > 100)
//     throw new AppError("Provide 1–100 rates", 400);
//   const ids = new Set<string>();
//   for (const row of rows) {
//     if (
//       !row ||
//       typeof row.id !== "string" ||
//       !mongoose.isObjectIdOrHexString(row.id) ||
//       ids.has(row.id.toLowerCase())
//     )
//       throw new AppError("Invalid or duplicate rate ID", 400);
//     ids.add(row.id.toLowerCase());
//     number(row.price, "ingredient price");
//   }
//   const existing = await FeedRate.find({ _id: { $in: [...ids] } });
//   if (existing.length !== rows.length)
//     throw new AppError("An ingredient rate was not found", 400);
//   for (const row of rows) {
//     const old = existing.find(
//       (item) => String(item._id) === row.id.toLowerCase(),
//     )!;
//     if (old.price === row.price) continue;
//     const date = new Date();
//     await FeedRate.updateOne(
//       { _id: old._id },
//       {
//         $set: { price: row.price, changedAt: date, changedBy: req.user._id },
//         $push: { history: { price: row.price, date, by: req.user._id } },
//       },
//     );
//   }
//   ok(res, null, "Rates saved");
// });
export const setRates = catchAsync(async (req, res) => {
  const changes = req.body?.rates;

  if (!Array.isArray(changes) || changes.length === 0 || changes.length > 100) {
    throw new AppError("Provide 1–100 rates", 400);
  }

  const ids = new Set<string>();

  // Validate everything before changing any records.
  for (const change of changes) {
    if (
      !change ||
      typeof change.id !== "string" ||
      !mongoose.isObjectIdOrHexString(change.id)
    ) {
      throw new AppError("Invalid ingredient rate ID", 400);
    }

    const id = change.id.toLowerCase();

    if (ids.has(id)) {
      throw new AppError("Duplicate ingredient rate ID", 400);
    }

    ids.add(id);
    number(change.price, "ingredient price");
  }

  const session = await mongoose.startSession();
  let updatedFormulations = 0;

  try {
    // Save rates and recalculate P/L together.
    // If any calculation fails, none of these changes are committed.
    await session.withTransaction(async () => {
      updatedFormulations = 0;

      const existing = await FeedRate.find({
        _id: { $in: [...ids] },
      }).session(session);

      if (existing.length !== changes.length) {
        throw new AppError("An ingredient rate was not found", 400);
      }

      const affectedBrands = new Set<string>();
      const changedAt = new Date();

      for (const change of changes) {
        const old = existing.find(
          (rate) => String(rate._id) === change.id.toLowerCase(),
        )!;

        if (old.price === change.price) continue;

        await FeedRate.updateOne(
          { _id: old._id },
          {
            $set: {
              price: change.price,
              changedAt,
              changedBy: req.user._id,
            },
            $push: {
              history: {
                price: change.price,
                date: changedAt,
                by: req.user._id,
              },
            },
          },
          { session },
        );

        affectedBrands.add(old.brand);
      }

      for (const brand of affectedBrands) {
        const rates = await FeedRate.find({ brand }).session(session).lean();

        const recipes = await FeedRecipe.find({
          brand,
          publishedAt: { $ne: null },
          "sheets.0": { $exists: true },
        }).session(session);

        for (const recipe of recipes) {
          const input = recipe.toObject() as unknown as RecipeInput;
          const previousSheets = recipe.sheets as Calculation[];

          const sheets = previousSheets.map((previous) => {
            const column = input.codes.indexOf(previous.code);

            if (column === -1) {
              throw new AppError(
                `Product ${previous.code} is missing from ${recipe.title}`,
                400,
              );
            }

            // Use the original uploaded quantities for this product.
            const productRecipe: RecipeInput = {
              title: input.title,
              brand: input.brand,
              codes: [previous.code],
              rows: input.rows.map((row) => ({
                ...row,
                quantities: [row.quantities[column]],
              })),
            };

            // Preserve this product's saved bag price and manual costs.
            const [calculated] = calculate(
              productRecipe,
              rates as Parameters<typeof calculate>[1],
              previous.bagPrice,
              {
                [previous.code]: previous.inputs,
              },
            );

            return formatProfitSheet(calculated);
          });

          await FeedRecipe.updateOne(
            { _id: recipe._id },
            {
              $set: {
                sheets,
                recalculatedAt: changedAt,
              },
            },
            { session },
          );

          updatedFormulations++;
        }
      }
    });
  } finally {
    await session.endSession();
  }

  ok(
    res,
    { updatedFormulations },
    `Rates saved. ${updatedFormulations} formulation(s) recalculated.`,
  );
});

export const createRecipe = catchAsync(async (req, res) => {
  const input = req.body as RecipeInput;
  validateRecipe(input);
  // New imports always use the source section: Ingredients = kg, Additives = g.
  // Unit overrides from older clients must not change this interpretation.
  if (input.rows.some((row) => row.unit !== undefined))
    throw new AppError(
      "Upload the CSV without a Unit column using the updated form",
      400,
    );
  const existing = await FeedRate.find({
    brand: input.brand,
    key: { $in: input.rows.map((row) => keyOf(row.name)) },
  });
  // Refuse ambiguous old records instead of choosing a possibly wrong price.
  for (const row of input.rows) {
    if (existing.filter((rate) => rate.key === keyOf(row.name)).length > 1)
      throw new AppError(
        `Duplicate rate records for ${row.name}. Resolve them before importing.`,
        409,
      );
  }
  const rows = [];
  for (const row of input.rows) {
    const key = keyOf(row.name);
    const matched = existing.find((rate) => rate.key === key);
    // Keep existing IDs, prices, dates and history even when the section moves.
    // New rates use one canonical kind; the recipe row owns its display section.
    const rate =
      matched ??
      (await FeedRate.findOneAndUpdate(
        { brand: input.brand, key, kind: "ingredient" },
        { $setOnInsert: { name: row.name.trim(), price: null } },
        { upsert: true, new: true, runValidators: true },
      ));
    if (!rate) throw new AppError("Could not link ingredient rate", 500);
    rows.push({
      name: row.name.trim(),
      kind: row.kind,
      quantities: row.quantities,
      rateId: rate._id,
    });
  }
  const saved = await FeedRecipe.create({
    title: input.title.trim(),
    brand: input.brand,
    codes: input.codes,
    rows,
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
export const getRecipe = catchAsync(async (req, res) => {
  const recipe = await recipeById(String(req.params.id));

  ok(res, {
    ...recipe.toObject(),
    sheets: (recipe.sheets as Calculation[]).map(formatProfitSheet),
  });
});
export const saveCalculation = catchAsync(async (req, res) => {
  const recipe = await recipeById(String(req.params.id));
  const settings = await FeedSettings.findById("global");

  if (settings?.bagPrice == null) {
    throw new AppError(
      "Set the shared bag price in Ingredient rates first",
      400,
    );
  }

  const rates = await FeedRate.find({ brand: recipe.brand }).lean();

  const sheets = calculate(
    recipe.toObject() as unknown as RecipeInput,
    rates as Parameters<typeof calculate>[1],
    settings.bagPrice,
    req.body?.costs,
  ).map(formatProfitSheet);

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

// Read-only P/L access never loads the recipe-import or rate-editing interface.
export const listProfitSheets = catchAsync(async (_req, res) => {
  const recipes = await FeedRecipe.find({
    publishedAt: { $ne: null },
    "sheets.0": { $exists: true },
  })
    .select("title brand codes publishedAt")
    .sort({ publishedAt: -1 })
    .limit(100);
  ok(res, recipes, "Saved P/L sheets fetched");
});

export const getProfitSheet = catchAsync(async (req, res) => {
  const id = String(req.params.id);

  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("Invalid sheet ID", 400);
  }

  const recipe = await FeedRecipe.findOne({
    _id: id,
    publishedAt: { $ne: null },
    "sheets.0": { $exists: true },
  }).select("title brand codes sheets publishedAt");

  if (!recipe) {
    throw new AppError("P/L sheet not found", 404);
  }

  ok(
    res,
    {
      ...recipe.toObject(),
      sheets: (recipe.sheets as Calculation[]).map(formatProfitSheet),
    },
    "Saved P/L sheet fetched",
  );
});
// This handler is mounted only behind the ADMIN/DIRECTOR route guard.
export const exportBatchExcel = catchAsync(async (req, res) => {
  const recipe = await recipeById(String(req.params.id));
  if (!recipe.publishedAt || !recipe.sheets.length)
    throw new AppError("This batch sheet has not been published", 404);
  const code = req.query.code;
  if (code !== undefined && typeof code !== "string")
    throw new AppError("Invalid product code", 400);
  const sheets = workerSheets(recipe.sheets as Calculation[]);
  const selected =
    code === undefined ? sheets : sheets.filter((sheet) => sheet.code === code);
  if (!selected.length)
    throw new AppError("Product not found in this batch sheet", 404);
  const workbook = await buildBatchWorkbook(
    selected,
    recipe.brand,
    recipe.publishedAt.toISOString(),
  );
  const buffer = await workbook.xlsx.writeBuffer();
  const filename =
    `${recipe.brand}-${code ?? "all-products"}-batch.xlsx`.replace(
      /[\\/:*?"<>|]/g,
      "-",
    );
  // Keep the existing JSON response envelope expected by the Axios interceptor.
  // Workbooks are small (at most three products and 100 recipe rows).
  ok(res, { filename, base64: Buffer.from(buffer).toString("base64") });
});

export const exportProfitExcel = catchAsync(async (req, res) => {
  const recipe = await recipeById(String(req.params.id));

  if (!recipe.publishedAt || !recipe.sheets.length) {
    throw new AppError("This P/L sheet has not been published", 404);
  }

  const code = req.query.code;

  if (code !== undefined && typeof code !== "string") {
    throw new AppError("Invalid product code", 400);
  }

  const sheets = recipe.sheets as Calculation[];

  const selected =
    code === undefined ? sheets : sheets.filter((sheet) => sheet.code === code);

  if (!selected.length) {
    throw new AppError("Product not found in this formulation", 404);
  }

  const workbook = await buildProfitWorkbook(
    selected,
    recipe.brand,
    recipe.publishedAt.toISOString(),
  );

  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `${recipe.brand}-${code ?? "all-products"}-PL.xlsx`.replace(
    /[\\/:*?"<>|]/g,
    "-",
  );

  ok(res, {
    filename,
    base64: Buffer.from(buffer).toString("base64"),
  });
});
