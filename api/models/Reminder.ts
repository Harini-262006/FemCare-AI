import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: string;
  time: string;
  date?: string;
  notes?: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  enabled: boolean;
  completedDates?: string[];
  lastTriggered?: string;
  isSmart?: boolean;
  smartKey?: string;
  smartPurpose?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, default: 'medicine' },
    time: { type: String, required: true },
    date: { type: String },
    notes: { type: String, default: '' },
    recurrence: { type: String, enum: ['once', 'daily', 'weekly', 'monthly', 'custom'], default: 'daily' },
    enabled: { type: Boolean, default: true },
    completedDates: { type: [String], default: [] },
    lastTriggered: { type: String },
    isSmart: { type: Boolean, default: false },
    smartKey: { type: String },
    smartPurpose: { type: String, default: '' },
    category: { type: String, default: 'manual' },
  },
  {
    timestamps: true,
  }
);

ReminderSchema.index({ userId: 1 });

const ReminderModel =
  (mongoose.models.Reminder as Model<IReminder>) ||
  mongoose.model<IReminder>('Reminder', ReminderSchema);

export default ReminderModel;
