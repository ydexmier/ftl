import mongoose, { Document, Schema } from 'mongoose';

export type GroupTournamentStatus = 'ACTIVE' | 'ARCHIVED';

export interface IGroupTournament extends Document {
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  addedBy: mongoose.Types.ObjectId;
  status: GroupTournamentStatus;
  createdAt: Date;
}

const GroupTournamentSchema = new Schema<IGroupTournament>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

GroupTournamentSchema.index({ groupId: 1, tournamentId: 1 }, { unique: true });
GroupTournamentSchema.index({ tournamentId: 1 });
GroupTournamentSchema.index({ groupId: 1, status: 1 });

export default mongoose.models.GroupTournament as mongoose.Model<IGroupTournament> ||
  mongoose.model<IGroupTournament>('GroupTournament', GroupTournamentSchema);
