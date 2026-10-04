import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISleep extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD"
  bedtime: string; // Format: "HH:mm" (e.g. "22:30")
  wakeupTime: string; // Format: "HH:mm" (e.g. "06:30")
  durationHours: number; // Calculated duration in hours (e.g. 8.0)
  quality: 'excellent' | 'good' | 'average' | 'poor';
  awakenings: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SleepSchema = new Schema<ISleep>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    bedtime: { type: String, required: true },
    wakeupTime: { type: String, required: true },
    durationHours: { type: Number, required: true },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor'],
      required: true,
    },
    awakenings: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

SleepSchema.index({ userId: 1, date: -1 });

const SleepModel =
  (mongoose.models.Sleep as Model<ISleep>) ||
  mongoose.model<ISleep>('Sleep', SleepSchema);

export default SleepModel;
