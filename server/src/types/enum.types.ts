export enum Role {
  USER = "USER",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
  DIRECTOR = "DIRECTOR",
  DIR_SUBASH = "DIR_SUBASH",
}

export const Admin_Only = [Role.ADMIN];
export const STAFF_Only = [Role.STAFF, Role.ADMIN];
export const Admin_and_Director = [Role.DIRECTOR, Role.ADMIN];
export const All_Roles = [Role.ADMIN, Role.STAFF, Role.DIRECTOR];
export const PL_Viewers = [Role.ADMIN, Role.DIRECTOR, Role.DIR_SUBASH];
export const Staff_And_Management = [
  Role.ADMIN,
  Role.DIRECTOR,
  Role.DIR_SUBASH,
  Role.USER,
  Role.STAFF,
];
