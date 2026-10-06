import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICycle extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD"
  isPeriod: boolean;
  flowIntensity: 'light' | 'medium' | 'heavy';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CycleSchema = new Schema<ICycle>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    isPeriod: { type: Boolean, default: true },
    flowIntensity: {
      type: String,
      enum: ['light', 'medium', 'heavy'],
      default: 'medium',
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

CycleSchema.index({ userId: 1, date: -1 });

const CycleModel =
  (mongoose.models.Cycle as Model<ICycle>) ||
  mongoose.model<ICycle>('Cycle', CycleSchema);

export default CycleModel;
