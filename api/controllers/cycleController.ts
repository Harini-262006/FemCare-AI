import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Cycle from '../models/Cycle.js';

export const getCycleEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const entries = await Cycle.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching cycle entries:', error);
    res.status(500).json({ message: 'Failed to fetch cycle entries', error: error?.message });
  }
};

export const addCycleEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { date, isPeriod, flowIntensity, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Missing required cycle entry date.' });
    }

    const entry = new Cycle({
      userId,
      date,
      isPeriod: Boolean(isPeriod),
      flowIntensity: flowIntensity || 'medium',
      notes: notes || '',
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error saving cycle entry:', error);
    res.status(500).json({ message: 'Failed to save cycle entry', error: error?.message });
  }
};

export const deleteCycleEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Cycle.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Cycle entry not found or unauthorized.' });
    }

    res.json({ message: 'Cycle entry deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting cycle entry:', error);
    res.status(500).json({ message: 'Failed to delete cycle entry', error: error?.message });
  }
};
