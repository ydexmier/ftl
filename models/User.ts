import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN' | 'SUPERUSER';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPERUSER'], default: 'USER' },
}, { timestamps: true });

export default mongoose.models.User as mongoose.Model<IUser> || mongoose.model<IUser>('User', UserSchema);
