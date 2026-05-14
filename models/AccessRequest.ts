import mongoose, { Document, Schema } from 'mongoose';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IAccessRequest extends Document {
  email: string;
  reason?: string;
  status: AccessRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

AccessRequestSchema.index({ email: 1, status: 1 });
AccessRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.AccessRequest as mongoose.Model<IAccessRequest> ||
  mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema);
