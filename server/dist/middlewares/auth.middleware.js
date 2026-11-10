"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const env_config_1 = __importDefault(require("../config/env.config"));
const authenticate = (roles) => {
    return (req, res, next) => {
        const authenticatedReq = req;
        try {
            const cookies = req.cookies;
            const access_token = cookies["access_token"];
            if (!access_token) {
                throw new Error("Unauthroized Login");
            }
            const decoded_data = (0, jwt_utils_1.verifyJwtToken)(access_token);
            if (!decoded_data) {
                throw new Error("Invalid Token. Login Required");
            }
            if (decoded_data.exp * 1000 <= Date.now()) {
                res.clearCookie("access_token", {
                    httpOnly: env_config_1.default.NODE_ENV === "development" ? false : true,
                    secure: env_config_1.default.NODE_ENV === "development" ? false : true,
                    maxAge: Date.now(),
                    sameSite: env_config_1.default.NODE_ENV === "development" ? "lax" : "none",
                });
                throw new Error("Token Expired");
            }
            if (roles && roles.length > 0 && !roles.includes(decoded_data.role)) {
                throw new Error("Forbidden. Access denied.");
            }
            //   req.user = decoded_data;
            authenticatedReq.user = {
                _id: decoded_data._id,
                email: decoded_data.email,
                role: decoded_data.role,
            };
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.authenticate = authenticate;
