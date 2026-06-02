import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminMemo extends Document {
  adminId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminMemoSchema = new Schema<IAdminMemo>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

AdminMemoSchema.index({ adminId: 1, targetUserId: 1 }, { unique: true });

export default mongoose.models.AdminMemo as mongoose.Model<IAdminMemo> ||
  mongoose.model<IAdminMemo>('AdminMemo', AdminMemoSchema);
