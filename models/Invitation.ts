import mongoose, { Document, Schema } from 'mongoose';

export type InvitationStatus = 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface IInvitation extends Document {
  email: string;
  token: string;
  groupIds: mongoose.Types.ObjectId[];
  status: InvitationStatus;
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    groupIds: { type: [Schema.Types.ObjectId], ref: 'Group', default: [] },
    status: { type: String, enum: ['PENDING', 'USED', 'EXPIRED', 'CANCELLED'], default: 'PENDING' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Invitation as mongoose.Model<IInvitation> ||
  mongoose.model<IInvitation>('Invitation', InvitationSchema);
