import { api, listData, searchParams } from ".";
import type { ApiResponse } from "@/types/api.types";
import type { Staff, ListParams } from "@/types/records.types";

export async function getStaff(params: ListParams = {}, signal?: AbortSignal) {
  return listData(
    await api.get<ApiResponse<Staff[]>>("/staff", {
      params: searchParams(params),
      signal,
    }),
  );
}
export async function createStaff(data: FormData) {
  return (
    await api.post<ApiResponse<Staff>>("/staff/create", data, {
      timeout: 120_000,
    })
  ).data.data;
}
export async function updateStaff(id: string, data: FormData) {
  return (
    await api.patch<ApiResponse<Staff>>(
      `/staff/update/${encodeURIComponent(id)}`,
      data,
      { timeout: 120_000 },
    )
  ).data.data;
  ``;
}
export async function deleteStaff(id: string) {
  await api.delete(`/staff/delete/${encodeURIComponent(id)}`);
}
