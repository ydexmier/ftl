import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMagicLink extends Document {
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  createdBy: mongoose.Types.ObjectId;
  token: string;
  isActive: boolean;
  createdAt: Date;
}

const GroupMagicLinkSchema = new Schema<IGroupMagicLink>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

GroupMagicLinkSchema.index({ groupId: 1, tournamentId: 1 });

export default mongoose.models.GroupMagicLink as mongoose.Model<IGroupMagicLink> ||
  mongoose.model<IGroupMagicLink>('GroupMagicLink', GroupMagicLinkSchema);
