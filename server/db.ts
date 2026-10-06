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

/**
 * Helper to safely mask credentials in MongoDB URIs for startup logging.
 */
export const maskMongoURI = (uri: string | undefined): string => {
  if (!uri) return '(not set)';
  try {
    if (uri.includes('@')) {
      return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    }
    return uri;
  } catch {
    return '***';
  }
};

const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  if (cached.conn) {
    return true;
  }

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RENDER_SERVICE_ID) ||
    Boolean(process.env.VERCEL);

  const localFallbackURI = 'mongodb://127.0.0.1:27017/femcare';

  if (!cached.promise) {
    let targetURI: string;

    if (isProduction) {
      // 1. PRODUCTION / RENDER ENVIRONMENT: MUST ALWAYS USE ONLY process.env.MONGO_URI
      targetURI = (process.env.MONGO_URI || '').trim();

      if (!targetURI) {
        console.error('❌ [MongoDB Production Error] MONGO_URI is missing in Render environment variables!');
        console.error('💡 Add MONGO_URI in Render Dashboard -> Environment -> Environment Variables');
        return false;
      }

      if (
        targetURI.includes('<password>') ||
        targetURI.includes('<db_password>') ||
        targetURI.includes('<username>') ||
        targetURI === 'your_mongodb_connection_string'
      ) {
        console.error('❌ [MongoDB Production Error] MONGO_URI contains an unreplaced placeholder (<password> or <username>).');
        console.error('💡 Update MONGO_URI in your Render Dashboard with your actual MongoDB Atlas database user password.');
        return false;
      }

      const isAtlas = targetURI.startsWith('mongodb+srv://') || targetURI.includes('.mongodb.net');
      console.log(`📡 MongoDB Target: ${isAtlas ? 'MongoDB Atlas (Cloud Cluster)' : 'Custom Production MongoDB'}`);
      console.log(`🔗 Connecting to MongoDB: ${maskMongoURI(targetURI)}`);
    } else {
      // 2. LOCAL DEVELOPMENT ENVIRONMENT ONLY
      targetURI = (process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();

      if (
        !targetURI ||
        targetURI.includes('<password>') ||
        targetURI.includes('<db_password>') ||
        targetURI === 'your_mongodb_connection_string'
      ) {
        console.warn('⚠️ [MongoDB Local Dev] No valid remote MONGO_URI found in local .env. Using local fallback.');
        targetURI = localFallbackURI;
      }

      const isAtlas = targetURI.startsWith('mongodb+srv://') || targetURI.includes('.mongodb.net');
      console.log(`📡 MongoDB Target: ${targetURI === localFallbackURI ? 'Local MongoDB' : isAtlas ? 'MongoDB Atlas (Cloud)' : 'Custom MongoDB'}`);
      console.log(`🔗 Connecting to MongoDB: ${maskMongoURI(targetURI)}`);
    }

    const opts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: isProduction ? 15000 : 5000,
      bufferCommands: false,
    };

    const isAtlas = targetURI.startsWith('mongodb+srv://') || targetURI.includes('.mongodb.net');

    cached.promise = mongoose
      .connect(targetURI, opts)
      .then(async (m) => {
        console.log(`✅ MongoDB connected successfully (${isAtlas ? 'MongoDB Atlas' : 'Database Ready'})`);
        await seedDoctors();
        return m;
      })
      .catch(async (error) => {
        cached.promise = null;
        console.error('❌ [MongoDB Connection Error]:', error?.message || error);

        if (isProduction) {
          console.error('💡 [Render MongoDB Troubleshooting]:');
          console.error('   1. Verify your MongoDB Atlas Network Access has 0.0.0.0/0 (Allow access from anywhere).');
          console.error('   2. Verify Database User credentials (username & password) in Render MONGO_URI.');
          console.error('   3. Ensure your Atlas cluster is active and not paused.');
          // NEVER fallback to localhost on Render in production!
          throw error;
        }

        // Local development fallback attempt
        if (targetURI !== localFallbackURI) {
          console.log('🔄 [Local Dev] Attempting fallback to local MongoDB instance...');
          try {
            const localM = await mongoose.connect(localFallbackURI, {
              serverSelectionTimeoutMS: 3000,
              bufferCommands: false,
            });
            console.log('✅ MongoDB connected successfully (Local Fallback)');
            await seedDoctors();
            return localM;
          } catch (localErr: any) {
            console.error('❌ Local MongoDB fallback also failed:', localErr?.message || localErr);
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
