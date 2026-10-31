"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const errorHandler = (error, req, res, next) => {
    let message = error?.message ?? "Internal server error";
    let status = error?.status ?? "Error";
    let statusCode = error?.statusCode ?? 500;
    const success = false;
    // if ((error?.cause?.code = 11000)) {
    //   statusCode = 400;
    //   status = "Fail";
    // }
    if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
        message = "Invalid Token. Login required";
        statusCode = 401;
    }
    res.status(statusCode).json({
        message,
        status,
        success,
        data: null,
        details: error?.errors || null,
        originalError: error?.stack,
    });
};
exports.errorHandler = errorHandler;
