import { api, listData, searchParams } from ".";
import type { ApiResponse } from "@/types/api.types";
import type {
  ListParams,
  Vault,
  VaultInput,
  VaultSummary,
} from "@/types/records.types";
import { ApiError } from "@/utils/api-error";
import { vaultEnabled } from "@/utils/permissions";

function assertEnabled() {
  if (!vaultEnabled) {
    throw new ApiError("Vault access is unavailable.", 403);
  }
}

export async function getVaults(params: ListParams = {}, signal?: AbortSignal) {
  assertEnabled();

  return listData(
    await api.get<ApiResponse<VaultSummary[]>>("/vault", {
      params: searchParams({ sortBy: "name", order: "asc", ...params }),
      signal,
    }),
  );
}

export async function getVault(id: string) {
  assertEnabled();

  const response = await api.get<ApiResponse<Vault>>(
    `/vault/${encodeURIComponent(id)}`,
  );

  return response.data.data;
}

export async function createVault(data: VaultInput) {
  assertEnabled();

  const response = await api.post<ApiResponse<{ vault: VaultSummary }>>(
    "/vault/create",
    data,
  );

  return response.data.data.vault;
}

export async function updateVault(id: string, data: VaultInput) {
  assertEnabled();

  const response = await api.patch<ApiResponse<VaultSummary>>(
    `/vault/update/${encodeURIComponent(id)}`,
    data,
  );

  return response.data.data;
}

export async function deleteVault(id: string) {
  assertEnabled();
  await api.delete(`/vault/delete/${encodeURIComponent(id)}`);
}

export async function changeVaultAccess(
  id: string,
  change: { action: "lock" | "unlock" } | { action: "share"; email: string },
) {
  assertEnabled();

  const response = await api.patch<ApiResponse<{ isLocked: boolean }>>(
    `/vault/${encodeURIComponent(id)}/access`,
    change,
  );

  return response.data.data;
}
