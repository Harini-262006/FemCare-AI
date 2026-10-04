import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Hydration from '../models/Hydration';
import User from '../models/User';

const getLocalDateString = (customDate?: string): string => {
  if (customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
    return customDate;
  }
  // Default to Asia/Kolkata / user local date
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

const formatHydrationResponse = (doc: any) => {
  const goalMl = Number(doc.goalMl) || 2500;
  const consumedMl = Number(doc.consumedMl) || 0;
  const rawPercentage = (consumedMl / goalMl) * 100;
  const percentage = Math.min(Math.round(rawPercentage), 100);

  return {
    _id: doc._id,
    userId: doc.userId,
    date: doc.date,
    goalMl,
    consumedMl,
    remainingMl: Math.max(goalMl - consumedMl, 0),
    percentage,
    rawPercentage: Math.round(rawPercentage * 10) / 10,
    entries: doc.entries.map((entry: any) => ({
      _id: entry._id,
      amountMl: entry.amountMl,
      timestamp: entry.timestamp,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const logDebugInfo = (tag: string, userId: string, date: string, goalMl: number, consumedMl: number) => {
  const percentage = Math.min(Math.round((consumedMl / (goalMl || 2500)) * 100), 100);
  console.log(`[HYDRATION DEBUG] [${tag}]`, {
    userId,
    date,
    goalMl,
    consumedMl,
    percentage: `${percentage}%`,
  });
};

// GET /api/hydration/today
export const getTodayHydration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const date = getLocalDateString(req.query.date as string | undefined);

    let doc = await Hydration.findOne({ userId, date });

    if (!doc) {
      // Find user's last configured goal or calculate default
      let defaultGoal = 2500;
      const lastHydration = await Hydration.findOne({ userId }).sort({ createdAt: -1 });
      if (lastHydration && lastHydration.goalMl > 0) {
        defaultGoal = lastHydration.goalMl;
      } else {
        const user = await User.findById(userId);
        if (user?.profile?.weight && user.profile.weight > 0) {
          defaultGoal = Math.round(user.profile.weight * 35);
        } else if (user?.profile?.waterIntake && user.profile.waterIntake > 0) {
          defaultGoal = user.profile.waterIntake > 50 ? user.profile.waterIntake : user.profile.waterIntake * 250;
        }
      }

      doc = new Hydration({
        userId,
        date,
        goalMl: defaultGoal,
        consumedMl: 0,
        entries: [],
      });
      await doc.save();
    }

    logDebugInfo('GET_TODAY', userId.toString(), date, doc.goalMl, doc.consumedMl);
    res.json(formatHydrationResponse(doc));
  } catch (error) {
    console.error('❌ Get today hydration error:', error);
    res.status(500).json({ message: 'Failed to fetch hydration data' });
  }
};

// POST /api/hydration/add
export const addWater = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { amountMl, date: customDate } = req.body;
    const date = getLocalDateString(customDate);

    const amount = Number(amountMl);
    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ message: 'Valid water amount in ml is required' });
      return;
    }

    let doc = await Hydration.findOne({ userId, date });
    if (!doc) {
      let defaultGoal = 2500;
      const lastHydration = await Hydration.findOne({ userId }).sort({ createdAt: -1 });
      if (lastHydration && lastHydration.goalMl > 0) {
        defaultGoal = lastHydration.goalMl;
      }

      doc = new Hydration({
        userId,
        date,
        goalMl: defaultGoal,
        consumedMl: 0,
        entries: [],
      });
    }

    doc.entries.push({
      amountMl: amount,
      timestamp: new Date(),
    });

    doc.consumedMl = doc.entries.reduce((sum, entry) => sum + (entry.amountMl || 0), 0);
    await doc.save();

    logDebugInfo('ADD_WATER', userId.toString(), date, doc.goalMl, doc.consumedMl);
    res.json(formatHydrationResponse(doc));
  } catch (error) {
    console.error('❌ Add water error:', error);
    res.status(500).json({ message: 'Failed to add water intake' });
  }
};

// PUT /api/hydration/goal
export const setGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { goalMl, date: customDate } = req.body;
    const date = getLocalDateString(customDate);

    const goal = Number(goalMl);
    if (isNaN(goal) || goal < 100) {
      res.status(400).json({ message: 'Daily water goal must be at least 100 ml' });
      return;
    }

    let doc = await Hydration.findOne({ userId, date });
    if (!doc) {
      doc = new Hydration({
        userId,
        date,
        goalMl: goal,
        consumedMl: 0,
        entries: [],
      });
    } else {
      doc.goalMl = goal;
    }

    await doc.save();

    // Update user profile default as well
    await User.findByIdAndUpdate(userId, {
      $set: { 'profile.waterIntake': goal },
    });

    logDebugInfo('SET_GOAL', userId.toString(), date, doc.goalMl, doc.consumedMl);
    res.json(formatHydrationResponse(doc));
  } catch (error) {
    console.error('❌ Set hydration goal error:', error);
    res.status(500).json({ message: 'Failed to update hydration goal' });
  }
};

// PUT /api/hydration/entry/:entryId
export const editEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { entryId } = req.params;
    const { amountMl, date: customDate } = req.body;
    const date = getLocalDateString(customDate);

    const amount = Number(amountMl);
    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ message: 'Valid water amount in ml is required' });
      return;
    }

    const doc = await Hydration.findOne({ userId, date });
    if (!doc) {
      res.status(404).json({ message: 'Hydration record not found for today' });
      return;
    }

    const entry = doc.entries.find((e: any) => e._id.toString() === entryId);
    if (!entry) {
      res.status(404).json({ message: 'Water entry not found' });
      return;
    }

    entry.amountMl = amount;
    doc.consumedMl = doc.entries.reduce((sum, item) => sum + (item.amountMl || 0), 0);
    await doc.save();

    logDebugInfo('EDIT_ENTRY', userId.toString(), date, doc.goalMl, doc.consumedMl);
    res.json(formatHydrationResponse(doc));
  } catch (error) {
    console.error('❌ Edit water entry error:', error);
    res.status(500).json({ message: 'Failed to edit water entry' });
  }
};

// DELETE /api/hydration/entry/:entryId
export const deleteEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { entryId } = req.params;
    const date = getLocalDateString(req.query.date as string | undefined);

    const doc = await Hydration.findOne({ userId, date });
    if (!doc) {
      res.status(404).json({ message: 'Hydration record not found for today' });
      return;
    }

    doc.entries = doc.entries.filter((e: any) => e._id.toString() !== entryId) as any;
    doc.consumedMl = doc.entries.reduce((sum, item) => sum + (item.amountMl || 0), 0);
    await doc.save();

    logDebugInfo('DELETE_ENTRY', userId.toString(), date, doc.goalMl, doc.consumedMl);
    res.json(formatHydrationResponse(doc));
  } catch (error) {
    console.error('❌ Delete water entry error:', error);
    res.status(500).json({ message: 'Failed to delete water entry' });
  }
};

// GET /api/hydration/history
export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const historyDocs = await Hydration.find({ userId }).sort({ date: -1 }).limit(30);

    const formattedHistory = historyDocs.map((doc) => formatHydrationResponse(doc));
    res.json(formattedHistory);
  } catch (error) {
    console.error('❌ Get hydration history error:', error);
    res.status(500).json({ message: 'Failed to fetch hydration history' });
  }
};
