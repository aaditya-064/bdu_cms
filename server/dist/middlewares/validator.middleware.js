"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        console.log(result);
        if (!result.success) {
            // ['body', 'full_name']
            const errors = result.error.issues.map((issue) => {
                return {
                    path: issue.path.join("."),
                    message: issue.message,
                };
            });
            return next(new appError_utils_1.default("Validation Error", 400, errors));
        }
        //* if validation passed
        req.body = result.data.body;
        req.params = result.data.params;
        Object.assign(req.query, result.data.query);
        next();
    };
};
exports.validate = validate;
