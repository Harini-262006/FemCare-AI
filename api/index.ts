import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app.js';
import connectDB from './db.js';
import { ensureDefaultAdmin, ensureDefaultDoctor } from './routes/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const isConnected = await connectDB();
    if (isConnected) {
      await Promise.allSettled([ensureDefaultAdmin(), ensureDefaultDoctor()]);
    }
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
  }
  return app(req, res);
}