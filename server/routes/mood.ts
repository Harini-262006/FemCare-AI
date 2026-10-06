import express from 'express';
import {
  getMoodEntries,
  addMoodEntry,
  deleteMoodEntry,
} from '../controllers/moodController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/history', getMoodEntries);
router.get('/', getMoodEntries);
router.post('/add', addMoodEntry);
router.post('/', addMoodEntry);
router.delete('/:id', deleteMoodEntry);

export default router;
