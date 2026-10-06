
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  title: string;
  pinned: boolean;
  isCustomTitle?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema<IConversation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'New Chat',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    isCustomTitle: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });
ConversationSchema.index({ userEmail: 1, updatedAt: -1 });

const ConversationModel =
  (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);

export default ConversationModel;
