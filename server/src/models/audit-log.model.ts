// backend/src/models/audit-log.model.ts

import { Schema, model } from "mongoose";

const changeSchema = new Schema(
  {
    field: { type: String, required: true },
    before: { type: String, default: null },
    after: { type: String, default: null },
  },
  { _id: false },
);

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    module: { type: String, required: true },
    method: { type: String, required: true },
    action: { type: String, required: true },
    recordId: String,
    recordName: String,
    changes: { type: [changeSchema], default: [] },
    result: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "INTERRUPTED"],
      default: "PENDING",
    },
    statusCode: Number,
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: Date,
  },
  { collection: "audit_logs", versionKey: false },
);

auditLogSchema.index({ startedAt: -1, _id: -1 });
auditLogSchema.index({ module: 1, startedAt: -1 });

export default model("AuditLog", auditLogSchema);
