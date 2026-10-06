import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMedicalReport extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  title: string;
  type: string;
  category?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  notes?: string;
  extractedText?: string;
  analysis?: any;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalReportSchema: Schema = new Schema<IMedicalReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    title: { type: String, required: true },
    type: { type: String, required: true, default: 'Medical Report' },
    category: { type: String, default: 'Blood Test' },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    notes: { type: String },
    extractedText: { type: String },
    analysis: { type: Schema.Types.Mixed },
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

const MedicalReportModel =
  (mongoose.models.MedicalReport as Model<IMedicalReport>) ||
  mongoose.model<IMedicalReport>('MedicalReport', MedicalReportSchema);

export default MedicalReportModel;
