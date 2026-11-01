import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import * as feed from "../controller/feed.controller";

const router = express.Router();
router.use(authenticate());
// Check the current database role, including after an account role is changed.
const allow = (...roles: string[]) =>
  catchAsync(async (req, _res, next) => {
    const user = await User.findById(req.user._id).select("role");
    if (!user || !roles.includes(user.role))
      throw new AppError("Access denied", 403);
    next();
  });
router.get(
  "/batches",
  allow("DIRECTOR", "ADMIN", "STAFF", "DIR_SUBASH"),
  feed.listBatches,
);
router.get(
  "/batches/:id",
  allow("DIRECTOR", "ADMIN", "USER", "STAFF", "DIR_SUBASH"),
  feed.getBatch,
);
router.get("/settings", allow("DIRECTOR", "ADMIN"), feed.getSettings);
router.patch("/settings", allow("DIRECTOR", "ADMIN"), feed.setSettings);
router.get("/rates", allow("DIRECTOR", "ADMIN"), feed.getRates);
router.patch("/rates", allow("DIRECTOR", "ADMIN"), feed.setRates);
router.get("/recipes", allow("DIRECTOR"), feed.listRecipes);
router.post("/recipes", allow("DIRECTOR"), feed.createRecipe);
router.get("/recipes/:id", allow("DIRECTOR"), feed.getRecipe);
router.post("/recipes/:id/calculate", allow("DIRECTOR"), feed.saveCalculation);
router.get(
  "/pl",
  allow("ADMIN", "DIRECTOR", "DIR_SUBASH"),
  feed.listProfitSheets,
);

router.get(
  "/pl/:id",
  allow("ADMIN", "DIRECTOR", "DIR_SUBASH"),
  feed.getProfitSheet,
);
export default router;
