import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import * as feed from "../controller/feed.controller";

const router = express.Router();
router.use(authenticate());
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

// Read the current account role; do not trust an old role inside a login token.
const allow = (...roles: string[]) =>
  catchAsync(async (req, _res, next) => {
    const user = await User.findById(req.user._id).select("role");
    if (!user || !roles.includes(user.role)) {
      throw new AppError("Access denied", 403);
    }
    next();
  });

const staff = ["DIRECTOR", "ADMIN", "DIR_SUBASH", "USER", "STAFF"];
const management = ["DIRECTOR", "ADMIN"];
const viewers = ["DIRECTOR", "ADMIN", "DIR_SUBASH"];

router.get("/batches", allow(...staff), feed.listBatches);
router.get("/batches/:id/excel", allow(...management), feed.exportBatchExcel);
router.get("/batches/:id", allow(...staff), feed.getBatch);

router.get("/pl", allow(...viewers), feed.listProfitSheets);
router.get("/pl/:id/excel", allow("ADMIN", "DIRECTOR"), feed.exportProfitExcel);
router.get("/pl/:id", allow(...viewers), feed.getProfitSheet);

router.get("/settings", allow(...viewers), feed.getSettings);
router.patch("/settings", allow(...viewers), feed.setSettings);
router.get("/rates", allow(...viewers), feed.getRates);
router.patch("/rates", allow(...viewers), feed.setRates);

// Preserve the supplied backend's Director-only formulation editing.
router.get("/recipes", allow("DIRECTOR"), feed.listRecipes);
router.post("/recipes", allow("DIRECTOR"), feed.createRecipe);
router.get("/recipes/:id", allow("DIRECTOR"), feed.getRecipe);
router.post("/recipes/:id/calculate", allow("DIRECTOR"), feed.saveCalculation);

export default router;
