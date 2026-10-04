import express from 'express';
import {
  getTodayHydration,
  addWater,
  setGoal,
  editEntry,
  deleteEntry,
  getHistory,
} from '../controllers/hydrationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/today', getTodayHydration);
router.post('/add', addWater);
router.put('/goal', setGoal);
router.put('/entry/:entryId', editEntry);
router.delete('/entry/:entryId', deleteEntry);
router.get('/history', getHistory);

export default router;
