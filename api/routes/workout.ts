import express from 'express';
import {
  getWorkoutEntries,
  addWorkoutEntry,
  deleteWorkoutEntry,
} from '../controllers/workoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/history', getWorkoutEntries);
router.get('/', getWorkoutEntries);
router.post('/add', addWorkoutEntry);
router.post('/', addWorkoutEntry);
router.delete('/:id', deleteWorkoutEntry);

export default router;
