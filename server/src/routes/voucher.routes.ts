import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import AppError from "../utils/appError.utils";
import { voucherController } from "../controller/voucher.controller";
import type { VoucherKind } from "../models/voucher.model";

// const allowedRoles = ["ADMIN", "DIRECTOR", "STAFF"];
const allowedRoles = ["ADMIN", "DIRECTOR"];

function voucherRouter(kind: VoucherKind) {
  const router = Router();
  const controller = voucherController(kind);

  router.use(authenticate());

  router.use(async (req, res, next) => {
    try {
      res.setHeader("Cache-Control", "no-store");

      // Check the current database role.
      const user = await User.findById(req.user._id).select("role").lean();

      if (!user || !allowedRoles.includes(user.role)) {
        throw new AppError("You cannot access these records.", 403);
      }

      if (
        ["POST", "PATCH", "DELETE"].includes(req.method) &&
        req.get("X-Voucher-Request") !== "1"
      ) {
        throw new AppError("Invalid voucher request.", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  router.get("/", controller.list);
  router.post("/", controller.create);

  router.get("/:id", controller.get);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

export const rasidRoutes = voucherRouter("rasid");
export const bharpaiRoutes = voucherRouter("bharpai");
