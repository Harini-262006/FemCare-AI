import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

/**
 * Get notifications for current user or doctor
 * GET /api/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: any = {};
    if (req.role === 'doctor' || req.doctor) {
      const doctorId = (req.doctor?._id || req.user?._id).toString();
      query = { doctorId };
    } else if (req.user) {
      query = { userId: req.user._id };
    } else {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const isUser = req.user && notification.userId?.toString() === req.user._id.toString();
    const isDoctor = req.doctor && notification.doctorId?.toString() === req.doctor._id.toString();

    if (!isUser && !isDoctor) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
export const markAllNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let query: any = {};
    if (req.role === 'doctor' || req.doctor) {
      const doctorId = (req.doctor?._id || req.user?._id).toString();
      query = { doctorId, read: false };
    } else if (req.user) {
      query = { userId: req.user._id, read: false };
    } else {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    await Notification.updateMany(query, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
