import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    action: { type: String, required: true },
    resourceType: { type: String },
    resourceId: { type: String },
    resourceLabel: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
