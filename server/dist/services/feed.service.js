"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = void 0;
exports.number = number;
exports.validateRecipe = validateRecipe;
exports.validateCosts = validateCosts;
exports.calculate = calculate;
exports.savedQuantityKg = savedQuantityKg;
exports.workerSheets = workerSheets;
exports.formatProfitSheet = formatProfitSheet;
const feed_types_1 = require("../types/feed.types");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const fail = (message) => {
    throw new appError_utils_1.default(message, 400);
};
const round = (n, places = 6) => Number(n.toFixed(places));
exports.round = round;
function number(value, label, max = 1000000) {
    if (typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > max)
        fail(`Invalid ${label}`);
    return value;
}
function validateRecipe(data) {
    if (!data ||
        typeof data.title !== "string" ||
        !data.title.trim() ||
        data.title.length > 100)
        fail("Enter a title (maximum 100 characters)");
    if (!Object.prototype.hasOwnProperty.call(feed_types_1.PRODUCTS, data.brand))
        fail("Invalid brand");
    if (!Array.isArray(data.codes) ||
        !data.codes.length ||
        data.codes.length > 3 ||
        new Set(data.codes).size !== data.codes.length ||
        data.codes.some((c) => !feed_types_1.PRODUCTS[data.brand].includes(c)))
        fail("Check the product columns for this brand");
    if (!Array.isArray(data.rows) || !data.rows.length || data.rows.length > 100)
        fail("Provide 1–100 recipe rows");
    const seen = new Set();
    for (const row of data.rows) {
        if (!row ||
            typeof row.name !== "string" ||
            !row.name.trim() ||
            row.name.length > 100 ||
            !["ingredient", "additive"].includes(row.kind))
            fail("Invalid ingredient row");
        if (row.unit !== undefined && !["kg", "g"].includes(row.unit ?? ""))
            fail(`Invalid saved unit for ${row.name}`);
        const key = (0, feed_types_1.keyOf)(row.name);
        if (seen.has(key))
            fail(`Duplicate ingredient: ${row.name}`);
        seen.add(key);
        if (!Array.isArray(row.quantities) ||
            row.quantities.length !== data.codes.length)
            fail(`Check columns for ${row.name}`);
        row.quantities.forEach((q) => number(q, row.name, 100000));
    }
    for (let i = 0; i < data.codes.length; i++) {
        if (!data.rows.some((row) => row.quantities[i] > 0))
            fail(`${data.codes[i]} has no quantities`);
    }
}
function validateCosts(raw) {
    if (!raw)
        fail("Provide costs for every product");
    const costs = Object.fromEntries([
        "bags",
        "overhead",
        "utility",
        "freight",
        "labour",
        "pricePerTon",
        "commission",
    ].map((key) => [key, number(raw[key], key)]));
    costs.firewood = number(raw.firewood ?? 0, "firewood");
    if (!Number.isInteger(costs.bags))
        fail("Number of bags must be a whole number");
    if (costs.commission > costs.pricePerTon)
        fail("Commission cannot exceed price per ton");
    return costs;
}
function calculate(recipe, rates, bagPrice, inputs) {
    validateRecipe(recipe);
    number(bagPrice, "bag price");
    return recipe.codes.map((code, column) => {
        const costs = validateCosts(inputs?.[code]);
        const rows = recipe.rows.map((row) => {
            const rate = rates.find((rate) => row.rateId
                ? String(rate._id) === String(row.rateId)
                : rate.kind === row.kind && rate.key === (0, feed_types_1.keyOf)(row.name));
            if (!rate || rate.price === null || rate.price === undefined)
                fail(`Set the rate for ${row.name} in ${recipe.brand}`);
            const price = number(rate.price, `rate for ${row.name}`);
            const quantity = row.quantities[column];
            const unit = row.unit ?? (row.kind === "additive" ? "g" : "kg");
            const quantityKg = (0, feed_types_1.toKg)(quantity, unit);
            return {
                name: row.name,
                kind: row.kind,
                quantity,
                unit,
                quantityKg,
                price,
                amount: quantityKg * price,
                rateDate: rate.changedAt ?? null,
            };
        });
        const ingredients = rows
            .filter((r) => r.kind === "ingredient")
            .map(({ kind, ...row }) => row);
        const additives = rows
            .filter((r) => r.kind === "additive")
            .map(({ kind, ...row }) => row);
        const sum = (list, key) => list.reduce((total, row) => total + row[key], 0);
        const ingredientKg = sum(ingredients, "quantityKg"), additiveKg = sum(additives, "quantityKg");
        const ingredientAmount = sum(ingredients, "amount"), additiveAmount = sum(additives, "amount");
        const bagAmount = costs.bags * bagPrice;
        const totalCost = ingredientAmount + additiveAmount + bagAmount;
        const goodsLoss = totalCost * 0.02;
        const grandTotal = totalCost +
            goodsLoss +
            costs.overhead +
            costs.utility +
            costs.freight +
            costs.labour +
            (costs.firewood ?? 0);
        // Mirrors the supplied sheet: nominal recipe = one ton, no silent normalization.
        const costPerTon = grandTotal;
        const salesPerTon = costs.pricePerTon - costs.commission;
        return {
            code,
            formatVersion: 2,
            ingredients,
            additives,
            inputs: costs,
            bagPrice,
            ingredientKg: ingredientKg,
            additiveGrams: additiveKg * 1000,
            additiveKg,
            ingredientAmount: ingredientAmount,
            additiveAmount: additiveAmount,
            bagAmount: bagAmount,
            recipeKg: ingredientKg + additiveKg,
            totalCost: totalCost,
            goodsLoss: goodsLoss,
            grandTotal: grandTotal,
            costPerTon: costPerTon,
            salesPerTon: salesPerTon,
            profitPerTon: salesPerTon - costPerTon,
        };
    });
}
// Old snapshots used kg for ingredients and grams for additives.
function savedQuantityKg(row, additive) {
    return (row.quantityKg ?? (0, feed_types_1.toKg)(row.quantity, row.unit ?? (additive ? "g" : "kg")));
}
// Medicines entered under Ingredients are still kg. Only their worker-sheet
// position changes. Add another exact name here if you introduce a medicine.
const workerMedicineNames = new Set([
    "methionine",
    "lysine",
    "technozyme500gm",
    "technozyme500g",
    "technozymemulti",
    "sodabicarbonate",
    "threonine",
    "theronine",
]);
const isWorkerMedicine = (name) => workerMedicineNames.has(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
// Explicit whitelist: no prices, rates, costs or profits in worker responses.
function workerSheets(sheets) {
    return sheets.map((saved) => {
        const sheet = formatProfitSheet(saved);
        // Exactly the middle ingredients table from P/L.
        const ingredients = sheet.ingredients.map((row) => {
            const referenceKg = row.quantityKg;
            return {
                name: row.name,
                referenceKg,
                batchKg: referenceKg * 0.8,
            };
        });
        // Exactly the left additives table from P/L.
        const additives = sheet.additives.map((row) => {
            const referenceKg = row.quantityKg;
            const one = referenceKg * 0.8;
            return {
                name: row.name,
                referenceKg,
                one,
                five: one * 5,
                ten: one * 10,
            };
        });
        const ingredientReference = sheet.ingredientKg;
        const additiveReference = sheet.additiveKg;
        const additiveOne = additiveReference * 0.8;
        // Workers receive quantities only.
        return {
            code: sheet.code,
            ingredients,
            additives,
            ingredientReference,
            additiveReference,
            referenceKg: ingredientReference + additiveReference,
            ingredientTotal: ingredientReference * 0.8,
            additiveOne,
            additiveFive: additiveOne * 5,
            additiveTen: additiveOne * 10,
            fullBatchKg: (ingredientReference + additiveReference) * 0.8,
        };
    });
}
// One grouping used by the P/L screen, P/L Excel and worker sheets.
function formatProfitSheet(sheet) {
    const normalize = (row, fromAdditives) => {
        const quantityKg = savedQuantityKg(row, fromAdditives);
        return {
            ...row,
            quantity: quantityKg,
            quantityKg,
            unit: "kg",
        };
    };
    // Middle P/L table: bulk ingredients only.
    const ingredients = sheet.ingredients
        .filter((row) => !isWorkerMedicine(row.name))
        .map((row) => normalize(row, false));
    // Left P/L table: kg medicines followed by original gram additives.
    const additives = [
        ...sheet.ingredients
            .filter((row) => isWorkerMedicine(row.name))
            .map((row) => normalize(row, false)),
        ...sheet.additives.map((row) => normalize(row, true)),
    ];
    const quantity = (rows) => rows.reduce((total, row) => total + row.quantityKg, 0);
    const amount = (rows) => rows.reduce((total, row) => total + row.amount, 0);
    const ingredientKg = quantity(ingredients);
    const additiveKg = quantity(additives);
    return {
        ...sheet,
        ingredients,
        additives,
        ingredientKg,
        additiveKg,
        additiveGrams: additiveKg * 1000,
        ingredientAmount: amount(ingredients),
        additiveAmount: amount(additives),
        recipeKg: ingredientKg + additiveKg,
    };
}
