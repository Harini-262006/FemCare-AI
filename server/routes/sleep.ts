import express from 'express';
import {
  getSleepEntries,
  addSleepEntry,
  deleteSleepEntry,
} from '../controllers/sleepController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/history', getSleepEntries);
router.get('/', getSleepEntries);
router.post('/add', addSleepEntry);
router.post('/', addSleepEntry);
router.delete('/:id', deleteSleepEntry);

export default router;
