import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWorkout extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD"
  workoutType: 'stretching' | 'yoga' | 'cardio' | 'strength' | 'meditation' | 'relaxation';
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    workoutType: {
      type: String,
      enum: ['stretching', 'yoga', 'cardio', 'strength', 'meditation', 'relaxation'],
      required: true,
    },
    duration: { type: Number, required: true },
    intensity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

WorkoutSchema.index({ userId: 1, date: -1 });

const WorkoutModel =
  (mongoose.models.Workout as Model<IWorkout>) ||
  mongoose.model<IWorkout>('Workout', WorkoutSchema);

export default WorkoutModel;
