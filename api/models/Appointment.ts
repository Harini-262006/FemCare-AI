
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  status: 'pending' | 'approved' | 'cancelled' | 'completed' | 'requested' | 'confirmed' | 'upcoming' | 'rejected' | 'Requested' | 'Confirmed' | 'Upcoming' | 'Completed' | 'Rejected' | 'Cancelled';
  notes?: string;
  type: 'in-person' | 'video';
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema<IAppointment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled', 'completed', 'requested', 'confirmed', 'upcoming', 'rejected', 'Requested', 'Confirmed', 'Upcoming', 'Completed', 'Rejected', 'Cancelled'],
      default: 'Requested',
    },
    notes: { type: String },
    type: {
      type: String,
      enum: ['in-person', 'video'],
      default: 'in-person',
    },
  },
  {
    timestamps: true,
  },
);

const AppointmentModel =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default AppointmentModel;
