"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staff_And_Management = exports.PL_Viewers = exports.All_Roles = exports.Admin_and_Director = exports.STAFF_Only = exports.Admin_Only = exports.Role = void 0;
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["STAFF"] = "STAFF";
    Role["ADMIN"] = "ADMIN";
    Role["DIRECTOR"] = "DIRECTOR";
    Role["DIR_SUBASH"] = "DIR_SUBASH";
})(Role || (exports.Role = Role = {}));
exports.Admin_Only = [Role.ADMIN];
exports.STAFF_Only = [Role.STAFF, Role.ADMIN];
exports.Admin_and_Director = [Role.DIRECTOR, Role.ADMIN];
exports.All_Roles = [Role.ADMIN, Role.STAFF, Role.DIRECTOR];
exports.PL_Viewers = [Role.ADMIN, Role.DIRECTOR, Role.DIR_SUBASH];
exports.Staff_And_Management = [
    Role.ADMIN,
    Role.DIRECTOR,
    Role.DIR_SUBASH,
    Role.USER,
    Role.STAFF,
];
