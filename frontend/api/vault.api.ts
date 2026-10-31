import { api, listData, searchParams } from ".";
import { ApiError } from "@/utils/api-error";
import { vaultEnabled } from "@/utils/permissions";
import type { ApiResponse } from "@/types/api.types";
import type { Vault, VaultInput, ListParams } from "@/types/records.types";

function assertEnabled() {
  if (!vaultEnabled)
    throw new ApiError(
      "Vault access is unavailable. Contact your administrator.",
      403,
    );
}
export async function getVaults(params: ListParams = {}, signal?: AbortSignal) {
  assertEnabled();
  return listData(
    await api.get<ApiResponse<Vault[]>>("/vault", {
      params: searchParams({ sortBy: "name", order: "asc", ...params }),
      signal,
    }),
  );
}
export async function createVault(data: VaultInput) {
  assertEnabled();
  return (await api.post<ApiResponse<{ vault: Vault }>>("/vault/create", data))
    .data.data.vault;
}
export async function updateVault(id: string, data: VaultInput) {
  assertEnabled();
  return (
    await api.patch<ApiResponse<Vault>>(
      `/vault/update/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}
export async function deleteVault(id: string) {
  assertEnabled();
  await api.delete(`/vault/delete/${encodeURIComponent(id)}`);
}
