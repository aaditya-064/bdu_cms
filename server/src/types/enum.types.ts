export enum Role {
  STAFF = "STAFF",
  ADMIN = "ADMIN",
  DIRECTOR = "DIRECTOR",
}

export const Admin_Only = [Role.ADMIN, Role.DIRECTOR];
export const STAFF_Only = [Role.STAFF, Role.ADMIN];
export const Director_Only = [Role.DIRECTOR, Role.ADMIN];
