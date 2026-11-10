"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFormulation = exports.exportProfitExcel = exports.exportBatchExcel = exports.getProfitSheet = exports.listProfitSheets = exports.getBatch = exports.listBatches = exports.saveCalculation = exports.getRecipe = exports.listRecipes = exports.createRecipe = exports.setRates = exports.getRates = exports.setSettings = exports.getSettings = void 0;
const node_buffer_1 = require("node:buffer");
const feed_excel_service_1 = require("../services/feed-excel.service");
const mongoose_1 = __importDefault(require("mongoose"));
const feed_model_1 = require("../models/feed.model");
const feed_service_1 = require("../services/feed.service");
const feed_types_1 = require("../types/feed.types");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ok = (res, data, message = "Success") => (0, sendResponse_utils_1.sendResponse)(res, { data, message, statusCode: 200 });
async function recipeById(id) {
    if (!mongoose_1.default.isObjectIdOrHexString(id))
        throw new appError_utils_1.default("Invalid recipe ID", 400);
    const recipe = await feed_model_1.FeedRecipe.findById(id);
    if (!recipe)
        throw new appError_utils_1.default("Recipe not found", 404);
    return recipe;
}
exports.getSettings = (0, catchAsync_utils_1.catchAsync)(async (_req, res) => ok(res, (await feed_model_1.FeedSettings.findById("global")) ?? { bagPrice: null }));
exports.setSettings = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const bagPrice = (0, feed_service_1.number)(req.body?.bagPrice, "bag price");
    ok(res, await feed_model_1.FeedSettings.findByIdAndUpdate("global", { bagPrice }, { upsert: true, new: true, runValidators: true }));
});
exports.getRates = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const brand = String(req.query.brand);
    if (!Object.prototype.hasOwnProperty.call(feed_types_1.PRODUCTS, brand))
        throw new appError_utils_1.default("Invalid brand", 400);
    ok(res, await feed_model_1.FeedRate.find({ brand }).sort({ kind: 1, name: 1 }));
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
exports.setRates = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const changes = req.body?.rates;
    if (!Array.isArray(changes) || changes.length === 0 || changes.length > 100) {
        throw new appError_utils_1.default("Provide 1–100 rates", 400);
    }
    const ids = new Set();
    // Validate everything before changing any records.
    for (const change of changes) {
        if (!change ||
            typeof change.id !== "string" ||
            !mongoose_1.default.isObjectIdOrHexString(change.id)) {
            throw new appError_utils_1.default("Invalid ingredient rate ID", 400);
        }
        const id = change.id.toLowerCase();
        if (ids.has(id)) {
            throw new appError_utils_1.default("Duplicate ingredient rate ID", 400);
        }
        ids.add(id);
        (0, feed_service_1.number)(change.price, "ingredient price");
    }
    const session = await mongoose_1.default.startSession();
    let updatedFormulations = 0;
    try {
        // Save rates and recalculate P/L together.
        // If any calculation fails, none of these changes are committed.
        await session.withTransaction(async () => {
            updatedFormulations = 0;
            const existing = await feed_model_1.FeedRate.find({
                _id: { $in: [...ids] },
            }).session(session);
            if (existing.length !== changes.length) {
                throw new appError_utils_1.default("An ingredient rate was not found", 400);
            }
            const affectedBrands = new Set();
            const changedAt = new Date();
            for (const change of changes) {
                const old = existing.find((rate) => String(rate._id) === change.id.toLowerCase());
                if (old.price === change.price)
                    continue;
                await feed_model_1.FeedRate.updateOne({ _id: old._id }, {
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
                }, { session });
                affectedBrands.add(old.brand);
            }
            for (const brand of affectedBrands) {
                const rates = await feed_model_1.FeedRate.find({ brand }).session(session).lean();
                const recipes = await feed_model_1.FeedRecipe.find({
                    brand,
                    publishedAt: { $ne: null },
                    "sheets.0": { $exists: true },
                }).session(session);
                for (const recipe of recipes) {
                    const input = recipe.toObject();
                    const previousSheets = recipe.sheets;
                    const sheets = previousSheets.map((previous) => {
                        const column = input.codes.indexOf(previous.code);
                        if (column === -1) {
                            throw new appError_utils_1.default(`Product ${previous.code} is missing from ${recipe.title}`, 400);
                        }
                        // Use the original uploaded quantities for this product.
                        const productRecipe = {
                            title: input.title,
                            brand: input.brand,
                            codes: [previous.code],
                            rows: input.rows.map((row) => ({
                                ...row,
                                quantities: [row.quantities[column]],
                            })),
                        };
                        // Preserve this product's saved bag price and manual costs.
                        const [calculated] = (0, feed_service_1.calculate)(productRecipe, rates, previous.bagPrice, {
                            [previous.code]: previous.inputs,
                        });
                        return (0, feed_service_1.formatProfitSheet)(calculated);
                    });
                    await feed_model_1.FeedRecipe.updateOne({ _id: recipe._id }, {
                        $set: {
                            sheets,
                            recalculatedAt: changedAt,
                        },
                    }, { session });
                    updatedFormulations++;
                }
            }
        });
    }
    finally {
        await session.endSession();
    }
    ok(res, { updatedFormulations }, `Rates saved. ${updatedFormulations} formulation(s) recalculated.`);
});
exports.createRecipe = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const input = req.body;
    (0, feed_service_1.validateRecipe)(input);
    // New imports always use the source section: Ingredients = kg, Additives = g.
    // Unit overrides from older clients must not change this interpretation.
    if (input.rows.some((row) => row.unit !== undefined))
        throw new appError_utils_1.default("Upload the CSV without a Unit column using the updated form", 400);
    const existing = await feed_model_1.FeedRate.find({
        brand: input.brand,
        key: { $in: input.rows.map((row) => (0, feed_types_1.keyOf)(row.name)) },
    });
    // Refuse ambiguous old records instead of choosing a possibly wrong price.
    for (const row of input.rows) {
        if (existing.filter((rate) => rate.key === (0, feed_types_1.keyOf)(row.name)).length > 1)
            throw new appError_utils_1.default(`Duplicate rate records for ${row.name}. Resolve them before importing.`, 409);
    }
    const rows = [];
    for (const row of input.rows) {
        const key = (0, feed_types_1.keyOf)(row.name);
        const matched = existing.find((rate) => rate.key === key);
        // Keep existing IDs, prices, dates and history even when the section moves.
        // New rates use one canonical kind; the recipe row owns its display section.
        const rate = matched ??
            (await feed_model_1.FeedRate.findOneAndUpdate({ brand: input.brand, key, kind: "ingredient" }, { $setOnInsert: { name: row.name.trim(), price: null } }, { upsert: true, new: true, runValidators: true }));
        if (!rate)
            throw new appError_utils_1.default("Could not link ingredient rate", 500);
        rows.push({
            name: row.name.trim(),
            kind: row.kind,
            quantities: row.quantities,
            rateId: rate._id,
        });
    }
    const saved = await feed_model_1.FeedRecipe.create({
        title: input.title.trim(),
        brand: input.brand,
        codes: input.codes,
        rows,
        createdBy: req.user._id,
    });
    ok(res, { _id: saved._id }, "Recipe imported");
});
exports.listRecipes = (0, catchAsync_utils_1.catchAsync)(async (_req, res) => ok(res, await feed_model_1.FeedRecipe.find()
    .select("title brand codes createdAt publishedAt")
    .sort({ createdAt: -1 })
    .limit(100)));
exports.getRecipe = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const recipe = await recipeById(String(req.params.id));
    ok(res, {
        ...recipe.toObject(),
        sheets: recipe.sheets.map(feed_service_1.formatProfitSheet),
    });
});
exports.saveCalculation = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const recipe = await recipeById(String(req.params.id));
    const settings = await feed_model_1.FeedSettings.findById("global");
    if (settings?.bagPrice == null) {
        throw new appError_utils_1.default("Set the shared bag price in Ingredient rates first", 400);
    }
    const rates = await feed_model_1.FeedRate.find({ brand: recipe.brand }).lean();
    const sheets = (0, feed_service_1.calculate)(recipe.toObject(), rates, settings.bagPrice, req.body?.costs).map(feed_service_1.formatProfitSheet);
    const saved = await feed_model_1.FeedRecipe.findByIdAndUpdate(recipe._id, { sheets, publishedAt: new Date() }, { new: true });
    ok(res, saved, "Calculated and saved using current rates");
});
exports.listBatches = (0, catchAsync_utils_1.catchAsync)(async (_req, res) => ok(res, await feed_model_1.FeedRecipe.find({ publishedAt: { $exists: true } })
    .select("title brand codes publishedAt")
    .sort({ publishedAt: -1 })
    .limit(100)));
exports.getBatch = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const recipe = await recipeById(String(req.params.id));
    if (!recipe.publishedAt)
        throw new appError_utils_1.default("This batch sheet has not been published", 404);
    ok(res, {
        _id: recipe._id,
        title: recipe.title,
        brand: recipe.brand,
        publishedAt: recipe.publishedAt,
        sheets: (0, feed_service_1.workerSheets)(recipe.sheets),
    });
});
// Read-only P/L access never loads the recipe-import or rate-editing interface.
exports.listProfitSheets = (0, catchAsync_utils_1.catchAsync)(async (_req, res) => {
    const recipes = await feed_model_1.FeedRecipe.find({
        publishedAt: { $ne: null },
        "sheets.0": { $exists: true },
    })
        .select("title brand codes publishedAt")
        .sort({ publishedAt: -1 })
        .limit(100);
    ok(res, recipes, "Saved P/L sheets fetched");
});
exports.getProfitSheet = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const id = String(req.params.id);
    if (!mongoose_1.default.isObjectIdOrHexString(id)) {
        throw new appError_utils_1.default("Invalid sheet ID", 400);
    }
    const recipe = await feed_model_1.FeedRecipe.findOne({
        _id: id,
        publishedAt: { $ne: null },
        "sheets.0": { $exists: true },
    }).select("title brand codes sheets publishedAt");
    if (!recipe) {
        throw new appError_utils_1.default("P/L sheet not found", 404);
    }
    ok(res, {
        ...recipe.toObject(),
        sheets: recipe.sheets.map(feed_service_1.formatProfitSheet),
    }, "Saved P/L sheet fetched");
});
// This handler is mounted only behind the ADMIN/DIRECTOR route guard.
exports.exportBatchExcel = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const recipe = await recipeById(String(req.params.id));
    if (!recipe.publishedAt || !recipe.sheets.length)
        throw new appError_utils_1.default("This batch sheet has not been published", 404);
    const code = req.query.code;
    if (code !== undefined && typeof code !== "string")
        throw new appError_utils_1.default("Invalid product code", 400);
    const sheets = (0, feed_service_1.workerSheets)(recipe.sheets);
    const selected = code === undefined ? sheets : sheets.filter((sheet) => sheet.code === code);
    if (!selected.length)
        throw new appError_utils_1.default("Product not found in this batch sheet", 404);
    const workbook = await (0, feed_excel_service_1.buildBatchWorkbook)(selected, recipe.brand, recipe.publishedAt.toISOString());
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${recipe.brand}-${code ?? "all-products"}-batch.xlsx`.replace(/[\\/:*?"<>|]/g, "-");
    // Keep the existing JSON response envelope expected by the Axios interceptor.
    // Workbooks are small (at most three products and 100 recipe rows).
    ok(res, { filename, base64: node_buffer_1.Buffer.from(buffer).toString("base64") });
});
exports.exportProfitExcel = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const recipe = await recipeById(String(req.params.id));
    if (!recipe.publishedAt || !recipe.sheets.length) {
        throw new appError_utils_1.default("This P/L sheet has not been published", 404);
    }
    const code = req.query.code;
    if (code !== undefined && typeof code !== "string") {
        throw new appError_utils_1.default("Invalid product code", 400);
    }
    const sheets = recipe.sheets;
    const selected = code === undefined ? sheets : sheets.filter((sheet) => sheet.code === code);
    if (!selected.length) {
        throw new appError_utils_1.default("Product not found in this formulation", 404);
    }
    const workbook = await (0, feed_excel_service_1.buildProfitWorkbook)(selected, recipe.brand, recipe.publishedAt.toISOString());
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${recipe.brand}-${code ?? "all-products"}-PL.xlsx`.replace(/[\\/:*?"<>|]/g, "-");
    ok(res, {
        filename,
        base64: node_buffer_1.Buffer.from(buffer).toString("base64"),
    });
});
exports.deleteFormulation = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const user = await user_model_1.default.findById(req.user._id).select("role");
    if (!user || !["ADMIN", "DIRECTOR"].includes(user.role)) {
        throw new appError_utils_1.default("Only ADMIN and DIRECTOR can delete formulations", 403);
    }
    const id = String(req.params.id);
    if (!mongoose_1.default.isObjectIdOrHexString(id)) {
        throw new appError_utils_1.default("Invalid formulation ID", 400);
    }
    // P/L calculations are embedded in this record.
    // Worker sheets are generated from those calculations.
    // Deleting this record removes both together.
    // Repeating the request is harmless.
    await feed_model_1.FeedRecipe.deleteOne({ _id: id });
    (0, sendResponse_utils_1.sendResponse)(res, {
        statusCode: 200,
        message: "Formulation and associated P/L and worker sheets deleted",
        data: null,
    });
});
