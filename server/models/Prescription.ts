
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPrescription extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema: Schema = new Schema<IPrescription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    notes: { type: String },
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

const PrescriptionModel =
  (mongoose.models.Prescription as Model<IPrescription>) ||
  mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

export default PrescriptionModel;
