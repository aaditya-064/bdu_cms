export const PRODUCTS = {
  giriraj: ["G1", "G2", "G3"],
  shraddha: ["B0", "B1", "B2"],
  sirjan: ["B0", "B1", "B2"],
  layers: ["L1", "L2", "L3"],
};
export type Brand = keyof typeof PRODUCTS;
export type Kind = "ingredient" | "additive";
export type Unit = "kg" | "g";
export type RecipeRow = {
  name: string;
  kind: Kind;
  quantities: number[];
  unit?: Unit; // Missing only on saved recipes from the previous version.
  rateId?: string;
};
export type RecipeInput = {
  title: string;
  brand: Brand;
  codes: string[];
  rows: RecipeRow[];
};
export type Costs = {
  bags: number;
  overhead: number;
  utility: number;
  freight: number;
  labour: number; // Existing field now labelled Manufacture cost; counted once.
  firewood?: number;
  pricePerTon: number;
  commission: number;
};
export type Rate = {
  _id?: unknown;
  name: string;
  key: string;
  kind: Kind;
  price: number | null;
  changedAt?: Date | string | null;
};
export type CostRow = {
  name: string;
  quantity: number;
  unit?: Unit;
  quantityKg?: number;
  price: number;
  amount: number;
  rateDate: Date | string | null;
};
export type Calculation = {
  code: string;
  formatVersion?: 2;
  ingredients: CostRow[];
  additives: CostRow[];
  inputs: Costs;
  bagPrice: number;
  ingredientKg: number;
  additiveGrams: number; // Normalized kg × 1000; never a mixed-unit sum.
  additiveKg?: number;
  ingredientPrices?: number; // Legacy snapshot only.
  additivePrices?: number; // Legacy snapshot only.
  ingredientAmount: number;
  additiveAmount: number;
  bagAmount: number;
  recipeKg: number;
  totalCost: number;
  goodsLoss: number;
  grandTotal: number;
  costPerTon: number;
  salesPerTon: number;
  profitPerTon: number;
};
export const keyOf = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

export const toKg = (quantity: number, unit: Unit) =>
  unit === "g" ? quantity / 1000 : quantity;
