import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion } from 'framer-motion';
import {
  Calendar, Droplets, Plus, Trash2, ArrowLeft, Clock, Sparkles,
  Heart, AlertTriangle, Flower2, Sun, Moon, Activity,
  ChevronLeft, ChevronRight, BarChart3, Target, Zap, Thermometer,
  CloudSun, Umbrella, Flame, Brain, AlertCircle, Check, Flame as Flame2,
} from 'lucide-react';
import { useAppStore, useCycleEntries, useProfile, useMoodEntries, type CycleEntry, type SymptomType, type SymptomSeverity, type MoodType } from '../store';
import { NotificationBell } from '../components/NotificationBell';

const moodEmojis: Record<MoodType, string> = {
  happy: '😊', excited: '🤩', calm: '😌', anxious: '😰',
  stressed: '😣', sad: '😢', angry: '😠', neutral: '😐',
};

const painEmojis = ['😌', '🙂', '😐', '😕', '😟', '😣', '😖', '😫', '😩', '😭', '💀'];

const pmsSymptoms: { type: SymptomType; label: string; icon: string }[] = [
  { type: 'cramps', label: 'Cramps', icon: '🌀' },
  { type: 'headache', label: 'Headache', icon: '🤕' },
  { type: 'fatigue', label: 'Fatigue', icon: '😴' },
  { type: 'acne', label: 'Acne', icon: '🧴' },
  { type: 'bloating', label: 'Bloating', icon: '🎈' },
  { type: 'breast-tenderness', label: 'Breast Tenderness', icon: '💗' },
  { type: 'mood-swing', label: 'Mood Swings', icon: '🎭' },
  { type: 'insomnia', label: 'Insomnia', icon: '🌙' },
  { type: 'stress', label: 'Stress', icon: '📊' },
  { type: 'anxiety', label: 'Anxiety', icon: '💭' },
  { type: 'low-energy', label: 'Low Energy', icon: '🔋' },
];

const pcosSymptoms = [
  { key: 'weightGain', label: 'Weight Gain', icon: '⚖️' },
  { key: 'acne', label: 'Acne', icon: '🧴' },
  { key: 'hairGrowth', label: 'Hair Growth', icon: '💇' },
  { key: 'irregularPeriods', label: 'Irregular Periods', icon: '📅' },
  { key: 'insulinResistance', label: 'Insulin Resistance', icon: '🩸' },
];

const endoSymptoms = [
  { key: 'pelvicPain', label: 'Pelvic Pain', icon: '🔥' },
  { key: 'heavyBleeding', label: 'Heavy Bleeding', icon: '🩸' },
  { key: 'spotting', label: 'Spotting', icon: '💧' },
  { key: 'painIntercourse', label: 'Pain During Intercourse', icon: '💔' },
];

const flowLevels = [
  { key: 'light', label: 'Light', color: 'from-pink-300 to-rose-300', dotColor: 'bg-pink-400', icon: Droplets, size: 1 },
  { key: 'medium', label: 'Medium', color: 'from-pink-400 to-rose-400', dotColor: 'bg-pink-500', icon: Droplets, size: 2 },
  { key: 'heavy', label: 'Heavy', color: 'from-rose-500 to-red-500', dotColor: 'bg-rose-600', icon: Droplets, size: 3 },
  { key: 'very-heavy', label: 'Very Heavy', color: 'from-red-600 to-rose-700', dotColor: 'bg-red-700', icon: Droplets, size: 4 },
] as const;

const formatDate = (d: Date) => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

const getFlowDots = (entry: CycleEntry): number => {
  try {
    if (entry.notes) {
      const parsed = JSON.parse(entry.notes);
      const full = parsed.flowIntensityFull;
      if (full === 'light') return 1;
      if (full === 'medium') return 2;
      if (full === 'heavy' || full === 'very-heavy') return 3;
    }
    if (entry.flowIntensity === 'light') return 1;
    if (entry.flowIntensity === 'medium') return 2;
    return 3;
  } catch {
    return entry.flowIntensity === 'light' ? 1 : entry.flowIntensity === 'medium' ? 2 : 3;
  }
};

export default function CycleTracker() {
  const navigate = useNavigate();
  const profile = useProfile();
  const cycleEntries = useCycleEntries();
  const moodEntries = useMoodEntries();
  const addCycleEntry = useAppStore((state) => state.addCycleEntry);
  const deleteCycleEntry = useAppStore((state) => state.deleteCycleEntry);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [flowIntensity, setFlowIntensity] = useState<'light' | 'medium' | 'heavy' | 'very-heavy'>(
    'medium'
  );
  const [isPeriod, setIsPeriod] = useState(false);
  const [showPCOSTracking, setShowPCOSTracking] = useState(false);
  const [showEndoTracking, setShowEndoTracking] = useState(false);

  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<SymptomType, SymptomSeverity | null>>({} as Record<SymptomType, SymptomSeverity | null>);
  const [pcosSeverities, setPcosSeverities] = useState<Record<string, number>>({});
  const [endoSeverities, setEndoSeverities] = useState<Record<string, number>>({});
  const [isSpotting, setIsSpotting] = useState(false);
  const [spottingDate, setSpottingDate] = useState(new Date().toISOString().split('T')[0]);
  const [painLevel, setPainLevel] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const predictions = useMemo(() => {
    if (!profile?.lastPeriodDate || !profile?.cycleLength) {
      return null;
    }
    const lastPeriod = new Date(profile.lastPeriodDate);
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(nextPeriod.getDate() + profile.cycleLength);
    const daysUntilNext = Math.max(0, Math.ceil((nextPeriod.getTime() - new Date().getTime()) / 86400000));
    const ovulationDate = new Date(nextPeriod);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 1);
    const daysUntilOvulation = Math.max(0, Math.ceil((ovulationDate.getTime() - new Date().getTime()) / 86400000));
    let conceptionProbability = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fertileStartDay = new Date(fertileStart);
    fertileStartDay.setHours(0, 0, 0, 0);
    const fertileEndDay = new Date(fertileEnd);
    fertileEndDay.setHours(23, 59, 59, 999);
    if (today >= fertileStartDay && today <= fertileEndDay) {
      const diffOv = Math.ceil((ovulationDate.getTime() - new Date().getTime()) / 86400000);
      if (diffOv >= -1 && diffOv <= 1) conceptionProbability = 90;
      else if (diffOv >= -2 && diffOv <= 2) conceptionProbability = 70;
      else conceptionProbability = 45;
    } else {
      conceptionProbability = 10;
    }
    return { nextPeriod, daysUntilNext, ovulationDate, daysUntilOvulation, fertileStart, fertileEnd, conceptionProbability };
  }, [profile]);

  const isIrregularCycle = useMemo(() => {
    if (!profile?.cycleLength) return false;
    return profile.cycleLength < 21 || profile.cycleLength > 35;
  }, [profile]);

  const calendarData = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    const startOffset = firstDay.getDay();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push(new Date(year, month + 1, d));
    }
    return days;
  }, [calendarMonth]);

  const periodDatesMap = useMemo(() => {
    const map: Record<string, CycleEntry> = {};
    cycleEntries.forEach(e => { if (e.isPeriod) map[e.date] = e; });
    return map;
  }, [cycleEntries]);

  const moodMap = useMemo(() => {
    const map: Record<string, MoodType> = {};
    moodEntries.forEach(m => { map[m.date] = m.mood; });
    return map;
  }, [moodEntries]);

  const last14DaysData = useMemo(() => {
    const data: { date: string; dateObj: Date; moodValue: number; phase: string; phaseColor: string }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = moodEntries.find(m => m.date === dateStr);
      const moodValueMap: Record<MoodType, number> = { happy: 9, excited: 10, calm: 8, neutral: 6, anxious: 3, stressed: 2, sad: 2, angry: 1 };
      const moodVal = entry ? (moodValueMap[entry.mood] ?? 5) : 5;
      let phase = 'Follicular';
      let phaseColor = 'from-pink-400 to-rose-400';
      if (profile?.lastPeriodDate && profile?.cycleLength) {
        const last = new Date(profile.lastPeriodDate);
        let dayInCycle = Math.floor((d.getTime() - last.getTime()) / 86400000);
        const cycle = profile.cycleLength;
        dayInCycle = ((dayInCycle % cycle) + cycle) % cycle;
        if (dayInCycle >= 0 && dayInCycle <= 5) {
          phase = 'Menstrual';
          phaseColor = 'from-rose-500 to-red-500';
        } else if (dayInCycle >= 10 && dayInCycle <= 17) {
          phase = 'Ovulation';
          phaseColor = 'from-teal-400 to-cyan-500';
        } else if (dayInCycle > 17) {
          phase = 'Luteal';
          phaseColor = 'from-violet-400 to-purple-500';
        }
      }
      data.push({ date: dateStr, dateObj: d, moodValue: moodVal, phase, phaseColor });
    }
    return data;
  }, [moodEntries, profile]);

  const handleSave = () => {
    const entry: CycleEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      isPeriod,
      flowIntensity: flowIntensity === 'very-heavy' ? 'heavy' : flowIntensity,
      notes: JSON.stringify({
        flowIntensityFull: flowIntensity,
        isSpotting, spottingDate, painLevel, selectedSymptoms,
        pcosSeverities, endoSeverities, showPCOSTracking, showEndoTracking,
      }),
    };
    addCycleEntry(entry);
  };

  const toggleSymptom = (type: SymptomType) => {
    setSelectedSymptoms(prev => {
      const current = prev[type];
      const next: Record<SymptomType, SymptomSeverity | null> = { ...prev };
      if (!current) next[type] = 'mild';
      else if (current === 'mild') next[type] = 'moderate';
      else if (current === 'moderate') next[type] = 'severe';
      else next[type] = null;
      return next;
    });
  };

  const setPcosSeverity = (key: string, val: number) => {
    setPcosSeverities(prev => ({ ...prev, [key]: prev[key] === val ? 0 : val }));
  };

  const setEndoSeverity = (key: string, val: number) => {
    setEndoSeverities(prev => ({ ...prev, [key]: prev[key] === val ? 0 : val }));
  };

  const prevMonth = () => {
    setCalendarMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  };

  const nextMonth = () => {
    setCalendarMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
  };

  const severityColor = (sev: SymptomSeverity | null | undefined) => {
    if (!sev) return '';
    if (sev === 'mild') return 'ring-2 ring-emerald-400 bg-emerald-50 text-emerald-700';
    if (sev === 'moderate') return 'ring-2 ring-amber-400 bg-amber-50 text-amber-700';
    return 'ring-2 ring-rose-400 bg-rose-50 text-rose-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <h1 className="text-3xl font-bold text-gray-800">Cycle Tracker</h1>
          </div>
          <NotificationBell />
        </div>

        {/* ========== PREDICTION CARDS ========== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 p-6 text-white shadow-2xl shadow-pink-200/50"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Flower2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Next Period</p>
                  <p className="text-xl font-black">Prediction</p>
                </div>
              </div>
              {predictions ? (
                <>
                  <p className="text-3xl font-black mb-1">
                    {predictions.daysUntilNext === 0
                      ? 'Any day now!'
                      : `Expected in ${predictions.daysUntilNext} days`}
                  </p>
                  <p className="text-sm font-semibold text-white/85">
                    {formatDate(predictions.nextPeriod)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/80">Complete profile for predictions</p>
              )}
              <div className="flex items-center gap-2 mt-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold">
                  <Clock className="w-3 h-3" /> {profile?.cycleLength || 28}-day cycle
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 p-6 text-white shadow-2xl shadow-teal-200/50"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Ovulation</p>
                  <p className="text-xl font-black">Prediction</p>
                </div>
              </div>
              {predictions ? (
                <>
                  <p className="text-3xl font-black mb-1">
                    {predictions.daysUntilOvulation <= 0
                      ? 'Ovulating now!'
                      : `In ${Math.round(predictions.daysUntilOvulation)} days`}
                  </p>
                  <p className="text-sm font-semibold text-white/85">
                    Peak: {formatDate(predictions.ovulationDate)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/80">Complete profile for predictions</p>
              )}
              <div className="mt-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold">
                  <Umbrella className="w-3 h-3" /> Fertile Window {predictions ? `${formatDate(predictions.fertileStart).slice(0, 6)} – ${formatDate(predictions.fertileEnd).slice(0, 6)}` : '—'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-6 text-white shadow-2xl shadow-purple-200/50"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Fertility</p>
                  <p className="text-xl font-black">Window</p>
                </div>
              </div>
              {predictions ? (
                <>
                  <div className="flex items-end gap-2 mb-1">
                    <p className="text-5xl font-black">{predictions.conceptionProbability}%</p>
                    <p className="text-sm font-semibold text-white/80 mb-2">conception chance</p>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${predictions.conceptionProbability}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/80">Complete profile for predictions</p>
              )}
              <div className="mt-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold">
                  <Sparkles className="w-3 h-3" />
                  {predictions
                    ? predictions.conceptionProbability >= 70
                      ? 'High fertility window'
                      : predictions.conceptionProbability >= 40
                        ? 'Moderate fertility'
                        : 'Low fertility'
                    : '—'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* IRREGULAR CYCLE WARNING */}
        {isIrregularCycle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-300/70 p-6 shadow-xl shadow-amber-100"
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg"
              >
                <AlertTriangle className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-amber-900 mb-1">Irregular Cycle Detected</h3>
                <p className="text-amber-800 font-semibold mb-2">
                  Your cycle length ({profile?.cycleLength} days) falls outside the typical 21–35 day range.
                </p>
                <p className="text-sm text-amber-700">
                  This may be normal for some individuals, but consider tracking consistently and consulting a healthcare provider if this is a recent change. PCOS, thyroid issues, stress, or weight changes can affect cycle regularity.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* EXISTING LOG TODAY CARD - ENHANCED */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Log Today
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPeriod"
                  checked={isPeriod}
                  onChange={(e) => setIsPeriod(e.target.checked)}
                  className="w-5 h-5 text-pink-600 rounded"
                />
                <label htmlFor="isPeriod" className="font-medium text-gray-700">Period Day</label>
              </div>

              {isPeriod && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Flow Intensity</label>
                  <div className="grid grid-cols-4 gap-3">
                    {flowLevels.map((lvl) => {
                      const IconComp = lvl.icon;
                      return (
                        <button
                          key={lvl.key}
                          onClick={() => setFlowIntensity(lvl.key)}
                          className={`py-3 px-2 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${
                            flowIntensity === lvl.key
                              ? `bg-gradient-to-br ${lvl.color} text-white shadow-md`
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex gap-0.5">
                            {Array.from({ length: lvl.size }).map((_, i) => (
                              <div key={i} className={`w-1.5 h-4 rounded-full ${flowIntensity === lvl.key ? 'bg-white/80' : lvl.dotColor}`} />
                            ))}
                          </div>
                          <span className="text-xs">{lvl.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SPOTTING TRACKER */}
              <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-5 border border-pink-100">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="isSpotting"
                    checked={isSpotting}
                    onChange={(e) => setIsSpotting(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                  <label htmlFor="isSpotting" className="font-bold text-gray-800 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-pink-500" /> Spotting Tracker
                  </label>
                </div>
                {isSpotting && (
                  <div className="ml-8">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Spotting Date</label>
                    <input
                      type="date"
                      value={spottingDate}
                      onChange={(e) => setSpottingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* PAIN SCALE */}
              <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 p-5 border border-rose-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-bold text-gray-800 flex items-center gap-2">
                    <Flame2 className="w-4 h-4 text-rose-500" /> Menstrual Pain Level
                  </label>
                  <span className="text-3xl">{painEmojis[painLevel]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-300 accent-pink-500"
                    style={{ accentColor: '#ec4899' }}
                  />
                  <span className="text-xs font-bold text-gray-500">10</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-semibold text-emerald-600">None</span>
                  <span className="text-[10px] font-semibold text-amber-600">Mild</span>
                  <span className="text-[10px] font-semibold text-rose-600">Severe</span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-black ${painLevel <= 2 ? 'bg-emerald-100 text-emerald-700' : painLevel <= 5 ? 'bg-amber-100 text-amber-700' : painLevel <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                    {painLevel}/10 — {painLevel <= 2 ? 'No Pain' : painLevel <= 5 ? 'Mild' : painLevel <= 7 ? 'Moderate' : 'Severe'}
                  </span>
                </div>
              </div>

              {/* PMS SYMPTOMS */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> PMS Symptoms (tap to cycle severity)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {pmsSymptoms.map((sym) => (
                    <button
                      key={sym.type}
                      onClick={() => toggleSymptom(sym.type)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        selectedSymptoms[sym.type]
                          ? severityColor(selectedSymptoms[sym.type])
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{sym.icon}</span>
                      <span className="text-[10px]">{sym.label}</span>
                      {selectedSymptoms[sym.type] && (
                        <span className="text-[9px] uppercase tracking-wide font-black">
                          {selectedSymptoms[sym.type]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* PCOS TOGGLE */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 border border-violet-100">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="pcosToggle"
                    checked={showPCOSTracking}
                    onChange={(e) => setShowPCOSTracking(e.target.checked)}
                    className="w-5 h-5 text-violet-600 rounded"
                  />
                  <label htmlFor="pcosToggle" className="font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" /> Tracking PCOS Symptoms?
                  </label>
                </div>
                {showPCOSTracking && (
                  <div className="space-y-2 ml-8">
                    {pcosSymptoms.map((s) => (
                      <div key={s.key} className="bg-white rounded-xl p-3 border border-violet-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span>{s.icon}</span> {s.label}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setPcosSeverity(s.key, n)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                                (pcosSeverities[s.key] || 0) >= n
                                  ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white'
                                  : 'bg-violet-50 text-violet-400 hover:bg-violet-100'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-1 px-0.5">
                          <span className="text-[9px] text-gray-400 font-semibold">None</span>
                          <span className="text-[9px] text-gray-400 font-semibold">Severe</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ENDOMETRIOSIS TOGGLE */}
              <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 p-5 border border-fuchsia-100">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="endoToggle"
                    checked={showEndoTracking}
                    onChange={(e) => setShowEndoTracking(e.target.checked)}
                    className="w-5 h-5 text-fuchsia-600 rounded"
                  />
                  <label htmlFor="endoToggle" className="font-bold text-gray-800 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-fuchsia-500" /> Tracking Endometriosis?
                  </label>
                </div>
                {showEndoTracking && (
                  <div className="space-y-2 ml-8">
                    {endoSymptoms.map((s) => (
                      <div key={s.key} className="bg-white rounded-xl p-3 border border-fuchsia-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <span>{s.icon}</span> {s.label}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setEndoSeverity(s.key, n)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                                (endoSeverities[s.key] || 0) >= n
                                  ? 'bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white'
                                  : 'bg-fuchsia-50 text-fuchsia-400 hover:bg-fuchsia-100'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Save Entry
              </button>
            </div>
          </motion.div>

          {/* RIGHT SIDE - RECENT ENTRIES + MOOD CORRELATION */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Droplets className="w-6 h-6 text-pink-600" />
                Recent Entries
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[...cycleEntries]
                  .sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.isPeriod
                            ? `${entry.flowIntensity} flow`
                            : 'No period'}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCycleEntry(entry.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                {cycleEntries.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No entries yet! Start tracking your cycle.
                  </p>
                )}
              </div>
            </motion.div>

            {/* MOOD CORRELATION GRAPH */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-violet-600" />
                Mood vs Cycle Phase (Last 14 Days)
              </h3>
              <div className="relative h-56">
                <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] font-bold text-gray-400 pr-2">
                  <span>10</span>
                  <span>7</span>
                  <span>5</span>
                  <span>3</span>
                  <span>0</span>
                </div>
                <div className="ml-8 h-44 border-l-2 border-b-2 border-gray-200 relative">
                  {last14DaysData.map((d, i) => (
                    <div key={d.date} className="absolute bottom-0" style={{ left: `${(i / 14) * 100}%`, width: `${100 / 14 - 1}%` }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.moodValue / 10) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                        className={`absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t ${d.phaseColor} shadow-md`}
                        style={{ minHeight: '4px' }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm">
                          {moodMap[d.date] ? moodEmojis[moodMap[d.date] as MoodType] : ''}
                        </div>
                      </motion.div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500 whitespace-nowrap">
                        {d.dateObj.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-8 right-0 flex flex-wrap gap-2 justify-center pt-10">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-pink-50 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-rose-400" /> Menstrual
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-teal-50 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500" /> Ovulation
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-violet-50 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-purple-500" /> Luteal
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-rose-50 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-rose-400" /> Follicular
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* PERIOD HISTORY CALENDAR */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-pink-600" />
              Period History Calendar
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-pink-600 font-bold transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 font-black text-gray-800 min-w-[160px] text-center">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-pink-600 font-bold transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs md:text-sm font-black text-gray-500 py-2 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarData.map((date, idx) => {
              const dateStr = date.toISOString().split('T')[0];
              const isCurrentMonth = date.getMonth() === calendarMonth.month;
              const periodEntry = periodDatesMap[dateStr];
              const moodForDate = moodMap[dateStr];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const flowDotCount = periodEntry?.isPeriod ? Math.min(3, getFlowDots(periodEntry)) : 0;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  className={`relative aspect-square rounded-xl md:rounded-2xl p-1 md:p-2 flex flex-col items-center justify-start transition-all ${
                    !isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-pink-200'
                  } ${isToday ? 'ring-2 ring-pink-400 ring-offset-1' : ''} ${
                    periodEntry?.isPeriod ? 'bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 border-pink-300' : ''
                  }`}
                >
                  <span className={`text-xs md:text-sm font-bold ${
                    isToday ? 'text-pink-600' : !isCurrentMonth ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </span>
                  {periodEntry?.isPeriod && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: flowDotCount }).map((_, i) => (
                        <div key={i} className="w-1 h-2 md:w-1.5 md:h-2.5 rounded-full bg-gradient-to-t from-rose-500 to-pink-500" />
                      ))}
                    </div>
                  )}
                  {moodForDate && (
                    <span className="text-xs md:text-sm mt-auto">
                      {moodEmojis[moodForDate as MoodType]}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-gray-100">
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-600">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-lg bg-gradient-to-br from-pink-100 to-pink-200 border border-pink-300" />
              Period Day
            </span>
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-600">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-lg ring-2 ring-pink-400 ring-offset-1 bg-white" />
              Today
            </span>
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-600">
              <span className="text-base">😊</span> Mood Entry
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
