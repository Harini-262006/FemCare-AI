import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmergencyContact extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

EmergencyContactSchema.index({ userId: 1, createdAt: -1 });

const EmergencyContactModel =
  (mongoose.models.EmergencyContact as Model<IEmergencyContact>) ||
  mongoose.model<IEmergencyContact>('EmergencyContact', EmergencyContactSchema);

export default EmergencyContactModel;
