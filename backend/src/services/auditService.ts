import { AuditLog } from '../models/AuditLog.js';

interface AuditLogInput {
  userId?: string;
  userName?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceLabel?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await AuditLog.create(input);
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
