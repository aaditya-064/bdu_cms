export type Role =
  | "USER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "STAFF"
  | "DIRECTOR"
  | "DIR_SUBASH";
export type User = {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: Role;
  profile_image?: { path: string; public_id: string };
  createdAt?: string;
};
export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { full_name: string; phone: string };
