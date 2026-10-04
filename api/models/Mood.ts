import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMood extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD"
  mood: 'happy' | 'excited' | 'calm' | 'anxious' | 'stressed' | 'sad' | 'angry' | 'neutral';
  stressLevel: number; // 1 to 10
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoodSchema = new Schema<IMood>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    mood: {
      type: String,
      enum: ['happy', 'excited', 'calm', 'anxious', 'stressed', 'sad', 'angry', 'neutral'],
      required: true,
    },
    stressLevel: { type: Number, required: true, min: 1, max: 10 },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

MoodSchema.index({ userId: 1, date: -1 });

const MoodModel =
  (mongoose.models.Mood as Model<IMood>) ||
  mongoose.model<IMood>('Mood', MoodSchema);

export default MoodModel;
