import { api } from ".";
import type { ApiResponse } from "@/types/api.types";
import type { Voucher, VoucherInput, VoucherKind } from "@/types/voucher.types";

export async function getVouchers(
  kind: VoucherKind,
  page: number,
  q: string,
  signal?: AbortSignal,
) {
  const response = await api.get<
    ApiResponse<{
      items: Voucher[];
      hasMore: boolean;
    }>
  >(`/${kind}`, {
    params: { page, q },
    signal,
  });

  return response.data.data;
}

export async function getVoucher(
  kind: VoucherKind,
  id: string,
  signal?: AbortSignal,
) {
  const response = await api.get<ApiResponse<Voucher>>(
    `/${kind}/${encodeURIComponent(id)}`,
    { signal },
  );

  return response.data.data;
}

export async function saveVoucher(
  kind: VoucherKind,
  input: VoucherInput,
  requestId: string,
) {
  const response = await api.post<ApiResponse<Voucher>>(
    `/${kind}`,
    {
      ...input,
      requestId,
    },
    {
      headers: {
        "X-Voucher-Request": "1",
      },
    },
  );

  return response.data.data;
}

export async function updateVoucher(
  kind: VoucherKind,
  record: Voucher,
  input: VoucherInput,
) {
  const response = await api.patch<ApiResponse<Voucher>>(
    `/${kind}/${encodeURIComponent(record._id)}`,
    {
      ...input,
      updatedAt: record.updatedAt,
    },
    {
      headers: {
        "X-Voucher-Request": "1",
      },
    },
  );

  return response.data.data;
}

export async function deleteVoucher(kind: VoucherKind, record: Voucher) {
  await api.delete(`/${kind}/${encodeURIComponent(record._id)}`, {
    headers: {
      "X-Voucher-Request": "1",
    },
    data: {
      updatedAt: record.updatedAt,
    },
  });
}
