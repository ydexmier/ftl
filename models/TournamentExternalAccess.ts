import mongoose, { Document, Schema } from 'mongoose';

export type TournamentExternalAccessStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' | 'REJECTED';

export interface ITournamentExternalAccess extends Document {
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  invitedBy: mongoose.Types.ObjectId;
  email: string | null;
  displayName: string | null;
  userId: mongoose.Types.ObjectId | null;
  accessToken?: string;
  magicLinkToken?: string;
  status: TournamentExternalAccessStatus;
  expiresAt: Date;
  createdAt: Date;
}

const TournamentExternalAccessSchema = new Schema<ITournamentExternalAccess>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    displayName: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    accessToken: { type: String },
    magicLinkToken: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED', 'REJECTED'],
      default: 'PENDING',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TournamentExternalAccessSchema.index({ groupId: 1, tournamentId: 1 });
// Index sparse : documents sans accessToken (flow magic link) sont ignorés
TournamentExternalAccessSchema.index({ accessToken: 1 }, { unique: true, sparse: true });
// TTL pour auto-expiration
TournamentExternalAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TournamentExternalAccess as mongoose.Model<ITournamentExternalAccess> ||
  mongoose.model<ITournamentExternalAccess>('TournamentExternalAccess', TournamentExternalAccessSchema);
