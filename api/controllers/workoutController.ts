import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import Workout from '../models/Workout.js';

export const getWorkoutEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const entries = await Workout.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error: any) {
    console.error('Error fetching workout entries:', error);
    res.status(500).json({ message: 'Failed to fetch workout entries', error: error?.message });
  }
};

export const addWorkoutEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { date, workoutType, duration, intensity, notes } = req.body;

    if (!date || !workoutType || duration === undefined || !intensity) {
      return res.status(400).json({ message: 'Missing required workout entry fields.' });
    }

    const entry = new Workout({
      userId,
      date,
      workoutType,
      duration: Number(duration),
      intensity,
      notes: notes || '',
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error saving workout entry:', error);
    res.status(500).json({ message: 'Failed to save workout entry', error: error?.message });
  }
};

export const deleteWorkoutEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Workout.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Workout entry not found or unauthorized.' });
    }

    res.json({ message: 'Workout entry deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting workout entry:', error);
    res.status(500).json({ message: 'Failed to delete workout entry', error: error?.message });
  }
};
