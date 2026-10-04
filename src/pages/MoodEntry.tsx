
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, Smile, TrendingUp } from 'lucide-react';
import { useAppStore, useMoodEntries, type MoodType } from '../store';
import { NotificationBell } from '../components/NotificationBell';
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

const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  excited: '🎉',
  calm: '🧘',
  anxious: '😰',
  stressed: '😫',
  sad: '😔',
  angry: '😠',
  neutral: '😐',
};

const moodValue: Record<MoodType, number> = {
  excited: 8,
  happy: 7,
  calm: 6,
  neutral: 5,
  anxious: 3,
  sad: 2,
  stressed: 2,
  angry: 1,
};

export default function MoodEntry() {
  const navigate = useNavigate();
  const moodEntries = useMoodEntries();
  const addMoodEntry = useAppStore((state) => state.addMoodEntry);
  const deleteMoodEntry = useAppStore((state) => state.deleteMoodEntry);

  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const [stressLevel, setStressLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const chartData = useMemo(() => {
    const sorted = [...moodEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const limited = sorted.slice(-30);
    return limited.map((e) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Mood: moodValue[e.mood] ?? 4,
      Stress: e.stressLevel ?? 3,
    }));
  }, [moodEntries]);

  const handleSave = () => {
    addMoodEntry({
      id: Date.now().toString(),
      date,
      mood: selectedMood,
      stressLevel,
      notes,
    });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <h1 className="text-3xl font-bold text-gray-800">Mood Tracker</h1>
          </div>
          <NotificationBell />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">How are you feeling today?</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Mood</label>
              <div className="grid grid-cols-4 gap-3">
                {(Object.keys(moodEmojis) as MoodType[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      selectedMood === mood ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-3xl">{moodEmojis[mood]}</span>
                    <span className="text-xs mt-1 capitalize">{mood}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Stress Level: {stressLevel}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="What's on your mind?"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Entry
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Mood Entries</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...moodEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-xl flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{moodEmojis[entry.mood]}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-gray-500">Stress: {entry.stressLevel}/10</p>
                      {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteMoodEntry(entry.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {moodEntries.length === 0 && (
                <p className="text-center text-gray-500 py-8">No mood entries yet! Start tracking how you feel.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Mood Trends Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-fuchsia-400/15 rounded-full blur-3xl -mr-14 -mt-14 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Mood &amp; Stress Trends</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {chartData.length > 0 ? `Showing up to last ${chartData.length} entries` : 'Log your mood to see trends'}
                </p>
              </div>
            </div>
            {chartData.length > 0 && (
              <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500" />
                  Mood
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
                  Stress
                </div>
              </div>
            )}
          </div>

          <div className="relative h-72 sm:h-80 rounded-2xl bg-gradient-to-br from-pink-50/60 via-fuchsia-50/40 to-violet-50/50 border border-pink-100/60 p-2 sm:p-4">
            {chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-3">
                <Smile className="w-12 h-12 opacity-40" />
                <p className="text-sm font-semibold">No data yet — log at least one mood above</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 14, left: -10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="meMoodStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="meStressStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5d0fe" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    interval={chartData.length > 10 ? 'preserveStartEnd' : 0}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: '#a78bfa', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    ticks={[2, 4, 6, 8, 10]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.97)',
                      borderRadius: 16,
                      border: '1px solid #f5d0fe',
                      boxShadow: '0 15px 30px -10px rgba(236, 72, 153, 0.25)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: '#a21caf', fontWeight: 800, fontSize: 11 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="Mood"
                    stroke="url(#meMoodStroke)"
                    strokeWidth={3}
                    dot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: '#ec4899' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#d946ef' }}
                    animationDuration={1600}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="Stress"
                    stroke="url(#meStressStroke)"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#fb923c' }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#ef4444' }}
                    animationDuration={1800}
                    animationEasing="ease-out"
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
