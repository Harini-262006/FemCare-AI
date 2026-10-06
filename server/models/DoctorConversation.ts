import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDoctorConversation extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  lastMessage?: string;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorConversationSchema = new Schema<IDoctorConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    lastMessage: { type: String, default: '' },
    unreadCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

DoctorConversationSchema.index({ userId: 1, doctorId: 1 }, { unique: true });

const DoctorConversationModel =
  (mongoose.models.DoctorConversation as Model<IDoctorConversation>) ||
  mongoose.model<IDoctorConversation>('DoctorConversation', DoctorConversationSchema);

export default DoctorConversationModel;
