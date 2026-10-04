import express from 'express';
import {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../controllers/emergencyContactController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getEmergencyContacts);
router.post('/add', addEmergencyContact);
router.post('/', addEmergencyContact);
router.put('/:id', updateEmergencyContact);
router.delete('/:id', deleteEmergencyContact);

export default router;
