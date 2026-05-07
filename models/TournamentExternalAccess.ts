import mongoose, { Document, Schema } from 'mongoose';

export type TournamentExternalAccessStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface ITournamentExternalAccess extends Document {
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  userId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  status: TournamentExternalAccessStatus;
  expiresAt: Date;
  createdAt: Date;
}

const TournamentExternalAccessSchema = new Schema<ITournamentExternalAccess>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TournamentExternalAccessSchema.index({ groupId: 1, tournamentId: 1, userId: 1 });
TournamentExternalAccessSchema.index({ userId: 1, status: 1 });
// TTL pour auto-expiration
TournamentExternalAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TournamentExternalAccess as mongoose.Model<ITournamentExternalAccess> ||
  mongoose.model<ITournamentExternalAccess>('TournamentExternalAccess', TournamentExternalAccessSchema);
