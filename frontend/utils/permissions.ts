import type { User } from "@/types/auth.types";

type Account = Pick<User, "role"> | null | undefined;

// Management-only permissions: do not expand this to USER/STAFF.
export function canManage(user: Account) {
  return user?.role === "ADMIN" || user?.role === "DIRECTOR";
}

// Staff may upload files and create folders.
export function canCreateDocuments(user: Account) {
  return canManage(user) || user?.role === "STAFF";
}

// Staff may create and edit staff directory records.
export function canEditStaff(user: Account) {
  return canManage(user) || user?.role === "STAFF";
}

export const vaultEnabled = process.env.NEXT_PUBLIC_ENABLE_VAULT === "true";
