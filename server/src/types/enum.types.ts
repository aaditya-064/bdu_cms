export enum Role {
  STAFF = "STAFF",
  ADMIN = "ADMIN",
  DIRECTOR = "DIRECTOR",
}

export const Admin_Only = [Role.ADMIN];
export const STAFF_Only = [Role.STAFF, Role.ADMIN];
export const Admin_and_Director = [Role.DIRECTOR, Role.ADMIN];
