import { api, listData, searchParams } from ".";
import { ApiError } from "@/utils/api-error";
import type { ApiResponse } from "@/types/api.types";
import type { Folder, FolderContents, ListParams } from "@/types/records.types";

export async function getFolders(
  params: ListParams = {},
  signal?: AbortSignal,
) {
  return listData(
    await api.get<ApiResponse<Folder[]>>("/folder", {
      params: searchParams(params),
      signal,
    }),
  );
}
export async function getFolder(id: string, signal?: AbortSignal) {
  const contents = (
    await api.get<ApiResponse<FolderContents>>(
      `/folder/${encodeURIComponent(id)}`,
      { signal },
    )
  ).data.data;
  if (
    !contents?.folder ||
    typeof contents.folder._id !== "string" ||
    !Array.isArray(contents.subfolders) ||
    !Array.isArray(contents.files)
  ) {
    throw new ApiError(
      "The server returned invalid folder contents. Please try again.",
    );
  }
  return contents;
}
export async function createFolder(data: {
  name: string;
  category: string;
  parentFolder: string | null;
}) {
  return (await api.post<ApiResponse<Folder>>("/folder/create", data)).data
    .data;
}
export async function deleteFolder(id: string) {
  await api.delete(`/folder/delete/${encodeURIComponent(id)}`);
}
