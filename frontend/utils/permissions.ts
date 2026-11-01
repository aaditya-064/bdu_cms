import type { User } from "@/types/auth.types";

type Account = Pick<User, "role"> | null | undefined;

export function canManage(user: Account) {
  return user?.role === "ADMIN" || user?.role === "DIRECTOR";
}

export function canCreateDocuments(user: Account) {
  return (
    canManage(user) ||
    user?.role === "USER" ||
    user?.role === "STAFF" ||
    user?.role === "DIR_SUBASH"
  );
}

export function canEditStaff(user: Account) {
  return canCreateDocuments(user);
}

export function canViewPL(user: Account) {
  return canManage(user) || user?.role === "DIR_SUBASH";
}

export const vaultEnabled = process.env.NEXT_PUBLIC_ENABLE_VAULT === "true";
