import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupTournament extends Document {
  groupId: mongoose.Types.ObjectId;
  tournamentId: number;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GroupTournamentSchema = new Schema<IGroupTournament>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    tournamentId: { type: Number, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

GroupTournamentSchema.index({ groupId: 1, tournamentId: 1 }, { unique: true });
GroupTournamentSchema.index({ tournamentId: 1 });

export default mongoose.models.GroupTournament as mongoose.Model<IGroupTournament> ||
  mongoose.model<IGroupTournament>('GroupTournament', GroupTournamentSchema);
