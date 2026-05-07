import mongoose, { Document, Schema } from 'mongoose';

export type GroupInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface IGroupInvitation extends Document {
  groupId: mongoose.Types.ObjectId;
  invitedUserId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  status: GroupInvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

const GroupInvitationSchema = new Schema<IGroupInvitation>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    invitedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Un seul invit PENDING à la fois par (groupe, utilisateur)
GroupInvitationSchema.index(
  { groupId: 1, invitedUserId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } },
);

export default mongoose.models.GroupInvitation as mongoose.Model<IGroupInvitation> ||
  mongoose.model<IGroupInvitation>('GroupInvitation', GroupInvitationSchema);
