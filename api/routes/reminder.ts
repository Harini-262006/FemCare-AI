import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth.js';
import Reminder from '../models/Reminder.js';

const router = express.Router();

router.use(protect);

// Get all reminders for authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (req.role === 'doctor' || req.role === 'admin') {
      return res.json([]);
    }
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const reminders = await Reminder.find({ userId }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new reminder
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { title, type, time, date, notes, recurrence, enabled } = req.body;

    if (!title || !time) {
      return res.status(400).json({ message: 'Title and time are required' });
    }

    const reminder = new Reminder({
      userId,
      title,
      type: type || 'medicine',
      time,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      recurrence: recurrence || 'daily',
      enabled: enabled !== undefined ? enabled : true,
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a reminder
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found or unauthorized' });
    }

    const fields = ['title', 'type', 'time', 'date', 'notes', 'recurrence', 'enabled', 'completedDates'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (reminder as any)[field] = req.body[field];
      }
    });

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a reminder
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found or unauthorized' });
    }

    res.json({ message: 'Reminder deleted successfully', id });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle enabled status
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found or unauthorized' });
    }

    reminder.enabled = !reminder.enabled;
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    console.error('Toggle reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
