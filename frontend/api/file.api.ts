import { api, listData, searchParams } from ".";
import type { ApiResponse } from "@/types/api.types";
import type { CompanyFile, ListParams } from "@/types/records.types";

export async function getFiles(params: ListParams = {}, signal?: AbortSignal) {
  return listData(
    await api.get<ApiResponse<CompanyFile[]>>("/file", {
      params: searchParams(params),
      signal,
    }),
  );
}
export async function createFile(data: FormData) {
  return (
    await api.post<ApiResponse<CompanyFile>>("/file/create", data, {
      timeout: 120_000,
    })
  ).data.data;
}
export async function updateFile(
  id: string,
  data: { name: string; parentFolder?: string },
) {
  return (
    await api.patch<ApiResponse<CompanyFile>>(
      `/file/update/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}
export async function deleteFile(id: string) {
  await api.delete(`/file/delete/${encodeURIComponent(id)}`);
}
