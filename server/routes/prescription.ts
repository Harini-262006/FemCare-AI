import express from 'express';
import {
  getPrescriptions,
  createPrescription,
  deletePrescription,
} from '../controllers/prescriptionController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getPrescriptions);
router.post('/', createPrescription);
router.delete('/:id', deletePrescription);

export default router;
