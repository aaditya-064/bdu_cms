import mongoose from "mongoose";
import Vault from "../models/vault.model";
import User from "../models/user.model";
import AppError from "../utils/appError.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";

function validId(value: unknown) {
  const id = String(value);

  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("Vault entry not found", 404);
  }

  return id;
}

function requireManager(allowed: unknown) {
  if (allowed !== true) {
    throw new AppError("Access denied", 403);
  }
}

export const create = catchAsync(async (req, res) => {
  requireManager(res.locals.manageVault);

  const { title, username, password, website_url, category, notes, status } =
    req.body;

  const entry = await Vault.create({
    title,
    username,
    password,
    website_url,
    category,
    notes,
    status,
    isLocked: true,
    sharedWith: [],
    updated_at: new Date(),
  });

  // Keep the response shape used by createVault() in the frontend.
  const saved = await Vault.findById(entry._id).select("-sharedWith");

  sendResponse(res, {
    statusCode: 201,
    message: "Vault entry created",
    data: { vault: saved },
  });
});

export const getAll = catchAsync(async (req, res) => {
  const filter: Record<string, unknown> = {};

  if (res.locals.manageVault !== true) {
    filter.isLocked = false;
    filter.sharedWith = req.user._id;
  }

  const { query, category, status, sortBy, order } = req.query;

  if (typeof query === "string" && query.trim()) {
    const search = query
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = ["title", "username", "website_url"].map((field) => ({
      [field]: { $regex: search, $options: "i" },
    }));
  }

  if (typeof category === "string" && category) {
    filter.category = category;
  }

  if (typeof status === "string" && status) {
    filter.status = status;
  }

  const sortField = sortBy === "name" ? "title" : "_id";
  const sortOrder = order === "asc" ? 1 : -1;

  const entries = await Vault.find(filter)
    .select("title username category status website_url isLocked")
    .sort({ [sortField]: sortOrder })
    .lean();

  sendResponse(res, {
    statusCode: 200,
    message: "Vault entries fetched",
    data: entries.map((entry) => ({
      ...entry,
      // Older records are locked until a manager explicitly unlocks them.
      isLocked: entry.isLocked !== false,
    })),
  });
});

export const getById = catchAsync(async (req, res) => {
  const id = validId(req.params.id);

  const filter =
    res.locals.manageVault === true
      ? { _id: id }
      : { _id: id, isLocked: false, sharedWith: req.user._id };

  const entry = await Vault.findOne(filter)
    .select("+password -sharedWith")
    .lean();

  if (!entry) {
    throw new AppError("Vault entry not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Vault entry fetched",
    data: {
      ...entry,
      isLocked: entry.isLocked !== false,
    },
  });
});

export const update = catchAsync(async (req, res) => {
  requireManager(res.locals.manageVault);

  const id = validId(req.params.id);

  // Lock state and sharing can only be changed through changeAccess.
  const { title, username, password, website_url, category, notes, status } =
    req.body;

  const entry = await Vault.findByIdAndUpdate(
    id,
    {
      $set: {
        title,
        username,
        password,
        website_url,
        category,
        notes,
        status,
        updated_at: new Date(),
      },
    },
    { new: true, runValidators: true },
  ).select("-sharedWith");

  if (!entry) {
    throw new AppError("Vault entry not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Vault entry updated",
    data: entry,
  });
});

export const changeAccess = catchAsync(async (req, res) => {
  requireManager(res.locals.manageVault);

  const id = validId(req.params.id);
  const { action, email } = req.body ?? {};

  if (action === "lock" || action === "unlock") {
    const isLocked = action === "lock";

    const entry = await Vault.findByIdAndUpdate(
      id,
      { $set: { isLocked, updated_at: new Date() } },
      { new: true },
    ).select("isLocked");

    if (!entry) {
      throw new AppError("Vault entry not found", 404);
    }

    sendResponse(res, {
      statusCode: 200,
      message: isLocked ? "Password locked" : "Password unlocked",
      data: { isLocked: entry.isLocked },
    });

    return;
  }

  if (action !== "share") {
    throw new AppError("Invalid vault action", 400);
  }

  if (typeof email !== "string" || !email.trim()) {
    throw new AppError("Enter an account email", 400);
  }

  const recipient = await User.findOne({
    email: email.trim(),
  }).select("_id");

  if (!recipient) {
    throw new AppError("No account found with that email", 404);
  }

  const entry = await Vault.findByIdAndUpdate(
    id,
    {
      $addToSet: { sharedWith: recipient._id },
      $set: { updated_at: new Date() },
    },
    { new: true },
  ).select("isLocked");

  if (!entry) {
    throw new AppError("Vault entry not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Recipient saved",
    data: { isLocked: entry.isLocked !== false },
  });
});

export const remove = catchAsync(async (req, res) => {
  requireManager(res.locals.manageVault);

  const entry = await Vault.findByIdAndDelete(validId(req.params.id));

  if (!entry) {
    throw new AppError("Vault entry not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Vault entry deleted",
    data: null,
  });
});
