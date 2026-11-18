// backend/src/middlewares/audit.middleware.ts

import type { RequestHandler, Response } from "express";
import AuditLog from "../models/audit-log.model";
import User from "../models/user.model";
import AppError from "../utils/appError.utils";

type DisplayValue = string | number | boolean | null;

type AuditDetails = {
  action: string;
  recordId?: string;
  recordName?: string;
  changes?: {
    field: string;
    before: DisplayValue;
    after: DisplayValue;
  }[];
};

// Call inside a controller before sendResponse() when you know the actual
// record name, ID or changed values. Only pass fields safe for admins to read.
// Never pass req.body, passwords, tokens, file contents or signed URLs.
export function describeAudit(res: Response, details: AuditDetails) {
  res.locals.auditDetails = details;
}

// Install after authentication and BEFORE the module's permission checks.
// Covers authenticated API requests. Background jobs and actions performed
// entirely in the browser need their own explicit audit integration.
export function auditModule(moduleName: string): RequestHandler {
  return async (req, res, next) => {
    if (req.method === "OPTIONS" || req.method === "HEAD") return next();

    try {
      const account = await User.findById(req.user._id)
        .select("username name email")
        .lean<{
          username?: string;
          name?: string;
          email?: string;
        }>();

      if (!account) return next(new AppError("Account unavailable", 401));

      // Store only the route path. Query strings can contain private values.
      const path = req.path;
      const ids = path.split("/").filter((part) => /^[a-f\d]{24}$/i.test(part));

      // Write before allowing the operation. If MongoDB is unavailable,
      // the operation cannot proceed without an audit entry.
      const log = await AuditLog.create({
        userId: req.user._id,
        username:
          account.username ||
          account.email ||
          account.name ||
          String(req.user._id),
        module: moduleName,
        method: req.method,
        action: `${req.method} ${path}`,
        recordId: ids[ids.length - 1],
      });

      let finalized = false;

      const finish = (interrupted: boolean) => {
        if (finalized) return;
        finalized = true;

        const details: AuditDetails | undefined = res.locals.auditDetails;
        const update = {
          finishedAt: new Date(),
          result: interrupted
            ? "INTERRUPTED"
            : res.statusCode >= 400
              ? "FAILED"
              : "SUCCESS",
          statusCode: interrupted ? undefined : res.statusCode,
          action: details?.action ?? log.action,
          recordId: details?.recordId ?? log.recordId,
          recordName: details?.recordName,
          changes: details?.changes?.map(({ field, before, after }) => ({
            field,
            before: before === null ? null : String(before),
            after: after === null ? null : String(after),
          })),
        };

        // A server crash or failed final write leaves PENDING for review.
        // SUCCESS describes the HTTP outcome. This is a request audit,
        // not a transactional history of every individual database write.
        void AuditLog.updateOne({ _id: log._id }, { $set: update })
          .exec()
          .catch((error) =>
            console.error("Audit finalization failed", log._id, error),
          );
      };

      res.once("finish", () => finish(false));
      res.once("close", () => finish(!res.writableFinished));
      next();
    } catch (error) {
      next(error);
    }
  };
}
