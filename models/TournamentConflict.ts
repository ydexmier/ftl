import mongoose, { Document, Schema } from 'mongoose';

export type ConflictStatus = 'PENDING' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED' | 'UNCERTAINTY';

export interface ITournamentConflict extends Document {
  status: ConflictStatus;
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  playerId: number;
  playerName: string;
  previousInks: string[][];
  proposedInks: string[][];
  resolvedInks?: string[][];
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentConflictSchema = new Schema<ITournamentConflict>(
  {
    status: {
      type: String,
      enum: ['PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'UNCERTAINTY'],
      default: 'PENDING',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    playerId: { type: Number, required: true },
    playerName: { type: String, required: true },
    previousInks: { type: [[String]], required: true },
    proposedInks: { type: [[String]], required: true },
    resolvedInks: { type: [[String]], default: undefined },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: undefined },
  },
  { timestamps: true },
);

TournamentConflictSchema.index({ groupId: 1, tournamentId: 1, status: 1 });
TournamentConflictSchema.index({ userId: 1, groupId: 1, tournamentId: 1 });

export default mongoose.models.TournamentConflict as mongoose.Model<ITournamentConflict> ||
  mongoose.model<ITournamentConflict>('TournamentConflict', TournamentConflictSchema);
