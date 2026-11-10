export type VoucherKind = "rasid" | "bharpai";

export type VoucherInput = {
  dateBs: string;
  personName: string;
  address: string;
  receivedThrough: string;
  municipality: string;
  ward: string;
  tole: string;
  purpose: string;
  dayName: string;
  paymentMethod: "CASH" | "CHEQUE";
  chequeNo: string;
  amount: string;
  amountWords: string;
  paidBy: string;
  receivedBy: string;
};

export type Voucher = Omit<VoucherInput, "amount"> & {
  _id: string;
  number: number;
  amountPaisa: number;
  createdAt: string;
  updatedAt: string;
};

// export function canUseVouchers(user: { role: string } | null | undefined) {
//   return !!user && ["ADMIN", "DIRECTOR", "STAFF"].includes(user.role);
// }

export function canUseVouchers(user: { role: string } | null | undefined) {
  return !!user && ["ADMIN", "DIRECTOR"].includes(user.role);
}
