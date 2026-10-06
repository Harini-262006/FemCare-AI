/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import connectDB from './db'
import authRoutes, { ensureDefaultAdmin, ensureDefaultDoctor } from './routes/auth'
import adminRoutes from './routes/admin'
import chatRoutes from './routes/chat'
import aiChatRoutes from './routes/aiChat'
import doctorChatRoutes from './routes/doctorChat'
import appointmentRoutes from './routes/appointment'
import hydrationRoutes from './routes/hydration'
import sleepRoutes from './routes/sleep'
import moodRoutes from './routes/mood'
import workoutRoutes from './routes/workout'
import cycleRoutes from './routes/cycle'
import emergencyContactRoutes from './routes/emergencyContact'
import reminderRoutes from './routes/reminder'
import prescriptionRoutes from './routes/prescription'
import notificationRoutes from './routes/notification'
import medicalReportRoutes from './routes/medicalReport'

import { validateEnvironment } from './utils/config'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Load env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

// 2. Validate env
validateEnvironment()

const app: express.Application = express()

const isDev = process.env.NODE_ENV !== 'production'

// General API rate limiter (generous limit)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 2000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
})

// Dedicated authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 200 : 20, // 200 attempts in dev, 20 in prod
  skipSuccessfulRequests: true, // Successful logins don't block testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait a moment and try again.',
  },
})

const baseOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

const customOrigins: string[] = [];
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed) customOrigins.push(trimmed);
  });
}
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed) customOrigins.push(trimmed);
  });
}
if (process.env.VERCEL_URL) {
  const vercelOrigin = `https://${process.env.VERCEL_URL.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  customOrigins.push(vercelOrigin);
}

const allowedOrigins = [...baseOrigins, ...customOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, Postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === '*') return true;
        const normalizedAllowed = allowed.replace(/\/$/, '');
        return (
          normalizedOrigin === normalizedAllowed ||
          normalizedOrigin.endsWith('.vercel.app') ||
          normalizedOrigin.endsWith('.onrender.com')
        );
      });

      if (isAllowed || isDev) {
        callback(null, true);
      } else {
        // Fallback to allow for maximum compatibility with Vercel frontend deployments
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Apply rate limiters
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/admin/login', authLimiter)
app.use('/api/auth/doctor/login', authLimiter)
app.use('/api/auth/doctor/register', authLimiter)

// Serve uploaded static files
const uploadsPath = path.resolve(process.cwd(), 'public', 'uploads')
app.use('/uploads', express.static(uploadsPath))
app.use('/public/uploads', express.static(uploadsPath))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/conversations', chatRoutes)
app.use('/api/ai', aiChatRoutes)
app.use('/api/doctor-chat', doctorChatRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/hydration', hydrationRoutes)
app.use('/api/sleep', sleepRoutes)
app.use('/api/mood', moodRoutes)
app.use('/api/workout', workoutRoutes)
app.use('/api/cycle', cycleRoutes)
app.use('/api/emergency-contacts', emergencyContactRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', medicalReportRoutes)

/**
 * health
 */
app.get(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      success: true,
      message: 'FemCare AI backend is running',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Global Error Handler Caught Error:', error)
  res.status(500).json({
    success: false,
    message: error?.message || 'Server internal error',
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
