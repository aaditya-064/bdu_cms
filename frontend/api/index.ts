import axios, { type AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/api.types";
import type { ListParams } from "@/types/records.types";
import { ApiError, isSessionError, normalizeError } from "@/utils/api-error";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8080/api/v1"
    : undefined);
export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  if (!baseURL)
    throw new ApiError(
      "The service is not configured. Please contact your administrator.",
    );
  return config;
});
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (
      !body ||
      typeof body !== "object" ||
      body.success !== true ||
      !("data" in body)
    ) {
      throw new ApiError(
        "The server returned an unexpected response. Please contact your administrator.",
        response.status,
      );
    }
    return response;
  },
  (error: unknown) => {
    const normalized = normalizeError(error);
    const path = axios.isAxiosError(error) ? error.config?.url : undefined;
    if (
      typeof window !== "undefined" &&
      isSessionError(normalized) &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    ) {
      window.dispatchEvent(new Event("session-expired"));
    }
    return Promise.reject(normalized);
  },
);

export function listData<T>(response: AxiosResponse<ApiResponse<T[]>>) {
  if (!Array.isArray(response.data.data))
    throw new ApiError(
      "The server returned an invalid list of records. Please try again.",
    );
  return response.data.data;
}

export function searchParams(params: ListParams): ListParams {
  return {
    ...params,
    ...(params.query
      ? { query: params.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
      : {}),
  };
}
