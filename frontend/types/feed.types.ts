export const PRODUCTS = {
  giriraj: ["G1", "G2", "G3"],
  shraddha: ["B0", "B1", "B2"],
  sirjan: ["B0", "B1", "B2"],
  layers: ["L1", "L2", "L3"],
};
export type Brand = keyof typeof PRODUCTS;
export type Kind = "ingredient" | "additive";
export type RecipeRow = { name: string; kind: Kind; quantities: number[] };
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
  labour: number;
  pricePerTon: number;
  commission: number;
};
export type Rate = {
  name: string;
  key: string;
  kind: Kind;
  price: number | null;
  changedAt?: Date | string | null;
};
export type CostRow = {
  name: string;
  quantity: number;
  price: number;
  amount: number;
  rateDate: Date | string | null;
};
export type Calculation = {
  code: string;
  ingredients: CostRow[];
  additives: CostRow[];
  inputs: Costs;
  bagPrice: number;
  ingredientKg: number;
  additiveGrams: number;
  ingredientPrices: number;
  additivePrices: number;
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

export type SavedRecipe = RecipeInput & {
  _id: string;
  sheets: Calculation[];
  publishedAt?: string;
  createdAt: string;
};
export type RateRecord = Rate & {
  _id: string;
  history: { price: number; date: string }[];
};
export type WorkerSheet = {
  code: string;
  ingredients: { name: string; batchKg: number }[];
  additives: { name: string; one: number; five: number; ten: number }[];
  ingredientTotal: number;
  additiveOne: number;
  additiveFive: number;
  additiveTen: number;
  fullBatchKg: number;
};
export type WorkerRecord = {
  _id: string;
  title: string;
  brand: Brand;
  publishedAt: string;
  sheets: WorkerSheet[];
};
export type RecipeSummary = {
  _id: string;
  title: string;
  brand: Brand;
  codes: string[];
  publishedAt?: string;
};

export type ProfitRecord = {
  _id: string;
  title: string;
  brand: Brand;
  codes: string[];
  publishedAt: string;
  sheets: Calculation[];
};
