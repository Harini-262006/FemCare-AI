
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachmentMetadata {
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  extractedText?: string;
  imageObservations?: string;
  audioTranscription?: string;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  files?: string[];
  attachmentsMetadata?: IAttachmentMetadata[];
  feedback?: 'like' | 'dislike';
  createdAt: Date;
}

const MessageSchema: Schema = new Schema<IMessage>(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
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
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    files: {
      type: [String],
      default: [],
    },
    attachmentsMetadata: {
      type: [{
        filename: String,
        mimeType: String,
        size: Number,
        url: String,
        extractedText: String,
        imageObservations: String,
        audioTranscription: String,
      }],
      default: [],
    },
    feedback: {
      type: String,
      enum: ['like', 'dislike'],
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ userId: 1, createdAt: 1 });
MessageSchema.index({ userEmail: 1, createdAt: 1 });

const MessageModel =
  (mongoose.models.Message as Model<IMessage>) ||
  mongoose.model<IMessage>('Message', MessageSchema);

export default MessageModel;
