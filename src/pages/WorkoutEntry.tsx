
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, Dumbbell, TrendingUp, Activity } from 'lucide-react';
import { useAppStore, useFitnessEntries, type WorkoutType } from '../store';
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

const workoutIcons: Record<WorkoutType, string> = {
  stretching: '🤸',
  yoga: '🧘',
  cardio: '🏃',
  strength: '💪',
  meditation: '🧠',
  relaxation: '😌',
};

export default function WorkoutEntry() {
  const navigate = useNavigate();
  const fitnessEntries = useFitnessEntries();
  const addFitnessEntry = useAppStore((state) => state.addFitnessEntry);
  const deleteFitnessEntry = useAppStore((state) => state.deleteFitnessEntry);

  const [workoutType, setWorkoutType] = useState<WorkoutType>('cardio');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const intensityValue: Record<'low' | 'medium' | 'high', number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  const chartData = useMemo(() => {
    const sorted = [...fitnessEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const aggregated: Record<string, { duration: number; intensitySum: number; count: number }> = {};
    for (const entry of sorted) {
      if (!aggregated[entry.date]) {
        aggregated[entry.date] = { duration: 0, intensitySum: 0, count: 0 };
      }
      aggregated[entry.date].duration += entry.duration;
      aggregated[entry.date].intensitySum += intensityValue[entry.intensity] ?? 2;
      aggregated[entry.date].count += 1;
    }
    const dateKeys = Object.keys(aggregated).slice(-30);
    return dateKeys.map((d) => ({
      date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Minutes: aggregated[d].duration,
      'Avg Intensity':
        aggregated[d].count > 0
          ? Math.round((aggregated[d].intensitySum / aggregated[d].count) * 10) / 10
          : 2,
    }));
  }, [fitnessEntries]);

  const handleSave = () => {
    addFitnessEntry({
      id: Date.now().toString(),
      date,
      workoutType,
      duration,
      intensity,
      notes,
    });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <h1 className="text-3xl font-bold text-gray-800">Workout Tracker</h1>
          </div>
          <NotificationBell />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Log Your Workout</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Workout Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(workoutIcons) as WorkoutType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setWorkoutType(type)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      workoutType === type ? 'bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-3xl">{workoutIcons[type]}</span>
                    <span className="text-xs mt-1 capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Duration (minutes): {duration}</label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Intensity</label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      intensity === level ? 'bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="How did your workout go?"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Entry
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Workouts</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...fitnessEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-xl flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                      <span className="text-2xl">{workoutIcons[entry.workoutType]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{entry.workoutType.charAt(0).toUpperCase() + entry.workoutType.slice(1)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {entry.duration} min • {entry.intensity}
                      </p>
                      {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteFitnessEntry(entry.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {fitnessEntries.length === 0 && (
                <p className="text-center text-gray-500 py-8">No workout entries yet! Start tracking your fitness.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Workout Activity Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-400/15 rounded-full blur-3xl -mr-14 -mt-14 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Workout Activity Trends</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {chartData.length > 0 ? `Duration &amp; intensity from up to last ${chartData.length} days` : 'Log a workout to see trends'}
                </p>
              </div>
            </div>
            {chartData.length > 0 && (
              <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" />
                  Duration
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500" />
                  Avg Intensity
                </div>
              </div>
            )}
          </div>

          <div className="relative h-72 sm:h-80 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-cyan-50/50 border border-emerald-100/60 p-2 sm:p-4">
            {chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 gap-3">
                <Activity className="w-12 h-12 opacity-40" />
                <p className="text-sm font-semibold">No data yet — log at least one workout above</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 14, left: -10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="weWorkoutStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="weIntensityStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#a7f3d0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    interval={chartData.length > 10 ? 'preserveStartEnd' : 0}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#10b981', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'min', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 700, fill: '#059669' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 3]}
                    tick={{ fontSize: 10, fill: '#0ea5e9', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    ticks={[1, 2, 3]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.97)',
                      borderRadius: 16,
                      border: '1px solid #a7f3d0',
                      boxShadow: '0 15px 30px -10px rgba(16, 185, 129, 0.25)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    labelStyle={{ color: '#047857', fontWeight: 800, fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="circle" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Minutes"
                    stroke="url(#weWorkoutStroke)"
                    strokeWidth={3}
                    dot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: '#10b981' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#0d9488' }}
                    animationDuration={1600}
                    animationEasing="ease-out"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Avg Intensity"
                    stroke="url(#weIntensityStroke)"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#22d3ee' }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#0ea5e9' }}
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
