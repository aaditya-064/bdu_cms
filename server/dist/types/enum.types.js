"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin_and_Director = exports.STAFF_Only = exports.Admin_Only = exports.Role = void 0;
var Role;
(function (Role) {
    Role["STAFF"] = "STAFF";
    Role["ADMIN"] = "ADMIN";
    Role["DIRECTOR"] = "DIRECTOR";
})(Role || (exports.Role = Role = {}));
exports.Admin_Only = [Role.ADMIN];
exports.STAFF_Only = [Role.STAFF, Role.ADMIN];
exports.Admin_and_Director = [Role.DIRECTOR, Role.ADMIN];
