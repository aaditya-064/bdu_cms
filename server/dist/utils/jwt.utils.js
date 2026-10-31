"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwtToken = exports.generateJwtToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = __importDefault(require("../config/env.config"));
//* generate token
const generateJwtToken = (payload) => {
    try {
        return jsonwebtoken_1.default.sign(payload, env_config_1.default.JWT_SECRET, {
            expiresIn: env_config_1.default.JWT_EXPIRES_IN,
        });
    }
    catch (error) {
        console.log(error);
        throw error;
    }
};
exports.generateJwtToken = generateJwtToken;
//* verify jwt token
const verifyJwtToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_config_1.default.JWT_SECRET);
    }
    catch (error) {
        console.log(error);
        throw error;
    }
};
exports.verifyJwtToken = verifyJwtToken;
