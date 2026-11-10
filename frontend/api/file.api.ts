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
  data: {
    name: string;
    parentFolder?: string;
  },
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

export async function uploadDocumentPhoto(
  photo: File,
  name: string,
  parentFolder: string,
  onProgress: (percentage: number) => void,
) {
  const data = new FormData();

  data.append("file", photo);
  data.append("name", name);

  const response = await api.post<ApiResponse<CompanyFile>>(
    `/document-photos/folders/${encodeURIComponent(parentFolder)}/photo`,
    data,
    {
      timeout: 120_000,

      headers: {
        "X-Document-Upload": "1",
      },

      onUploadProgress: (event) => {
        if (event.total) {
          onProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        }
      },
    },
  );

  return response.data.data;
}
