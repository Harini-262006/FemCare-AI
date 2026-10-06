import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env before any configuration check
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

/**
 * Single source of truth for JWT Secret
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === 'your-secret-key') {
    console.warn('⚠️ [JWT Warning] No custom JWT_SECRET set in .env! Using secure fallback key.');
    return 'femcare_ai_secure_jwt_secret_2026_default';
  }
  return secret;
};

/**
 * Validate and log environment variables at server startup
 */
export const validateEnvironment = (): void => {
  console.log('\n======================================================');
  console.log('🔍 [FemCare AI Backend Environment Validation]');
  console.log('======================================================');

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RENDER_SERVICE_ID) ||
    Boolean(process.env.VERCEL);

  const mongoVal = isProduction ? process.env.MONGO_URI : (process.env.MONGO_URI || process.env.MONGODB_URI);

  const envs = [
    { key: 'MONGO_URI', val: mongoVal, required: true },
    { key: 'JWT_SECRET', val: process.env.JWT_SECRET, required: true },
    { key: 'GEMINI_API_KEY', val: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, required: false },
    { key: 'GROQ_API_KEY', val: process.env.GROQ_API_KEY, required: false },
    { key: 'CLOUDINARY_CLOUD_NAME', val: process.env.CLOUDINARY_CLOUD_NAME, required: false },
    { key: 'CLOUDINARY_API_KEY', val: process.env.CLOUDINARY_API_KEY, required: false },
    { key: 'CLOUDINARY_API_SECRET', val: process.env.CLOUDINARY_API_SECRET, required: false },
    { key: 'PORT', val: process.env.PORT || '5000', required: false },
  ];

  envs.forEach(({ key, val, required }) => {
    if (val && val.trim()) {
      let displayInfo = val.trim();
      if (key === 'MONGO_URI') {
        const isAtlas = displayInfo.startsWith('mongodb+srv://') || displayInfo.includes('.mongodb.net');
        displayInfo = isAtlas ? 'MongoDB Atlas (mongodb+srv://***)' : `${displayInfo.substring(0, 10)}...`;
      } else if (key.includes('KEY') || key.includes('SECRET')) {
        displayInfo = `${val.trim().substring(0, 6)}...`;
      }
      console.log(`  ✅ ${key.padEnd(24)} : Loaded (${displayInfo})`);
    } else {
      if (required) {
        console.warn(`  ⚠️ ${key.padEnd(24)} : Missing (Required in production)`);
      } else {
        console.log(`  ℹ️ ${key.padEnd(24)} : Optional (Not set)`);
      }
    }
  });

  console.log('======================================================\n');
};
