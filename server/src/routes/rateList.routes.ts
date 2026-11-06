import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import { initialRows, ProductRateSheet } from "../models/rateList.model";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";

const router = express.Router();
const sheetId = "current";

const editors = new Set([
  "STAFF",
  "DIR_SUBASH",
  "DIRECTOR",
  "ADMIN",
  "SUPER_ADMIN",
]);

router.use(authenticate());

async function getAccess(userId: unknown) {
  const account = await User.findById(userId).select("role");

  if (!account) throw new AppError("Account not found", 401);

  const canEdit = editors.has(account.role);
  if (!canEdit && account.role !== "USER") {
    throw new AppError("Access denied", 403);
  }

  return canEdit;
}

function validRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

router.get(
  "/",
  catchAsync(async (req, res) => {
    const canEdit = await getAccess(req.user._id);
    const saved = await ProductRateSheet.findById(sheetId).lean();

    res.setHeader("Cache-Control", "private, no-store");

    sendResponse(res, {
      statusCode: 200,
      message: "Feed rates loaded",
      data: {
        effectiveDate: saved?.effectiveDate ?? "2083.07.18",
        revision: saved?.revision ?? 0,
        rows: saved?.rows ?? initialRows,
        canEdit,
      },
    });
  }),
);

router.put(
  "/",
  catchAsync(async (req, res) => {
    if (!(await getAccess(req.user._id))) {
      throw new AppError("You cannot edit feed rates", 403);
    }

    const { effectiveDate, revision, rows } = req.body ?? {};

    if (
      typeof effectiveDate !== "string" ||
      !/^\d{4}\.(0[1-9]|1[0-2])\.(0[1-9]|[12]\d|3[0-2])$/.test(effectiveDate)
    ) {
      throw new AppError("Enter the BS date as YYYY.MM.DD", 400);
    }

    if (!Number.isSafeInteger(revision) || revision < 0) {
      throw new AppError("Reload the price list before saving", 400);
    }

    if (!Array.isArray(rows) || rows.length !== initialRows.length) {
      throw new AppError("The product list is incomplete", 400);
    }

    const checkedRows = initialRows.map(({ product }, index) => {
      const row = rows[index];

      if (!row || row.product !== product || !validRate(row.rate)) {
        throw new AppError(`Check the new rate for ${product}`, 400);
      }

      if (row.outOfValley !== null && !validRate(row.outOfValley)) {
        throw new AppError(`Check the out-of-valley rate for ${product}`, 400);
      }

      return { product, rate: row.rate, outOfValley: row.outOfValley };
    });

    const conflict = () =>
      new AppError("Someone updated the rates. Reload before saving.", 409);

    try {
      const saved = await ProductRateSheet.findOneAndUpdate(
        { _id: sheetId, revision },
        {
          $set: {
            effectiveDate,
            rows: checkedRows,
            updatedBy: req.user._id,
          },
          $inc: { revision: 1 },
        },
        {
          new: true,
          upsert: revision === 0,
          runValidators: true,
          setDefaultsOnInsert: false,
        },
      );

      if (!saved) throw conflict();
    } catch (error) {
      // Another editor may have created the first sheet before this save.
      if ((error as { code?: number }).code === 11000) throw conflict();
      throw error;
    }

    sendResponse(res, {
      statusCode: 200,
      message: "Feed rates saved",
      data: { revision: revision + 1 },
    });
  }),
);

export default router;
