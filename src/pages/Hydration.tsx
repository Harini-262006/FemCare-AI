import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Plus,
  Trash2,
  Edit2,
  Check,
  Target,
  Sparkles,
  RefreshCcw,
  GlassWater,
  Info,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  X,
} from 'lucide-react';
import { hydrationAPI, ApiHydration, ApiHydrationEntryItem } from '../services/api';
import { useAppStore } from '../store';
import { useTheme } from '../hooks/useTheme';

const QUICK_ADD_AMOUNTS = [100, 200, 250, 300, 500];

export default function Hydration() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const user = useAppStore((state) => state.user);

  const [hydrationData, setHydrationData] = useState<ApiHydration | null>(null);
  const [historyData, setHistoryData] = useState<ApiHydration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom add modal state
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Goal edit modal state
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [newGoalInput, setNewGoalInput] = useState<string>('');

  // Edit entry modal state
  const [editingEntry, setEditingEntry] = useState<ApiHydrationEntryItem | null>(null);
  const [editAmountInput, setEditAmountInput] = useState<string>('');

  const getTodayDateStr = () => new Date().toLocaleDateString('en-CA');

  // Load today's hydration and history
  const loadHydrationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dateStr = getTodayDateStr();
      const [todayDoc, historyDocs] = await Promise.all([
        hydrationAPI.getToday(dateStr),
        hydrationAPI.getHistory().catch(() => []),
      ]);
      setHydrationData(todayDoc);
      setHistoryData(historyDocs);
    } catch (err: any) {
      console.error('Failed to load hydration data:', err);
      setError(err?.message || 'Failed to load hydration data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHydrationData();
  }, [loadHydrationData]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Quick add water
  const handleAddWater = async (amountMl: number) => {
    if (amountMl <= 0) return;
    try {
      setSubmitting(true);
      setError(null);
      const dateStr = getTodayDateStr();
      const updated = await hydrationAPI.addWater(amountMl, dateStr);
      setHydrationData(updated);
      showNotification(`Added ${amountMl} ml of water! 💧`);
    } catch (err: any) {
      console.error('Failed to add water:', err);
      setError(err?.message || 'Failed to add water');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit custom amount
  const handleCustomAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid water amount in ml');
      return;
    }
    await handleAddWater(amount);
    setShowCustomModal(false);
    setCustomAmount('');
  };

  // Submit goal change
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = parseInt(newGoalInput, 10);
    if (isNaN(goal) || goal < 100) {
      setError('Goal must be at least 100 ml');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const dateStr = getTodayDateStr();
      const updated = await hydrationAPI.setGoal(goal, dateStr);
      setHydrationData(updated);
      setShowGoalModal(false);
      showNotification(`Daily goal updated to ${goal} ml! 🎯`);
    } catch (err: any) {
      console.error('Failed to update goal:', err);
      setError(err?.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete water entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      setSubmitting(true);
      setError(null);
      const dateStr = getTodayDateStr();
      const updated = await hydrationAPI.deleteEntry(entryId, dateStr);
      setHydrationData(updated);
      showNotification('Entry removed');
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setError(err?.message || 'Failed to delete entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit water entry
  const handleEditEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const amount = parseInt(editAmountInput, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const dateStr = getTodayDateStr();
      const updated = await hydrationAPI.editEntry(editingEntry._id, amount, dateStr);
      setHydrationData(updated);
      setEditingEntry(null);
      showNotification('Water entry updated!');
    } catch (err: any) {
      console.error('Failed to edit entry:', err);
      setError(err?.message || 'Failed to edit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const consumedMl = hydrationData?.consumedMl || 0;
  const goalMl = hydrationData?.goalMl || 2500;
  const percentage = goalMl > 0 ? Math.round((consumedMl / goalMl) * 100) : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const remainingMl = Math.max(goalMl - consumedMl, 0);
  const isGoalCompleted = consumedMl >= goalMl && goalMl > 0;
  const entries = hydrationData?.entries || [];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/60 text-gray-800'
      } p-4 sm:p-6 lg:p-8 relative pb-20`}
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <BackToHomeButton />
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                  <Droplets className="w-6 h-6 animate-pulse" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">
                  Hydration Tracker
                </h1>
              </div>
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Track your daily water intake and stay hydrated.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setNewGoalInput(goalMl.toString());
              setShowGoalModal(true);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700'
                : 'bg-white hover:bg-cyan-50 text-cyan-700 border border-cyan-100'
            }`}
          >
            <Target className="w-4 h-4 text-cyan-500" />
            Set Goal ({goalMl} ml)
          </button>
        </div>

        {/* NOTIFICATIONS & ERRORS */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-rose-500/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2"
            >
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN DASHBOARD CARD */}
        <div
          className={`p-6 sm:p-8 rounded-3xl shadow-xl border backdrop-blur-xl relative overflow-hidden transition-all ${
            isDark ? 'bg-gray-800/90 border-gray-700/60' : 'bg-white/90 border-cyan-100'
          }`}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Circular Progress Gauge */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className={`${isDark ? 'stroke-gray-700' : 'stroke-cyan-100'} stroke-[10] fill-none`}
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-[10] fill-none stroke-current text-cyan-500"
                    strokeLinecap="round"
                    strokeDasharray="263.89"
                    initial={{ strokeDashoffset: 263.89 }}
                    animate={{ strokeDashoffset: 263.89 - (clampedPercentage / 100) * 263.89 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <Droplets className="w-8 h-8 text-cyan-500 mb-1 animate-bounce" />
                  <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    {percentage}%
                  </span>
                  <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                    {consumedMl} ml / {goalMl} ml
                  </span>
                </div>
              </div>

              {isGoalCompleted && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-3 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Daily goal completed! 🎉
                </motion.div>
              )}
            </div>

            {/* Consumed / Remaining Stats */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-cyan-50/50 border-cyan-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1">
                    <Droplets className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Consumed</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {consumedMl} <span className="text-xs text-gray-500 font-normal">ml</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                    ({(consumedMl / 1000).toFixed(2)} L)
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-gray-900/60 border-gray-700' : 'bg-blue-50/50 border-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Remaining</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {remainingMl} <span className="text-xs text-gray-500 font-normal">ml</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {isGoalCompleted ? '0 ml needed' : `(${(remainingMl / 1000).toFixed(2)} L left)`}
                  </div>
                </div>
              </div>

              {/* Linear Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Progress Bar</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{percentage}%</span>
                </div>
                <div className={`h-3.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-cyan-100'}`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ADD WATER BUTTONS */}
        <div
          className={`p-6 rounded-3xl shadow-lg border backdrop-blur-xl space-y-4 ${
            isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white/80 border-cyan-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <GlassWater className="w-5 h-5 text-cyan-500" />
              Quick Add Water
            </h2>
            <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tap amount to add
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ADD_AMOUNTS.map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.95 }}
                disabled={submitting}
                onClick={() => handleAddWater(amount)}
                className={`py-3.5 px-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 transition-all shadow-sm border ${
                  isDark
                    ? 'bg-gray-900/80 border-gray-700 hover:bg-cyan-950/40 hover:border-cyan-500/50 text-cyan-300'
                    : 'bg-gradient-to-b from-white to-cyan-50/50 border-cyan-100 hover:border-cyan-300 hover:shadow-md text-cyan-700'
                }`}
              >
                <span className="text-base sm:text-lg">+{amount} ml</span>
                <span className="text-[10px] font-medium text-gray-400">({amount / 250} glass)</span>
              </motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomModal(true)}
              className="py-3.5 px-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Custom</span>
            </motion.button>
          </div>
        </div>

        {/* TODAY'S INTAKE HISTORY */}
        <div
          className={`p-6 rounded-3xl shadow-lg border backdrop-blur-xl space-y-4 ${
            isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white/80 border-cyan-100'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-500" />
                Today's Water Intake Log
              </h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded today
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-bold uppercase block">Total</span>
              <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">{consumedMl} ml</span>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4 animate-spin text-cyan-500" />
              Loading hydration entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 space-y-2">
              <GlassWater className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
              <p>No water logged today yet. Tap a quick add button above to get started!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {entries.map((entry, idx) => {
                const entryTime = new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                return (
                  <motion.div
                    key={entry._id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/60 hover:border-cyan-500/40'
                        : 'bg-white border-cyan-50 hover:border-cyan-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                        💧
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          +{entry.amountMl} ml
                        </div>
                        <div className="text-xs text-gray-400 font-medium">{entryTime}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingEntry(entry);
                          setEditAmountInput(entry.amountMl.toString());
                        }}
                        className="p-2 rounded-xl text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-gray-800 transition-all"
                        title="Edit amount"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteEntry(entry._id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-gray-800 transition-all"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* MEDICAL DISCLAIMER */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
            isDark ? 'bg-gray-800/40 border-gray-700/50 text-gray-400' : 'bg-cyan-50/40 border-cyan-100 text-gray-600'
          }`}
        >
          <Info className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-700 dark:text-gray-300">Hydration Guidance:</span> The standard
            recommended daily water goal is around 2,000–2,500 ml. Hydration needs vary based on body composition,
            activity level, climate, and personal medical guidance. Adjust your goal as needed or consult your doctor
            for personalized advice.
          </div>
        </div>
      </div>

      {/* CUSTOM AMOUNT MODAL */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-cyan-100 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <GlassWater className="w-5 h-5 text-cyan-500" />
                  Add Custom Water Amount
                </h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCustomAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Water Amount (ml)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="3000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="e.g. 350"
                    className={`w-full px-4 py-3 rounded-2xl border font-semibold outline-none transition-all ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 focus:border-cyan-500 text-white'
                        : 'bg-gray-50 border-gray-200 focus:border-cyan-500 text-gray-900'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Add Water
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SET GOAL MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-cyan-100 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-500" />
                  Set Daily Water Goal
                </h3>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Daily Goal (ml)
                  </label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    placeholder="e.g. 2500"
                    className={`w-full px-4 py-3 rounded-2xl border font-semibold outline-none transition-all ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 focus:border-cyan-500 text-white'
                        : 'bg-gray-50 border-gray-200 focus:border-cyan-500 text-gray-900'
                    }`}
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Standard recommended daily goal is 2500 ml (approx. 10 glasses).
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Update Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ENTRY MODAL */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-cyan-100 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-cyan-500" />
                  Edit Water Entry
                </h3>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditEntrySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Amount (ml)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="3000"
                    value={editAmountInput}
                    onChange={(e) => setEditAmountInput(e.target.value)}
                    placeholder="e.g. 250"
                    className={`w-full px-4 py-3 rounded-2xl border font-semibold outline-none transition-all ${
                      isDark
                        ? 'bg-gray-900 border-gray-700 focus:border-cyan-500 text-white'
                        : 'bg-gray-50 border-gray-200 focus:border-cyan-500 text-gray-900'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
