
import mongoose from 'mongoose';
import Doctor from './models/Doctor';

const seedDoctors = async () => {
  try {
    const existingDoctors = await Doctor.countDocuments();
    if (existingDoctors === 0) {
      const initialDoctors = [
        {
          name: 'Dr. Sarah Johnson',
          specialty: 'Gynecologist',
          experience: 10,
          hospital: "City Women's Hospital",
          rating: 4.9,
          availableTime: ['09:00 AM', '10:00 AM', '02:00 PM', '04:30 PM'],
          fees: 1700,
          online: true,
          phone: '+91 98765 43210',
          videoLink: 'https://zoom.us/j/1234567890',
        },
        {
          name: 'Dr. Maria Garcia',
          specialty: 'Endocrinologist',
          experience: 8,
          hospital: 'Healthcare Plus',
          rating: 4.7,
          availableTime: ['11:00 AM', '03:00 PM', '04:00 PM'],
          fees: 2500,
          online: true,
          phone: '+91 98765 43211',
          videoLink: 'https://zoom.us/j/0987654321',
        },
        {
          name: 'Dr. Emily Chen',
          specialty: 'Nutritionist & Wellness Specialist',
          experience: 6,
          hospital: 'Wellness Center',
          rating: 4.8,
          availableTime: ['10:00 AM', '01:00 PM', '05:00 PM'],
          fees: 1500,
          online: false,
          phone: '+91 98765 43212',
          videoLink: 'https://zoom.us/j/1122334455',
        },
        {
          name: 'Dr. Rajesh Sharma',
          specialty: 'Obstetrician & Maternal Care',
          experience: 12,
          hospital: 'Apex Women Care Clinic',
          rating: 4.9,
          availableTime: ['09:30 AM', '11:30 AM', '03:30 PM'],
          fees: 2200,
          online: true,
          phone: '+91 98765 43213',
          videoLink: 'https://zoom.us/j/2233445566',
        },
        {
          name: 'Dr. Priya Patel',
          specialty: 'Reproductive Endocrinologist',
          experience: 11,
          hospital: 'Fertility & Care Institute',
          rating: 4.95,
          availableTime: ['10:30 AM', '02:30 PM', '06:00 PM'],
          fees: 3000,
          online: true,
          phone: '+91 98765 43214',
          videoLink: 'https://zoom.us/j/3344556677',
        },
      ];

      await Doctor.insertMany(initialDoctors);
      console.log('✅ Initial doctors seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
  }
};

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  if (cached.conn) {
    return true;
  }

  if (!cached.promise) {
    let mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    const isVercel = Boolean(process.env.VERCEL);
    const localFallbackURI = 'mongodb://127.0.0.1:27017/femcare';

    // Check for placeholder tags in MONGO_URI
    if (!mongoURI || mongoURI.includes('<db_password>') || mongoURI.includes('<password>') || mongoURI === 'your_mongodb_connection_string') {
      if (isVercel) {
        console.warn('⚠️ [MongoDB Warning] No valid MONGO_URI environment variable provided on Vercel.');
        return false;
      }
      console.warn('⚠️ [MongoDB Warning] MONGO_URI contains an unreplaced password placeholder or is invalid. Falling back to local MongoDB URI.');
      mongoURI = localFallbackURI;
    }

    const maskedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('🔗 Connecting to MongoDB:', maskedURI);

    const opts = {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongoURI, opts)
      .then(async (m) => {
        console.log('✅ MongoDB connected successfully');
        await seedDoctors();
        return m;
      })
      .catch(async (error) => {
        cached.promise = null;
        console.error('❌ [MongoDB Error] Connection failed:', error?.message || error);

        if (!isVercel && mongoURI !== localFallbackURI) {
          console.log('🔄 Attempting fallback to local MongoDB database...');
          try {
            const localM = await mongoose.connect(localFallbackURI, { serverSelectionTimeoutMS: 3000, bufferCommands: false });
            console.log('✅ MongoDB connected successfully (Local Fallback)');
            await seedDoctors();
            return localM;
          } catch (localErr: any) {
            console.error('❌ Local MongoDB fallback also unavailable:', localErr?.message || localErr);
            throw error;
          }
        }
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return true;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    return false;
  }
};

export default connectDB;
