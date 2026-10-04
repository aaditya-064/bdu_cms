import { NextFunction, Request, RequestHandler, Response } from "express";

export const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      return fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

  //   Promise.resolve(fn(req, res, next)).catch(err => next(err))
};
