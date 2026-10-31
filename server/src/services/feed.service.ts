import {
  Calculation,
  Costs,
  PRODUCTS,
  Rate,
  RecipeInput,
  keyOf,
} from "../types/feed.types";
import AppError from "../utils/appError.utils";

const fail = (message: string): never => {
  throw new AppError(message, 400);
};
export const round = (n: number, places = 6) => Number(n.toFixed(places));
export function number(value: unknown, label: string, max = 1_000_000): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  )
    fail(`Invalid ${label}`);
  return value as number;
}
export function validateRecipe(data: RecipeInput) {
  if (
    !data ||
    typeof data.title !== "string" ||
    !data.title.trim() ||
    data.title.length > 100
  )
    fail("Enter a title (maximum 100 characters)");
  if (!Object.prototype.hasOwnProperty.call(PRODUCTS, data.brand))
    fail("Invalid brand");
  if (
    !Array.isArray(data.codes) ||
    !data.codes.length ||
    data.codes.length > 3 ||
    new Set(data.codes).size !== data.codes.length ||
    data.codes.some((c) => !PRODUCTS[data.brand].includes(c))
  )
    fail("Check the product columns for this brand");
  if (!Array.isArray(data.rows) || !data.rows.length || data.rows.length > 100)
    fail("Provide 1–100 recipe rows");
  const seen = new Set<string>();
  for (const row of data.rows) {
    if (
      !row ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.name.length > 100 ||
      !["ingredient", "additive"].includes(row.kind)
    )
      fail("Invalid ingredient row");
    const key = `${row.kind}:${keyOf(row.name)}`;
    if (seen.has(key)) fail(`Duplicate ingredient: ${row.name}`);
    seen.add(key);
    if (
      !Array.isArray(row.quantities) ||
      row.quantities.length !== data.codes.length
    )
      fail(`Check columns for ${row.name}`);
    row.quantities.forEach((q) => number(q, row.name, 100_000));
  }
  for (let i = 0; i < data.codes.length; i++) {
    if (!data.rows.some((row) => row.quantities[i] > 0))
      fail(`${data.codes[i]} has no quantities`);
  }
}
export function validateCosts(raw: Costs): Costs {
  if (!raw) fail("Provide costs for every product");
  const costs = Object.fromEntries(
    [
      "bags",
      "overhead",
      "utility",
      "freight",
      "labour",
      "pricePerTon",
      "commission",
    ].map((key) => [key, number(raw[key as keyof Costs], key)]),
  ) as Costs;
  if (!Number.isInteger(costs.bags))
    fail("Number of bags must be a whole number");
  if (costs.commission > costs.pricePerTon)
    fail("Commission cannot exceed price per ton");
  return costs;
}
export function calculate(
  recipe: RecipeInput,
  rates: Rate[],
  bagPrice: number,
  inputs: Record<string, Costs>,
): Calculation[] {
  validateRecipe(recipe);
  number(bagPrice, "bag price");
  return recipe.codes.map((code, column) => {
    const costs = validateCosts(inputs?.[code]);
    const rows = recipe.rows.map((row) => {
      const rate = rates.find(
        (rate) => rate.kind === row.kind && rate.key === keyOf(row.name),
      );
      if (!rate || rate.price === null || rate.price === undefined)
        fail(`Set the rate for ${row.name} in ${recipe.brand}`);
      const price = number(rate!.price, `rate for ${row.name}`);
      const quantity = row.quantities[column];
      return {
        name: row.name,
        kind: row.kind,
        quantity,
        price,
        amount: (quantity * price) / (row.kind === "additive" ? 1000 : 1),
        rateDate: rate!.changedAt ?? null,
      };
    });
    const ingredients = rows
      .filter((r) => r.kind === "ingredient")
      .map(({ kind, ...row }) => row);
    const additives = rows
      .filter((r) => r.kind === "additive")
      .map(({ kind, ...row }) => row);
    const sum = (
      list: typeof ingredients,
      key: "quantity" | "price" | "amount",
    ) => list.reduce((total, row) => total + row[key], 0);
    const ingredientKg = sum(ingredients, "quantity"),
      additiveGrams = sum(additives, "quantity");
    const ingredientAmount = sum(ingredients, "amount"),
      additiveAmount = sum(additives, "amount");
    const bagAmount = costs.bags * bagPrice;
    const totalCost = ingredientAmount + additiveAmount + bagAmount;
    const goodsLoss = totalCost * 0.02;
    const grandTotal =
      totalCost +
      goodsLoss +
      costs.overhead +
      costs.utility +
      costs.freight +
      costs.labour;
    // Mirrors the supplied sheet: nominal recipe = one ton, no silent normalization.
    const costPerTon = grandTotal;
    const salesPerTon = costs.pricePerTon - costs.commission;
    return {
      code,
      ingredients,
      additives,
      inputs: costs,
      bagPrice,
      ingredientKg: round(ingredientKg),
      additiveGrams: round(additiveGrams),
      ingredientPrices: round(sum(ingredients, "price")),
      additivePrices: round(sum(additives, "price")),
      ingredientAmount: round(ingredientAmount),
      additiveAmount: round(additiveAmount),
      bagAmount: round(bagAmount),
      recipeKg: round(ingredientKg + additiveGrams / 1000),
      totalCost: round(totalCost),
      goodsLoss: round(goodsLoss),
      grandTotal: round(grandTotal),
      costPerTon: round(costPerTon),
      salesPerTon: round(salesPerTon),
      profitPerTon: round(salesPerTon - costPerTon),
    };
  });
}
// Explicit whitelist: no rate, revenue, cost or P/L fields reach worker responses.
export function workerSheets(sheets: Calculation[]) {
  return sheets.map((sheet) => {
    const ingredients = sheet.ingredients.map((row) => ({
      name: row.name,
      batchKg: round(row.quantity * 0.8),
    }));
    const additives = sheet.additives.map((row) => ({
      name: row.name,
      one: round((row.quantity / 1000) * 0.8),
      five: round((row.quantity / 1000) * 4),
      ten: round((row.quantity / 1000) * 8),
    }));
    const additiveOne = round((sheet.additiveGrams / 1000) * 0.8);
    return {
      code: sheet.code,
      ingredients,
      additives,
      ingredientTotal: round(sheet.ingredientKg * 0.8),
      additiveOne,
      additiveFive: round(additiveOne * 5),
      additiveTen: round(additiveOne * 10),
      fullBatchKg: round(sheet.recipeKg * 0.8),
    };
  });
}
