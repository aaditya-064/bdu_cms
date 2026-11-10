"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKg = exports.keyOf = exports.PRODUCTS = void 0;
exports.PRODUCTS = {
    giriraj: ["G1", "G2", "G3"],
    shraddha: ["B0", "B1", "B2"],
    sirjan: ["B0", "B1", "B2"],
    layers: ["L1", "L2", "L3"],
};
const keyOf = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();
exports.keyOf = keyOf;
const toKg = (quantity, unit) => unit === "g" ? quantity / 1000 : quantity;
exports.toKg = toKg;
