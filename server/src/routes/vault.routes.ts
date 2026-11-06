import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import * as vault from "../controller/vault.controller";

const router = express.Router();

router.use(authenticate());

router.use(
  catchAsync(async (req, res, next) => {
    const account = await User.findById(req.user._id).select("role");

    if (!account) throw new AppError("Account not found", 401);

    res.locals.manageVault =
      account.role === "ADMIN" || account.role === "DIRECTOR";

    res.setHeader("Cache-Control", "private, no-store");
    next();
  }),
);

router.get("/", vault.getAll);
router.get("/:id", vault.getById);

// Every route below this point requires ADMIN or DIRECTOR.
router.use((_req, res, next) => {
  if (!res.locals.manageVault) {
    return next(new AppError("Access denied", 403));
  }
  next();
});

router.post("/create", vault.create);
router.patch("/update/:id", vault.update);
router.patch("/:id/access", vault.changeAccess);
router.delete("/delete/:id", vault.remove);

export default router;

// router.get("/", getAll);
// router.get("/:id", getById);
// router.post("/create", authenticate(Admin_and_Director), create);
// router.patch("/update/:id", authenticate(Admin_and_Director), update);
// router.delete("/delete/:id", authenticate(Admin_and_Director), remove);
