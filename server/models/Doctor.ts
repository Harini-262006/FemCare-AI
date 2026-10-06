import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  password: string;
  specialty: string;
  specialization?: string;
  qualification?: string;
  experience: number;
  hospital: string;
  location?: string;
  rating: number;
  availableTime: string[];
  fees: number;
  consultationFee?: number;
  online: boolean;
  phone: string;
  videoLink: string;
  profileImage?: string;
  active: boolean;
  role: 'doctor';
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    specialty: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    qualification: { type: String, default: 'MD, MBBS' },
    experience: { type: Number, default: 0 },
    hospital: { type: String, required: true, trim: true },
    location: { type: String, default: 'City Hospital' },
    rating: { type: Number, default: 5 },
    availableTime: { type: [String], default: [] },
    fees: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    online: { type: Boolean, default: true },
    phone: { type: String, default: '' },
    videoLink: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    active: { type: Boolean, default: true },
    role: { type: String, default: 'doctor' },
  },
  {
    timestamps: true,
  }
);

DoctorSchema.pre('save', function () {
  if (this.specialty && !this.specialization) {
    this.specialization = this.specialty;
  } else if (this.specialization && !this.specialty) {
    this.specialty = this.specialization;
  }
  if (this.fees && !this.consultationFee) {
    this.consultationFee = this.fees;
  } else if (this.consultationFee && !this.fees) {
    this.fees = this.consultationFee;
  }
});

const DoctorModel =
  (mongoose.models.Doctor as Model<IDoctor>) ||
  mongoose.model<IDoctor>('Doctor', DoctorSchema);

export default DoctorModel;
