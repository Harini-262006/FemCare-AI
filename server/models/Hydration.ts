import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHydrationEntryItem {
  _id?: mongoose.Types.ObjectId | string;
  amountMl: number;
  timestamp: Date;
}

export interface IHydration extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD" local date string
  goalMl: number;
  consumedMl: number;
  entries: IHydrationEntryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const HydrationEntryItemSchema = new Schema<IHydrationEntryItem>({
  amountMl: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const HydrationSchema = new Schema<IHydration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    goalMl: { type: Number, default: 2500 },
    consumedMl: { type: Number, default: 0 },
    entries: [HydrationEntryItemSchema],
  },
  {
    timestamps: true,
  }
);

HydrationSchema.index({ userId: 1, date: 1 }, { unique: true });

const HydrationModel =
  (mongoose.models.Hydration as Model<IHydration>) ||
  mongoose.model<IHydration>('Hydration', HydrationSchema);

export default HydrationModel;
