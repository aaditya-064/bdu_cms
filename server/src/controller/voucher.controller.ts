import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";

import {
  Rasid,
  Bharpai,
  VoucherCounter,
  ensureVoucherIndexes,
} from "../models/voucher.model";

import type { VoucherKind } from "../models/voucher.model";

import AppError from "../utils/appError.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import { amountInWords } from "../utils/amount-in-words";

const englishDigits = (value: string) =>
  value.replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)));

function readInput(body: Record<string, unknown>, kind: VoucherKind) {
  function text(key: string, required = false, max = 80) {
    const raw = body[key];

    if (raw !== undefined && typeof raw !== "string") {
      throw new AppError(`${key} must be text.`, 400);
    }

    const value = typeof raw === "string" ? raw.trim() : "";

    if ((required && !value) || value.length > max) {
      throw new AppError(
        `Check ${key}: ${
          required ? "required, " : ""
        }maximum ${max} characters.`,
        400,
      );
    }

    return value;
  }

  const date = englishDigits(text("dateBs", true, 10)).replace(/[-.]/g, "/");

  const parts = /^(20\d{2}|21\d{2})\/(\d{1,2})\/(\d{1,2})$/.exec(date);

  if (
    !parts ||
    Number(parts[2]) < 1 ||
    Number(parts[2]) > 12 ||
    Number(parts[3]) < 1 ||
    Number(parts[3]) > 32
  ) {
    throw new AppError("Enter a BS date like 2083/07/24.", 400);
  }

  const amount = englishDigits(text("amount", true, 20));

  if (!/^\d{1,9}(\.\d{1,2})?$/.test(amount)) {
    throw new AppError(
      "Enter a positive amount with at most two decimal places, without commas.",
      400,
    );
  }

  const [rupees, paisa = ""] = amount.split(".");

  const amountPaisa = Number(rupees) * 100 + Number(paisa.padEnd(2, "0"));

  if (amountPaisa < 1) {
    throw new AppError("Amount must be greater than zero.", 400);
  }

  const paymentMethod = text("paymentMethod", true, 10);

  if (paymentMethod !== "CASH" && paymentMethod !== "CHEQUE") {
    throw new AppError("Select Cash or Cheque.", 400);
  }

  return {
    dateBs: `${parts[1]}/${parts[2].padStart(
      2,
      "0",
    )}/${parts[3].padStart(2, "0")}`,

    personName: text("personName", true),

    address: kind === "rasid" ? text("address", true, 100) : "",

    receivedThrough: kind === "rasid" ? text("receivedThrough") : "",

    municipality: kind === "bharpai" ? text("municipality", true) : "",

    ward: kind === "bharpai" ? text("ward", true, 10) : "",

    tole: kind === "bharpai" ? text("tole", true) : "",

    purpose: kind === "bharpai" ? text("purpose", true, 160) : "",

    dayName: kind === "bharpai" ? text("dayName", true, 20) : "",

    paymentMethod: paymentMethod as "CASH" | "CHEQUE",

    chequeNo: paymentMethod === "CHEQUE" ? text("chequeNo", true, 50) : "",

    amountPaisa,
    amountWords: amountInWords(amount),
    paidBy: text("paidBy", true),
    receivedBy: text("receivedBy", true),
  };
}

const duplicateKey = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

function editTarget(req: Request) {
  const id = String(req.params.id);

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid record ID.", 400);
  }

  const value = req.body?.updatedAt;

  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new AppError(
      "Reload this record before editing or deleting it.",
      400,
    );
  }

  return {
    _id: id,
    updatedAt: new Date(value),
  };
}

async function nextNumber(kind: VoucherKind) {
  const increment = () =>
    VoucherCounter.findOneAndUpdate(
      { _id: kind },
      { $inc: { value: 1 } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: false,
      },
    );

  try {
    return (await increment())!.value;
  } catch (error) {
    if (!duplicateKey(error)) throw error;

    return (await increment())!.value;
  }
}

export function voucherController(kind: VoucherKind) {
  const Model = kind === "rasid" ? Rasid : Bharpai;

  return {
    async update(req: Request, res: Response, next: NextFunction) {
      try {
        const target = editTarget(req);
        const data = readInput(req.body ?? {}, kind);

        // Always advance the timestamp, including fast edits.
        const updatedAt = new Date(
          Math.max(Date.now(), target.updatedAt.getTime() + 1),
        );

        // Only form fields are updated.
        // Number, creator, and creation date stay unchanged.
        const record = await Model.findOneAndUpdate(
          target,
          {
            $set: {
              ...data,
              updatedAt,
            },
          },
          {
            new: true,
            runValidators: true,
            timestamps: false,
          },
        )
          .select("-requestId")
          .lean();

        if (!record) {
          const exists = await Model.exists({
            _id: target._id,
          });

          if (!exists) {
            throw new AppError(
              "Record not found. It may have been deleted.",
              404,
            );
          }

          throw new AppError(
            "This record changed. Cancel, refresh the list, and open it again before saving.",
            409,
          );
        }

        sendResponse(res, {
          statusCode: 200,
          message: "Record updated",
          data: record,
        });
      } catch (error) {
        next(error);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction) {
      try {
        const target = editTarget(req);

        const result = await Model.deleteOne(target);

        if (
          !result.deletedCount &&
          (await Model.exists({
            _id: target._id,
          }))
        ) {
          throw new AppError(
            "This record changed. Close this dialog, refresh the list, and try again.",
            409,
          );
        }

        // Retrying a completed deletion succeeds.
        // Number counters are never decreased.
        sendResponse(res, {
          statusCode: 200,
          message: "Record deleted",
          data: null,
        });
      } catch (error) {
        next(error);
      }
    },

    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const page = Number(req.query.page ?? 1);

        if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
          throw new AppError("Invalid page number.", 400);
        }

        const q = String(req.query.q ?? "")
          .trim()
          .slice(0, 80);

        const filter = !q
          ? {}
          : /^\d+$/.test(englishDigits(q))
            ? {
                number: Number(englishDigits(q)),
              }
            : {
                personName: {
                  $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                  $options: "i",
                },
              };

        const rows = await Model.find(filter)
          .select("-requestId")
          .sort({ number: -1 })
          .skip((page - 1) * 20)
          .limit(21)
          .lean();

        sendResponse(res, {
          statusCode: 200,
          message: "Records loaded",
          data: {
            items: rows.slice(0, 20),
            hasMore: rows.length > 20,
          },
        });
      } catch (error) {
        next(error);
      }
    },

    async get(req: Request, res: Response, next: NextFunction) {
      try {
        const id = String(req.params.id);

        if (!isValidObjectId(id)) {
          throw new AppError("Invalid record ID.", 400);
        }

        const record = await Model.findById(id).select("-requestId").lean();

        if (!record) {
          throw new AppError("Record not found.", 404);
        }

        sendResponse(res, {
          statusCode: 200,
          message: "Record loaded",
          data: record,
        });
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction) {
      try {
        if (req.get("X-Voucher-Request") !== "1") {
          throw new AppError("Invalid save request.", 403);
        }

        const body = req.body ?? {};
        const requestId = body.requestId;

        if (
          typeof requestId !== "string" ||
          !/^[a-f0-9]{32}$/.test(requestId)
        ) {
          throw new AppError("Invalid request ID. Reload the form.", 400);
        }

        const data = readInput(body, kind);

        const payloadHash = createHash("sha256")
          .update(JSON.stringify(data))
          .digest("hex");

        const key = {
          createdBy: req.user._id,
          requestId,
        };

        await ensureVoucherIndexes(kind);

        let record = await Model.findOne(key).select("+payloadHash");

        if (!record) {
          const number = await nextNumber(kind);

          try {
            record = await Model.create({
              ...data,
              ...key,
              number,
              payloadHash,
            });
          } catch (error) {
            if (!duplicateKey(error)) {
              throw error;
            }

            record = await Model.findOne(key).select("+payloadHash");

            if (!record) {
              throw new AppError(
                "Number conflict. Contact your administrator.",
                409,
              );
            }
          }
        }

        if (record.payloadHash !== payloadHash) {
          throw new AppError(
            "This save request already exists with different details. Open the saved record first.",
            409,
          );
        }

        const saved = await Model.findById(record._id)
          .select("-requestId")
          .lean();

        sendResponse(res, {
          statusCode: 200,
          message: "Saved",
          data: saved,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
