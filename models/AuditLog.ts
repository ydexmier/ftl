import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'LOGIN_SUCCESS' | 'LOGIN_FAIL' | 'LOGOUT' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'PASSWORD_CHANGED' | 'ADMIN_ACTION';

export interface IAuditLog extends Document {
  action: AuditAction;
  userId?: mongoose.Types.ObjectId;
  username: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
});

AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 172800 }); // 48h TTL

export default mongoose.models.AuditLog as mongoose.Model<IAuditLog> || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
