import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let message = error?.message ?? "Internal server error";
  let status = error?.status ?? "Error";
  let statusCode = error?.statusCode ?? 500;
  const success = false;

  // if ((error?.cause?.code = 11000)) {
  //   statusCode = 400;
  //   status = "Fail";
  // }

  if (error instanceof JsonWebTokenError) {
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
