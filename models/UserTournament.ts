import mongoose, { Document, Schema } from 'mongoose';

export type UserTournamentStatus = 'ACTIVE' | 'ARCHIVED';

export interface IUserTournament extends Document {
  userId: mongoose.Types.ObjectId;
  tournamentId: number;
  status: UserTournamentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserTournamentSchema = new Schema<IUserTournament>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tournamentId: { type: Number, required: true },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true },
);

UserTournamentSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });
UserTournamentSchema.index({ userId: 1, status: 1 });

export default mongoose.models.UserTournament as mongoose.Model<IUserTournament> ||
  mongoose.model<IUserTournament>('UserTournament', UserTournamentSchema);
