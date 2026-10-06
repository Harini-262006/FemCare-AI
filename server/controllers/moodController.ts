import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Mood from '../models/Mood';

export const getMoodEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const entries = await Mood.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ message: 'Failed to fetch mood entries', error: error?.message });
  }
};

export const addMoodEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { date, mood, stressLevel, notes } = req.body;

    if (!date || !mood || stressLevel === undefined) {
      return res.status(400).json({ message: 'Missing required mood entry fields.' });
    }

    const entry = new Mood({
      userId,
      date,
      mood,
      stressLevel: Number(stressLevel),
      notes: notes || '',
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error saving mood entry:', error);
    res.status(500).json({ message: 'Failed to save mood entry', error: error?.message });
  }
};

export const deleteMoodEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Mood.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Mood entry not found or unauthorized.' });
    }

    res.json({ message: 'Mood entry deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ message: 'Failed to delete mood entry', error: error?.message });
  }
};
