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

  const envs = [
    { key: 'MONGO_URI', val: process.env.MONGO_URI || process.env.MONGODB_URI, required: true },
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
      const masked = key.includes('KEY') || key.includes('SECRET') || key.includes('URI')
        ? `${val.trim().substring(0, 6)}...`
        : val.trim();
      console.log(`  ✅ ${key.padEnd(24)} : Loaded (${masked})`);
    } else {
      if (required) {
        console.warn(`  ⚠️ ${key.padEnd(24)} : Missing (Will use default fallback)`);
      } else {
        console.log(`  ℹ️ ${key.padEnd(24)} : Optional (Not set)`);
      }
    }
  });

  console.log('======================================================\n');
};
