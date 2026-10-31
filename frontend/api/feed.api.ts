import { api } from ".";
import type { ApiResponse } from "@/types/api.types";
import type {
  Brand,
  Costs,
  RateRecord,
  RecipeInput,
  RecipeSummary,
  SavedRecipe,
  WorkerRecord,
} from "@/types/feed.types";
export const getFeedRates = async (brand: Brand) =>
  (
    await api.get<ApiResponse<RateRecord[]>>("/feed/rates", {
      params: { brand },
    })
  ).data.data;
export const saveFeedRates = async (rates: { id: string; price: number }[]) =>
  api.patch("/feed/rates", { rates });
export const getFeedSettings = async () =>
  (await api.get<ApiResponse<{ bagPrice: number | null }>>("/feed/settings"))
    .data.data;
export const saveBagPrice = async (bagPrice: number) =>
  api.patch("/feed/settings", { bagPrice });
export const importRecipe = async (data: RecipeInput) =>
  (await api.post<ApiResponse<{ _id: string }>>("/feed/recipes", data)).data
    .data;
export const listFeedRecipes = async () =>
  (await api.get<ApiResponse<RecipeSummary[]>>("/feed/recipes")).data.data;
export const getFeedRecipe = async (id: string) =>
  (
    await api.get<ApiResponse<SavedRecipe>>(
      `/feed/recipes/${encodeURIComponent(id)}`,
    )
  ).data.data;
export const calculateRecipe = async (
  id: string,
  costs: Record<string, Costs>,
) =>
  (
    await api.post<ApiResponse<SavedRecipe>>(
      `/feed/recipes/${encodeURIComponent(id)}/calculate`,
      { costs },
    )
  ).data.data;
export const listFeedBatches = async () =>
  (await api.get<ApiResponse<RecipeSummary[]>>("/feed/batches")).data.data;
export const getFeedBatch = async (id: string) =>
  (
    await api.get<ApiResponse<WorkerRecord>>(
      `/feed/batches/${encodeURIComponent(id)}`,
    )
  ).data.data;
