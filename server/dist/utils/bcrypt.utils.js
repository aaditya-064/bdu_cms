"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const hashPassword = async (password) => {
    try {
        // salt
        const salt = await bcryptjs_1.default.genSalt(10);
        //hash
        return await bcryptjs_1.default.hash(password, salt);
    }
    catch (err) {
        console.log(err);
        throw err;
    }
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    try {
        return await bcryptjs_1.default.compare(password, hash);
    }
    catch (err) {
        throw err;
    }
};
exports.comparePassword = comparePassword;
