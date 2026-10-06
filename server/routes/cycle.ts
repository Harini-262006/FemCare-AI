import express from 'express';
import {
  getCycleEntries,
  addCycleEntry,
  deleteCycleEntry,
} from '../controllers/cycleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/history', getCycleEntries);
router.get('/', getCycleEntries);
router.post('/add', addCycleEntry);
router.post('/', addCycleEntry);
router.delete('/:id', deleteCycleEntry);

export default router;
