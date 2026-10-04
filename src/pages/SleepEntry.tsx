import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Moon, TrendingUp, Clock, AlertCircle, CheckCircle2, BedDouble } from 'lucide-react';
import { useAppStore, useSleepEntries, type SleepQuality, type SleepEntry as StoreSleepEntry } from '../store';
import { NotificationBell } from '../components/NotificationBell';
import { sleepAPI } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const sleepQualityEmojis: Record<SleepQuality, { emoji: string; label: string; color: string }> = {
  excellent: { emoji: '😴', label: 'Excellent', color: 'from-emerald-500 to-teal-500' },
  good: { emoji: '😊', label: 'Good', color: 'from-blue-500 to-indigo-500' },
  average: { emoji: '😐', label: 'Average', color: 'from-amber-500 to-orange-500' },
  poor: { emoji: '😞', label: 'Poor', color: 'from-rose-500 to-red-500' },
};

function calculateDuration(bedtimeStr: string, wakeupTimeStr: string): { totalMinutes: number; hours: number; minutes: number; formatted: string } {
  if (!bedtimeStr || !wakeupTimeStr) {
    return { totalMinutes: 0, hours: 0, minutes: 0, formatted: '0 hrs 0 mins' };
  }

  const [bHours, bMins] = bedtimeStr.split(':').map(Number);
  const [wHours, wMins] = wakeupTimeStr.split(':').map(Number);

  if (isNaN(bHours) || isNaN(bMins) || isNaN(wHours) || isNaN(wMins)) {
    return { totalMinutes: 0, hours: 0, minutes: 0, formatted: '0 hrs 0 mins' };
  }

  let bedtimeTotalMins = bHours * 60 + bMins;
  let wakeupTotalMins = wHours * 60 + wMins;

  // Handle midnight crossing
  if (wakeupTotalMins <= bedtimeTotalMins) {
    wakeupTotalMins += 24 * 60; // add 1440 minutes
  }

  const diffMins = wakeupTotalMins - bedtimeTotalMins;
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return {
    totalMinutes: diffMins,
    hours,
    minutes,
    formatted: `${hours} hrs ${minutes} mins`,
  };
}

export default function SleepEntry() {
  const navigate = useNavigate();
  const sleepEntries = useSleepEntries();
  const addSleepEntry = useAppStore((state) => state.addSleepEntry);
  const deleteSleepEntry = useAppStore((state) => state.deleteSleepEntry);
  const setSleepEntries = useAppStore((state) => state.setSleepEntries);
  const addNotification = useAppStore((state) => state.addNotification);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeupTime, setWakeupTime] = useState('06:30');
  const [quality, setQuality] = useState<SleepQuality>('good');
  const [awakenings, setAwakenings] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial history from MongoDB API
  useEffect(() => {
    let isMounted = true;
    async function loadSleepHistory() {
      try {
        const apiData = await sleepAPI.getHistory();
        if (isMounted && Array.isArray(apiData)) {
          const mapped: StoreSleepEntry[] = apiData.map((item) => ({
            id: item._id,
            date: item.date,
            bedtime: item.bedtime,
            wakeupTime: item.wakeupTime,
            durationHours: item.durationHours,
            quality: item.quality,
            awakenings: item.awakenings || 0,
            notes: item.notes || '',
          }));
          setSleepEntries(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch sleep history from API, falling back to store:', err);
      }
    }
    loadSleepHistory();
    return () => {
      isMounted = false;
    };
  }, [setSleepEntries]);

  const durationInfo = useMemo(() => calculateDuration(bedtime, wakeupTime), [bedtime, wakeupTime]);
  const durationInHours = useMemo(() => Number((durationInfo.totalMinutes / 60).toFixed(2)), [durationInfo]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!date) {
      showToast('Please select a valid date', 'error');
      return;
    }
    if (!bedtime || !wakeupTime) {
      showToast('Please select both bedtime and wake-up time', 'error');
      return;
    }
    if (durationInfo.totalMinutes <= 0) {
      showToast('Sleep duration must be greater than 0 minutes', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Send to MongoDB API
      const response = await sleepAPI.addEntry({
        date,
        bedtime,
        wakeupTime,
        durationHours: durationInHours,
        quality,
        awakenings,
        notes,
      });

      const entryId = response._id || Date.now().toString();

      // 2. Add to Zustand store
      const newEntry: StoreSleepEntry = {
        id: entryId,
        date,
        bedtime,
        wakeupTime,
        durationHours: durationInHours,
        quality,
        awakenings,
        notes,
      };

      addSleepEntry(newEntry);

      // 3. Add to notification store
      addNotification({
        id: Date.now().toString(),
        title: 'Sleep Record Saved',
        message: `Logged ${durationInfo.formatted} of sleep on ${new Date(date).toLocaleDateString()}.`,
        type: 'health',
        read: false,
        timestamp: new Date(),
      });

      showToast(`Sleep entry saved successfully! (${durationInfo.formatted})`, 'success');
      
      // Reset optional fields
      setNotes('');
    } catch (err: any) {
      console.error('Error saving sleep entry:', err);
      // Even if API fails, save locally in store for offline resilience
      const fallbackId = Date.now().toString();
      addSleepEntry({
        id: fallbackId,
        date,
        bedtime,
        wakeupTime,
        durationHours: durationInHours,
        quality,
        awakenings,
        notes,
      });
      showToast('Sleep entry saved locally! 💕', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await sleepAPI.deleteEntry(id);
    } catch (err) {
      console.warn('API delete failed, removing locally:', err);
    }
    deleteSleepEntry(id);
    showToast('Sleep entry removed', 'success');
  };

  // Process data for Recharts duration graph
  const chartData = useMemo(() => {
    const sorted = [...sleepEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const limited = sorted.slice(-30);
    return limited.map((e) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Sleep (hrs)': e.durationHours,
      Awakenings: e.awakenings || 0,
    }));
  }, [sleepEntries]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4 md:px-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-semibold ${
              toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Moon className="w-5 h-5" />
              </span>
              Sleep Tracker
            </h1>
          </div>
          <NotificationBell />
        </div>

        {/* Input Form & Recent History Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-indigo-500" />
              Log Sleep Entry
            </h2>

            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Bedtime & Wake-up Time */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Bedtime
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Wake-up Time
                </label>
                <input
                  type="time"
                  value={wakeupTime}
                  onChange={(e) => setWakeupTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Auto Calculated Sleep Duration Display */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Calculated Duration</p>
                <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-0.5">
                  {durationInfo.formatted}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 font-bold">
                <Moon className="w-6 h-6 animate-pulse text-indigo-500" />
              </div>
            </div>

            {/* Sleep Quality UI */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Sleep Quality</label>
              <div className="grid grid-cols-4 gap-3">
                {(Object.keys(sleepQualityEmojis) as SleepQuality[]).map((qKey) => {
                  const item = sleepQualityEmojis[qKey];
                  const isSelected = quality === qKey;
                  return (
                    <button
                      key={qKey}
                      type="button"
                      onClick={() => setQuality(qKey)}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? `bg-gradient-to-br ${item.color} text-white shadow-lg scale-[1.03]`
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="text-xs mt-1 font-medium capitalize">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Night Awakenings */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Night Awakenings: <span className="font-bold text-indigo-600">{awakenings} time(s)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={awakenings}
                  onChange={(e) => setAwakenings(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Felt restless? Room temperature? Dreams?"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3.5 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Saving Sleep Entry...' : 'Save Sleep Entry'}
            </button>
          </motion.div>

          {/* History List */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Recent Sleep Entries
            </h3>
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {[...sleepEntries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => {
                  const qInfo = sleepQualityEmojis[entry.quality] || sleepQualityEmojis.good;
                  const durText = calculateDuration(entry.bedtime, entry.wakeupTime).formatted;

                  return (
                    <div key={entry.id} className="p-4 bg-gray-50 hover:bg-indigo-50/40 transition-colors rounded-2xl flex items-start justify-between border border-gray-100">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-1 bg-white rounded-2xl shadow-sm">{qInfo.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800">
                              {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">
                              {entry.quality}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-600 mt-0.5">
                            {entry.bedtime} → {entry.wakeupTime} ({durText})
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Awakened: {entry.awakenings} time(s)
                          </p>
                          {entry.notes && <p className="text-xs text-gray-400 italic mt-1 bg-white p-2 rounded-xl border border-gray-100">"{entry.notes}"</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}

              {sleepEntries.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <Moon className="w-12 h-12 mx-auto text-indigo-300 opacity-60" />
                  <p className="text-gray-500 font-semibold">No sleep entries yet!</p>
                  <p className="text-xs text-gray-400">Log your sleep duration and quality to track rest trends.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sleep Duration Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-purple-400/15 rounded-full blur-3xl -mr-14 -mt-14 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Sleep Duration Trends</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {chartData.length > 0 ? `Showing up to last ${chartData.length} records` : 'Log your sleep to see trends'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative h-72 sm:h-80 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/50 border border-indigo-100/60 p-2 sm:p-4">
            {chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-3">
                <Moon className="w-12 h-12 opacity-40 text-indigo-400" />
                <p className="text-sm font-semibold">No sleep data yet — log an entry above</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 14, left: -10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="sleepDurationStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="50%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 12]}
                    tick={{ fontSize: 10, fill: '#6366f1', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    ticks={[2, 4, 6, 8, 10, 12]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.97)',
                      borderRadius: 16,
                      border: '1px solid #c7d2fe',
                      boxShadow: '0 15px 30px -10px rgba(79, 70, 229, 0.25)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: '#4338ca', fontWeight: 800, fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="Sleep (hrs)"
                    stroke="url(#sleepDurationStroke)"
                    strokeWidth={3.5}
                    dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#4f46e5' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: '#7c3aed' }}
                    animationDuration={1600}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
