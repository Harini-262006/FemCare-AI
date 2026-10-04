import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Doctor from '../models/Doctor';
import Admin from '../models/Admin';

import { getJwtSecret } from '../utils/config';

export interface AuthRequest extends Request {
  user?: any;
  doctor?: any;
  admin?: any;
  role?: 'patient' | 'doctor' | 'admin';
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role?: string };

      // Check according to role in JWT payload first if present
      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.id).select('-password');
        if (admin) {
          req.admin = { _id: admin._id, id: admin._id, email: admin.email, name: admin.name, role: 'admin' };
          req.user = req.admin;
          req.role = 'admin';
          next();
          return;
        }
      } else if (decoded.role === 'doctor') {
        const doctor = await Doctor.findById(decoded.id).select('-password');
        if (doctor) {
          req.doctor = {
            _id: doctor._id,
            id: doctor._id,
            email: doctor.email,
            name: doctor.name,
            specialty: doctor.specialty,
            specialization: doctor.specialization || doctor.specialty,
            qualification: doctor.qualification,
            experience: doctor.experience,
            hospital: doctor.hospital,
            location: doctor.location,
            fees: doctor.fees,
            consultationFee: doctor.consultationFee || doctor.fees,
            rating: doctor.rating,
            role: 'doctor',
          };
          req.user = req.doctor;
          req.role = 'doctor';
          next();
          return;
        }
      } else if (decoded.role === 'patient') {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = { _id: user._id, id: user._id, email: user.email, name: user.name, profile: user.profile, role: 'patient' };
          req.role = 'patient';
          next();
          return;
        }
      }

      // Fallback lookup if token role wasn't set or didn't match
      const doctor = await Doctor.findById(decoded.id).select('-password');
      if (doctor) {
        req.doctor = {
          _id: doctor._id,
          id: doctor._id,
          email: doctor.email,
          name: doctor.name,
          specialty: doctor.specialty,
          specialization: doctor.specialization || doctor.specialty,
          qualification: doctor.qualification,
          experience: doctor.experience,
          hospital: doctor.hospital,
          location: doctor.location,
          fees: doctor.fees,
          consultationFee: doctor.consultationFee || doctor.fees,
          rating: doctor.rating,
          role: 'doctor',
        };
        req.user = req.doctor;
        req.role = 'doctor';
        next();
        return;
      }

      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = { _id: user._id, id: user._id, email: user.email, name: user.name, profile: user.profile, role: 'patient' };
        req.role = 'patient';
        next();
        return;
      }

      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.admin = { _id: admin._id, id: admin._id, email: admin.email, name: admin.name, role: 'admin' };
        req.user = req.admin;
        req.role = 'admin';
        next();
        return;
      }

      res.status(401).json({ message: 'Not authorized, account not found.' });
      return;
    } catch (error: any) {
      if (error?.name === 'JsonWebTokenError') {
        console.warn('⚠️ [Auth Middleware] Invalid JWT token signature detected:', error?.message);
        res.status(401).json({ message: 'Invalid or expired token signature. Please log in again.' });
        return;
      }
      if (error?.name === 'TokenExpiredError') {
        console.warn('⚠️ [Auth Middleware] Expired JWT token presented:', error?.message);
        res.status(401).json({ message: 'Session expired. Please log in again.' });
        return;
      }
      console.error('❌ [Auth Middleware Error]:', error?.message || error);
      res.status(401).json({ message: 'Not authorized, token verification failed.' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};

export const requireRole = (role: 'patient' | 'doctor' | 'admin') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.role !== role) {
      return res.status(403).json({ message: `Access denied. Requires ${role} role.` });
    }
    next();
  };
};

export const requireRoles = (roles: Array<'patient' | 'doctor' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of these roles: ${roles.join(', ')}.` });
    }
    next();
  };
};
