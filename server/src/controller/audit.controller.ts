// backend/src/controller/audit.controller.ts

import AuditLog from "../models/audit-log.model";
import User from "../models/user.model";
import AppError from "../utils/appError.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";

export const getAuditLogs = catchAsync(async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");

  const account = await User.findById(req.user._id).select("role").lean();

  if (account?.role !== "ADMIN") {
    throw new AppError("Only admins can view audit logs.", 403);
  }

  const page = Number(req.query.page ?? 1);
  const pageSize = 30;

  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
    throw new AppError("Invalid page number.", 400);
  }

  const filter: Record<string, unknown> = {};

  for (const field of ["username", "module", "action"] as const) {
    const value = req.query[field];
    if (value === undefined || value === "") continue;

    if (typeof value !== "string" || value.trim().length > 100) {
      throw new AppError(
        `Invalid ${field} filter. Use up to 100 characters.`,
        400,
      );
    }

    const search = value.trim();
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter[field] = { $regex: escaped, $options: "i" };
    }
  }

  const date = req.query.date;

  if (date !== undefined && date !== "") {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("Enter the date in YYYY-MM-DD format.", 400);
    }

    // Reject impossible dates such as 2026-02-31 before filtering.
    const calendarDate = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(calendarDate.getTime()) ||
      calendarDate.toISOString().slice(0, 10) !== date
    ) {
      throw new AppError("Enter a valid calendar date.", 400);
    }

    // The frontend date picker selects a day in Nepal time.
    const start = new Date(`${date}T00:00:00+05:45`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    filter.startedAt = { $gte: start, $lt: end };
  }

  const rows = await AuditLog.find(filter)
    .sort({ startedAt: -1, _id: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize + 1)
    .lean();

  sendResponse(res, {
    statusCode: 200,
    message: "Audit logs fetched.",
    data: {
      items: rows.slice(0, pageSize),
      hasMore: rows.length > pageSize,
    },
  });
});
