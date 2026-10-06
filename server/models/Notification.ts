
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  type: 'appointment' | 'message' | 'reminder' | 'period' | 'pregnancy';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    type: {
      type: String,
      enum: ['appointment', 'message', 'reminder', 'period', 'pregnancy'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const NotificationModel =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
