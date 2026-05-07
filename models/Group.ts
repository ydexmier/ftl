import mongoose, { Document, Schema } from 'mongoose';

export type GroupMemberRole = 'MEMBER' | 'ADMIN';

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
  invitedBy: mongoose.Types.ObjectId;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  members: IGroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberSchema = new Schema<IGroupMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['MEMBER', 'ADMIN'], default: 'MEMBER' },
    joinedAt: { type: Date, default: () => new Date() },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false },
);

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [GroupMemberSchema], default: [] },
  },
  { timestamps: true },
);

GroupSchema.index({ 'members.userId': 1 });

export default mongoose.models.Group as mongoose.Model<IGroup> ||
  mongoose.model<IGroup>('Group', GroupSchema);
