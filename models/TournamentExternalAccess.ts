import mongoose, { Document, Schema } from 'mongoose';

export type TournamentExternalAccessStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface ITournamentExternalAccess extends Document {
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  invitedBy: mongoose.Types.ObjectId;
  email: string;
  displayName: string | null;
  userId: mongoose.Types.ObjectId | null;
  accessToken: string;
  status: TournamentExternalAccessStatus;
  expiresAt: Date;
  createdAt: Date;
}

const TournamentExternalAccessSchema = new Schema<ITournamentExternalAccess>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    displayName: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    accessToken: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'],
      default: 'PENDING',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TournamentExternalAccessSchema.index({ groupId: 1, tournamentId: 1 });
TournamentExternalAccessSchema.index({ accessToken: 1 }, { unique: true });
// TTL pour auto-expiration
TournamentExternalAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TournamentExternalAccess as mongoose.Model<ITournamentExternalAccess> ||
  mongoose.model<ITournamentExternalAccess>('TournamentExternalAccess', TournamentExternalAccessSchema);
