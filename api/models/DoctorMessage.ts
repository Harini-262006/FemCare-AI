import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDoctorMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'patient' | 'doctor';
  content: string;
  attachments?: any[];
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorMessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'DoctorConversation', required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ['patient', 'doctor'], required: true },
    content: { type: String, default: '' },
    attachments: { type: Array, default: [] },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const DoctorMessageModel =
  (mongoose.models.DoctorMessage as Model<IDoctorMessage>) ||
  mongoose.model<IDoctorMessage>('DoctorMessage', DoctorMessageSchema);

export default DoctorMessageModel;
