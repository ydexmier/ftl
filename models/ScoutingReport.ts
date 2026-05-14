import mongoose, { Document, Schema } from 'mongoose';

export interface IScoutingReport extends Document {
  userId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId | null;
  tournamentId: number;
  playerId: number;
  createdAt: Date;
}

const ScoutingReportSchema = new Schema<IScoutingReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    tournamentId: { type: Number, required: true },
    playerId: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ScoutingReportSchema.index({ userId: 1, tournamentId: 1, groupId: 1 });
ScoutingReportSchema.index({ groupId: 1, tournamentId: 1 });

export default mongoose.models.ScoutingReport as mongoose.Model<IScoutingReport> ||
  mongoose.model<IScoutingReport>('ScoutingReport', ScoutingReportSchema);
