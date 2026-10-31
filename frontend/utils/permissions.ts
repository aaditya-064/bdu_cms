import type { User } from "@/types/auth.types";

// Mirror the actual route middleware. Do not alias SUPER_ADMIN to ADMIN.
export function canManage(user: Pick<User, "role"> | null) {
  return user?.role === "ADMIN" || user?.role === "DIRECTOR";
}
export function canEditStaff(user: Pick<User, "role"> | null) {
  return user?.role === "ADMIN";
}
export const vaultEnabled = process.env.NEXT_PUBLIC_ENABLE_VAULT === "true";
