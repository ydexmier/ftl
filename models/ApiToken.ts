import mongoose, { Document, Schema } from 'mongoose';

export type ApiTokenScopeType = 'group' | 'user';
export type ApiTokenStatus = 'ACTIVE' | 'REVOKED';

export interface IApiToken extends Document {
  token: string;
  name: string;
  scopeType: ApiTokenScopeType;
  tournamentId: number;
  groupId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  status: ApiTokenStatus;
  expiresAt: Date;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ApiTokenSchema = new Schema<IApiToken>(
  {
    token: { type: String, required: true, unique: true },
    name: { type: String, required: true, maxlength: 100 },
    scopeType: { type: String, enum: ['group', 'user'], required: true },
    tournamentId: { type: Number, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ApiTokenSchema.index({ tournamentId: 1, groupId: 1 });
ApiTokenSchema.index({ tournamentId: 1, userId: 1 });
ApiTokenSchema.index({ createdBy: 1 });

export default mongoose.models.ApiToken as mongoose.Model<IApiToken> ||
  mongoose.model<IApiToken>('ApiToken', ApiTokenSchema);
