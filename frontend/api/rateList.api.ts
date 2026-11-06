import { api } from ".";
import type { ApiResponse } from "@/types/api.types";

export type ProductRateRow = {
  product: string;
  rate: number;
  outOfValley: number | null;
};

export type ProductRateSheet = {
  effectiveDate: string;
  revision: number;
  rows: ProductRateRow[];
  canEdit: boolean;
};

export async function getProductRates(signal: AbortSignal) {
  const response = await api.get<ApiResponse<ProductRateSheet>>("/feed-rates", {
    signal,
  });

  return response.data.data;
}

export async function saveProductRates(
  data: Pick<ProductRateSheet, "effectiveDate" | "revision" | "rows">,
) {
  await api.put("/feed-rates", data);
}
