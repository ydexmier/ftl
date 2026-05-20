import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerComment extends Document {
  tournamentId: number;
  playerId: number;
  authorId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId | null;
  inks: string[];
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerCommentSchema = new Schema<IPlayerComment>(
  {
    tournamentId: { type: Number, required: true },
    playerId: { type: Number, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    inks: { type: [String], required: true },
    content: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

PlayerCommentSchema.index({ tournamentId: 1, playerId: 1, groupId: 1 });
PlayerCommentSchema.index({ authorId: 1 });

export default mongoose.models.PlayerComment as mongoose.Model<IPlayerComment> ||
  mongoose.model<IPlayerComment>('PlayerComment', PlayerCommentSchema);
