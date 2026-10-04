import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Sleep from '../models/Sleep.js';

export const getSleepEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const entries = await Sleep.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching sleep entries:', error);
    res.status(500).json({ message: 'Failed to fetch sleep entries', error: error?.message });
  }
};

export const addSleepEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { date, bedtime, wakeupTime, durationHours, quality, awakenings, notes } = req.body;

    if (!date || !bedtime || !wakeupTime || durationHours === undefined || !quality) {
      return res.status(400).json({ message: 'Missing required sleep entry fields.' });
    }

    const entry = new Sleep({
      userId,
      date,
      bedtime,
      wakeupTime,
      durationHours: Number(durationHours),
      quality,
      awakenings: Number(awakenings || 0),
      notes: notes || '',
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error saving sleep entry:', error);
    res.status(500).json({ message: 'Failed to save sleep entry', error: error?.message });
  }
};

export const deleteSleepEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Sleep.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Sleep entry not found or unauthorized.' });
    }

    res.json({ message: 'Sleep entry deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting sleep entry:', error);
    res.status(500).json({ message: 'Failed to delete sleep entry', error: error?.message });
  }
};
