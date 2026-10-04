
import express from 'express';
import {
  createAppointment,
  getUserAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from '../controllers/appointmentController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// User routes
router.post('/', createAppointment);
router.get('/user', getUserAppointments);
router.put('/:appointmentId/cancel', cancelAppointment);

// Doctor routes
router.get('/doctor', getDoctorAppointments);
router.put('/:appointmentId/status', updateAppointmentStatus);

export default router;
