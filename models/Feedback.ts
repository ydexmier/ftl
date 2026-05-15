import mongoose, { Document, Schema } from 'mongoose';

export type FeedbackType = 'bug' | 'improvement';
export type FeedbackStatus = 'open' | 'in-progress' | 'done' | 'closed';

export interface IFeedback extends Document {
  type: FeedbackType;
  title: string;
  description: string;
  page: string;
  userId?: mongoose.Types.ObjectId;
  username?: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    type: { type: String, enum: ['bug', 'improvement'], required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    page: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    status: { type: String, enum: ['open', 'in-progress', 'done', 'closed'], default: 'open' },
  },
  { timestamps: true },
);

export default mongoose.models.Feedback as mongoose.Model<IFeedback> ||
  mongoose.model<IFeedback>('Feedback', FeedbackSchema);
