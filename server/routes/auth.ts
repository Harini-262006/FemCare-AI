/**
 * User, Doctor, and Admin authentication API route.
 * Handles registration, login, token management, and role verification.
 */
import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Admin from '../models/Admin';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

import { getJwtSecret } from '../utils/config';

// Generate JWT token with role
const generateToken = (id: string, role: 'patient' | 'doctor' | 'admin' = 'patient') => {
  return jwt.sign({ id, role }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

/**
 * Seed default Admin account if non-existent
 */
export const ensureDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      await Admin.create({
        name: 'FemCare Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ [Auth] Default Admin account created: admin@gmail.com / Admin@123');
    }
  } catch (err) {
    console.error('⚠️ [Auth] Failed to seed default admin:', err);
  }
};

/**
 * Seed default Doctor account if non-existent
 */
export const ensureDefaultDoctor = async () => {
  try {
    const doctorExists = await Doctor.findOne({ email: 'doctor@gmail.com' });
    if (!doctorExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Doctor@123', salt);
      await Doctor.create({
        name: 'Dr. Sarah Johnson',
        email: 'doctor@gmail.com',
        password: hashedPassword,
        specialty: 'Gynecologist',
        specialization: 'Gynecologist',
        qualification: 'MD, MBBS',
        experience: 10,
        hospital: "City Women's Hospital",
        fees: 1500,
        consultationFee: 1500,
        rating: 4.9,
        availableTime: ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
        online: true,
        active: true,
        role: 'doctor',
      });
      console.log('✅ [Auth] Default Doctor account created: doctor@gmail.com / Doctor@123');
    }
  } catch (err) {
    console.error('⚠️ [Auth] Failed to seed default doctor:', err);
  }
};

import mongoose from 'mongoose';

/**
 * User Registration (Patient)
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    console.log('📥 [Auth] Registration request received for:', email ? String(email).toLowerCase().trim() : 'unknown');

    // 1. Check required fields
    if (!name || !email || !password) {
      console.warn('⚠️ [Auth] Registration validation failed: Missing required fields');
      res.status(400).json({ message: 'Missing required fields. Name, email, and password are required.' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      console.warn('⚠️ [Auth] Registration validation failed: Invalid email format:', cleanEmail);
      res.status(400).json({ message: 'Invalid email address' });
      return;
    }

    // 3. Validate password length
    if (String(password).length < 6) {
      console.warn('⚠️ [Auth] Registration validation failed: Password too short');
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    // 4. Verify Database Connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [Auth] Database connection not ready (readyState:', mongoose.connection.readyState, ')');
      res.status(503).json({ message: 'Database error. Please try again later.' });
      return;
    }

    // 5. Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      console.warn('⚠️ [Auth] Registration failed: Email already registered:', cleanEmail);
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // 6. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Save User to MongoDB
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    if (user) {
      console.log('✅ [Auth] User registration successful! Created user ID:', user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'patient',
        token: generateToken(user._id.toString(), 'patient'),
      });
    } else {
      console.error('❌ [Auth] Failed to create user in database');
      res.status(400).json({ message: 'Failed to create user account' });
    }
  } catch (error: any) {
    console.error('❌ [Auth] User registration exception:', error?.message || error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * User / Unified Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide both email and password' });
      return;
    }

    const cleanInput = String(email || '').trim();
    const cleanEmail = cleanInput.toLowerCase();

    console.log('📥 [Auth] Unified login request received for:', cleanEmail);

    // 1. Check Admin
    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      console.log('✅ [Auth] Login success (Admin):', admin._id);
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        token: generateToken(admin._id.toString(), 'admin'),
      });
      return;
    }

    // 2. Check Doctor (by email OR name)
    const doctor = await Doctor.findOne({
      $or: [
        { email: cleanEmail },
        { name: { $regex: new RegExp(`^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    });
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      console.log('✅ [Auth] Login success (Doctor):', doctor._id);
      res.json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        role: 'doctor',
        token: generateToken(doctor._id.toString(), 'doctor'),
      });
      return;
    }

    // 3. Check User
    const user = await User.findOne({ email: cleanEmail });
    if (user && (await bcrypt.compare(password, user.password))) {
      console.log('✅ [Auth] Login success (Patient):', user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'patient',
        token: generateToken(user._id.toString(), 'patient'),
      });
      return;
    }

    console.warn('⚠️ [Auth] Login failed (invalid credentials) for:', cleanEmail);
    res.status(401).json({ message: 'Invalid credentials. Please check email/username and password.' });
  } catch (error: any) {
    console.error('❌ [Auth] User login error:', error?.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Admin Login
 * POST /api/auth/admin/login
 */
router.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').toLowerCase().trim();

    const admin = await Admin.findOne({ email: cleanEmail });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        token: generateToken(admin._id.toString(), 'admin'),
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Doctor Registration
 * POST /api/auth/doctor/register
 */
router.post('/doctor/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, specialty, experience, hospital, fees } = req.body;

    const cleanEmail = String(email || '').toLowerCase().trim();
    const doctorExists = await Doctor.findOne({ email: cleanEmail });
    if (doctorExists) {
      res.status(400).json({ message: 'Doctor already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const doctor = await Doctor.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      specialty: specialty || 'General Physician',
      specialization: specialty || 'General Physician',
      experience: experience || 0,
      hospital: hospital || 'FemCare Health Clinic',
      fees: fees || 0,
      consultationFee: fees || 0,
      role: 'doctor',
    });

    if (doctor) {
      res.status(201).json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        role: 'doctor',
        token: generateToken(doctor._id.toString(), 'doctor'),
      });
    } else {
      res.status(400).json({ message: 'Invalid doctor data' });
    }
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Doctor Login
 * POST /api/auth/doctor/login
 */
router.post('/doctor/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const cleanInput = String(email || '').trim();
    const cleanEmail = cleanInput.toLowerCase();

    // Find Doctor by email OR by name
    const doctor = await Doctor.findOne({
      $or: [
        { email: cleanEmail },
        { name: { $regex: new RegExp(`^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    });

    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      res.json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        experience: doctor.experience,
        hospital: doctor.hospital,
        fees: doctor.fees,
        rating: doctor.rating,
        role: 'doctor',
        token: generateToken(doctor._id.toString(), 'doctor'),
      });
    } else {
      res.status(401).json({ message: 'Invalid email/username or password' });
    }
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get Current User / Doctor / Admin Profile
 * GET /api/auth/me
 */
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.admin) {
      res.json({
        _id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: 'admin',
      });
      return;
    }
    if (req.user && req.role === 'patient') {
      const user = await User.findById(req.user._id);
      if (user) {
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          role: 'patient',
        });
        return;
      }
    } else if (req.doctor || req.role === 'doctor') {
      const doctorId = req.doctor?._id || req.user?._id;
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        res.json({
          _id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          specialty: doctor.specialty,
          experience: doctor.experience,
          hospital: doctor.hospital,
          fees: doctor.fees,
          rating: doctor.rating,
          role: 'doctor',
        });
        return;
      }
    }
    res.status(404).json({ message: 'Account not found' });
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
router.put('/profile', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user && req.role === 'patient') {
      const user = await User.findById(req.user._id);
      if (user) {
        user.profile = { ...user.profile, ...req.body };
        const updatedUser = await user.save();
        res.json(updatedUser);
        return;
      }
    }
    res.status(403).json({ message: 'Not authorized' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
