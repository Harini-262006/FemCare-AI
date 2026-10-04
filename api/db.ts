
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

const connectDB = async (retryCount = 0): Promise<boolean> => {
  let mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const localFallbackURI = 'mongodb://127.0.0.1:27017/femcare';

  // Check for placeholder tags in MONGO_URI
  if (!mongoURI || mongoURI.includes('<db_password>') || mongoURI.includes('<password>') || mongoURI === 'your_mongodb_connection_string') {
    console.warn('⚠️ [MongoDB Warning] MONGO_URI contains an unreplaced password placeholder or is invalid. Falling back to local MongoDB URI.');
    mongoURI = localFallbackURI;
  }

  const maskedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`🔗 Connecting to MongoDB (Attempt ${retryCount + 1}):`, maskedURI);

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    await seedDoctors();
    return true;
  } catch (error: any) {
    console.error(`❌ [MongoDB Error] Connection failed (Attempt ${retryCount + 1}):`, error?.message || error);

    // If initial remote URI failed, try local fallback on retry
    if (mongoURI !== localFallbackURI) {
      console.log('🔄 Attempting fallback to local MongoDB database...');
      try {
        await mongoose.connect(localFallbackURI, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log('✅ MongoDB connected successfully (Local Fallback)');
        await seedDoctors();
        return true;
      } catch (localErr: any) {
        console.error('❌ Local MongoDB fallback also unavailable:', localErr?.message || localErr);
      }
    }

    if (retryCount < 1) {
      console.log('🔄 Retrying MongoDB connection in 2 seconds...');
      await new Promise(res => setTimeout(res, 2000));
      return connectDB(retryCount + 1);
    }

    console.warn('⚠️ MongoDB connection could not be established. Server will remain running for health endpoints & local features.');
    return false;
  }
};

export default connectDB;
