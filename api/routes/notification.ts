import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;
