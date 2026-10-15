import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import Vault from "../models/vault.model";

// title: String;
// username: String;
// password: String;
// website_url: String;
// category: String;
// notes: String;
// status: String;
// updated_at: Date;

export const create = catchAsync(async (req, res) => {
  const { title, username, password, website_url, category, notes, status } =
    req.body;

  if (!username && !password && !!title) {
    throw new AppError("Every field is required", 400);
  }

  const vault = await Vault.create({
    title,
    username,
    password,
    website_url,
    category,
    notes,
    status,
  });

  sendResponse(res, {
    message: "Vault added successfully",
    statusCode: 201,
    data: {
      vault,
    },
  });
});

export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, username, password, website_url, category, notes, status } =
    req.body;

  const existingVault = await Vault.findById(id);
  if (!existingVault) {
    throw new AppError("Vault not found", 404);
  }

  const newVault = await Vault.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        title: title,
        username: username,
        password: password,
        website_url: website_url,
        category: category,
        notes: notes,
        status: status,
      },
    },
    { new: true, runValidators: true },
  );

  sendResponse(res, {
    message: `${id} has been updated successfully`,
    statusCode: 201,
    data: newVault,
  });
});

// GET /vault?sortBy=date&order=desc — Newest first
// GET /vault?sortBy=date&order=asc — Oldest first
// GET /vault?sortBy=name&order=asc — A to Z
// GET /vault?sortBy=name&order=desc — Z to A
// GET /vault?query=google — Search vaults

export const getAll = catchAsync(async (req, res) => {
  const {
    query,
    category,
    status,
    sortBy = "date",
    order = "desc",
  } = req.query;

  const filter: any = {};

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
      { website_url: { $regex: query, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (status) {
    filter.status = status;
  }

  const sortField = sortBy === "name" ? "title" : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const vaults = await Vault.find(filter).sort({
    [sortField]: sortOrder,
  } as any);

  sendResponse(res, {
    data: vaults,
    message: "Vaults fetched successfully",
    statusCode: 200,
  });
});

export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const vault = await Vault.findById(id);

  if (!vault) {
    throw new AppError("Vault not found", 404);
  }

  sendResponse(res, {
    data: vault,
    message: `Vault:${id} fetched successfully`,
    statusCode: 200,
  });
});

export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const vault = await Vault.findByIdAndDelete(id);

  if (!vault) {
    throw new AppError("Vault not found", 404);
  }

  sendResponse(res, {
    message: `Vault:${id} deleted successfully`,
    statusCode: 200,
    data: null,
  });
});
