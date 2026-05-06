import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  role: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
});

export default mongoose.models.Session as mongoose.Model<ISession> || mongoose.model<ISession>('Session', SessionSchema);
