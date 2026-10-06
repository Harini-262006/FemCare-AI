import express from 'express';
import {
  getAdminDoctors,
  addDoctorByAdmin,
  updateDoctorByAdmin,
  deleteDoctorByAdmin,
} from '../controllers/adminController';
import { protect, requireRole } from '../middleware/auth';

const router = express.Router();

// Admin routes require authentication and 'admin' role
router.use(protect);
router.use(requireRole('admin'));

router.get('/doctors', getAdminDoctors);
router.post('/doctors', addDoctorByAdmin);
router.put('/doctors/:id', updateDoctorByAdmin);
router.delete('/doctors/:id', deleteDoctorByAdmin);

export default router;
