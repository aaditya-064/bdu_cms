import { Schema, model } from "mongoose";

export type VoucherKind = "rasid" | "bharpai";

function voucherSchema() {
  return new Schema(
    {
      number: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
      },

      requestId: {
        type: String,
        required: true,
      },

      payloadHash: {
        type: String,
        required: true,
        select: false,
      },

      dateBs: {
        type: String,
        required: true,
      },

      personName: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        default: "",
      },

      receivedThrough: {
        type: String,
        default: "",
      },

      municipality: {
        type: String,
        default: "",
      },

      ward: {
        type: String,
        default: "",
      },

      tole: {
        type: String,
        default: "",
      },

      purpose: {
        type: String,
        default: "",
      },

      dayName: {
        type: String,
        default: "",
      },

      paymentMethod: {
        type: String,
        enum: ["CASH", "CHEQUE"],
        required: true,
      },

      chequeNo: {
        type: String,
        default: "",
      },

      amountPaisa: {
        type: Number,
        required: true,
        min: 1,
      },

      amountWords: {
        type: String,
        // required: true,
      },

      paidBy: {
        type: String,
        required: true,
      },

      receivedBy: {
        type: String,
        required: true,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  ).index({ createdBy: 1, requestId: 1 }, { unique: true });
}

// These are separate database collections.
export const Rasid = model("Rasid", voucherSchema(), "rasids");

export const Bharpai = model("Bharpai", voucherSchema(), "bharpais");

// Stores a separate number counter for each document type.
export const VoucherCounter = model(
  "VoucherCounter",
  new Schema({
    _id: String,
    value: {
      type: Number,
      required: true,
    },
  }),
  "voucher_counters",
);

// Ensure unique indexes exist even if autoIndex is disabled.
const indexJobs: Partial<Record<VoucherKind, Promise<unknown>>> = {};

export function ensureVoucherIndexes(kind: VoucherKind) {
  if (!indexJobs[kind]) {
    indexJobs[kind] = (kind === "rasid" ? Rasid : Bharpai)
      .createIndexes()
      .catch((error: unknown) => {
        delete indexJobs[kind];
        throw error;
      });
  }

  return indexJobs[kind]!;
}
