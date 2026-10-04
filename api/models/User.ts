import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  profile: {
    name?: string;
    age?: number;
    dateOfBirth?: string;
    mobile?: string;
    email?: string;
    address?: string;
    height?: number; // cm
    weight?: number; // kg
    bloodGroup?: string;
    maritalStatus?: string;
    lastPeriodDate?: Date | string;
    cycleLength?: number;
    cycleRegularity?: string;
    periodDuration?: string;
    menstrualHistory?: string;
    symptoms?: string[];
    pregnancyStatus?: string;
    trimester?: string | number;
    pregnancyHistory?: string;
    pcos?: string | boolean;
    thyroid?: string;
    fertilityPlanning?: string;
    fertilityInfo?: string;
    menopauseStatus?: string;
    anemiaHistory?: boolean | string;
    thyroidHistory?: string;
    diabetesHistory?: string;
    bpHistory?: string;
    medicalHistory?: string;
    chronicConditions?: string;
    chronicDiseases?: string;
    existingConditions?: string[];
    allergies?: string;
    allergyList?: string[];
    currentMedications?: string;
    currentMedicines?: string;
    medicationList?: string[];
    previousSurgeries?: string;
    surgeries?: string;
    familyMedicalHistory?: string;
    waterIntake?: number;
    sleepHours?: number;
    sleepQuality?: string;
    sleepSchedule?: string;
    exerciseRoutine?: string;
    activityLevel?: string;
    lifestyle?: string;
    stressLevel?: string;
    foodPreference?: string;
    dietPreference?: string;
    dietPreferences?: string;
    alcoholStatus?: string;
    caffeineStatus?: string;
    workoutHistory?: string;
    goals?: string;
    wellnessGoals?: string;
    emergencyContact?: string;
    doctorName?: string;
    hospital?: string;
    preferredHospital?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profile: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const UserModel =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default UserModel;
