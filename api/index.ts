import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app';
import connectDB from './db';
import { ensureDefaultAdmin, ensureDefaultDoctor } from './routes/auth';

let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  try {
    const isConnected = await connectDB();
    if (isConnected) {
      dbInitialized = true;
      Promise.allSettled([ensureDefaultAdmin(), ensureDefaultDoctor()]).catch((err) => {
        console.error('Error seeding default accounts:', err);
      });
    }
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initDB();
  return new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    app(req, res);
  });
}