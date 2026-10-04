import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Sparkles,
  FileText,
  Activity,
  Zap,
  Heart,
  TrendingUp,
  ChevronRight,
  Filter,
  AlertCircle,
} from 'lucide-react'
import {
  useAppStore,
  useJournalEntries,
  type JournalEntry,
  type JournalSymptom,
  type SymptomType,
  type SymptomSeverity,
} from '@/store'
import { NotificationBell } from '@/components/NotificationBell'

const SYMPTOM_OPTIONS: { type: SymptomType; label: string; color: string }[] = [
  { type: 'cramps', label: 'Cramps', color: 'from-rose-500 to-pink-500' },
  { type: 'headache', label: 'Headache', color: 'from-violet-500 to-purple-500' },
  { type: 'fatigue', label: 'Fatigue', color: 'from-amber-500 to-orange-500' },
  { type: 'acne', label: 'Acne', color: 'from-red-400 to-rose-500' },
  { type: 'bloating', label: 'Bloating', color: 'from-teal-500 to-cyan-500' },
  { type: 'breast-tenderness', label: 'Breast Tenderness', color: 'from-pink-400 to-fuchsia-500' },
  { type: 'stress', label: 'Stress', color: 'from-indigo-500 to-blue-500' },
  { type: 'anxiety', label: 'Anxiety', color: 'from-blue-500 to-cyan-500' },
  { type: 'mood-swing', label: 'Mood Swing', color: 'from-fuchsia-500 to-pink-500' },
  { type: 'insomnia', label: 'Insomnia', color: 'from-slate-500 to-indigo-500' },
  { type: 'low-energy', label: 'Low Energy', color: 'from-yellow-500 to-amber-500' },
]

export default function HealthJournal() {
  const navigate = useNavigate()
  const entries = useJournalEntries()
  const { addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSymptom, setFilterSymptom] = useState<SymptomType | 'all'>('all')

  const [formData, setFormData] = useState<{
    notes: string
    symptoms: JournalSymptom[]
    energyLevel: number
    painLevel: number
  }>({
    notes: '',
    symptoms: [],
    energyLevel: 5,
    painLevel: 0,
  })

  const toggleSymptom = (type: SymptomType) => {
    setFormData((prev) => {
      const existing = prev.symptoms.find((s) => s.type === type)
      if (existing) {
        return { ...prev, symptoms: prev.symptoms.filter((s) => s.type !== type) }
      }
      return { ...prev, symptoms: [...prev.symptoms, { type, severity: 'mild' as SymptomSeverity }] }
    })
  }

  const setSeverity = (type: SymptomType, severity: SymptomSeverity) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.map((s) => (s.type === type ? { ...s, severity } : s)),
    }))
  }

  useEffect(() => {
    // Seed demo entries if none exist
    if (entries.length === 0) {
      const demo: JournalEntry[] = [
        {
          id: 'seed-1',
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          notes: 'Slight cramps in the morning. Overall a good day, felt energetic after yoga.',
          symptoms: [{ type: 'cramps', severity: 'mild' as SymptomSeverity }],
          energyLevel: 8,
          painLevel: 2,
        },
        {
          id: 'seed-2',
          date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
          notes: 'Productive day! Drank 9 glasses of water, slept well.',
          symptoms: [
            { type: 'fatigue', severity: 'mild' as SymptomSeverity },
            { type: 'bloating', severity: 'moderate' as SymptomSeverity },
          ],
          energyLevel: 7,
          painLevel: 3,
        },
      ]
      demo.forEach((e) => addJournalEntry(e))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayEntry = entries.find((e) => e.date === selectedDate)

  const handleAdd = () => {
    setEditingEntry(todayEntry || null)
    setFormData({
      notes: todayEntry?.notes || '',
      symptoms: todayEntry?.symptoms || [],
      energyLevel: todayEntry?.energyLevel ?? 5,
      painLevel: todayEntry?.painLevel ?? 0,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, formData)
    } else {
      addJournalEntry({
        id: Date.now().toString(),
        date: selectedDate,
        notes: formData.notes,
        symptoms: formData.symptoms,
        energyLevel: formData.energyLevel,
        painLevel: formData.painLevel,
      })
    }
    setShowModal(false)
  }

  const filteredEntries = useMemo(() => {
    let list = [...entries].sort((a, b) => b.date.localeCompare(a.date))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((e) => e.notes.toLowerCase().includes(q))
    }
    if (filterSymptom !== 'all') {
      list = list.filter((e) => e.symptoms.some((s) => s.type === filterSymptom))
    }
    return list
  }, [entries, searchQuery, filterSymptom])

  // Summary stats
  const last7Entries = entries
    .filter((e) => {
      const daysAgo = Math.ceil(
        (new Date(selectedDate).getTime() - new Date(e.date).getTime()) / 86400000
      )
      return daysAgo >= 0 && daysAgo < 7
    })
  const avgEnergy = last7Entries.length
    ? Math.round(last7Entries.reduce((s, e) => s + e.energyLevel, 0) / last7Entries.length)
    : 0
  const avgPain = last7Entries.length
    ? Math.round(last7Entries.reduce((s, e) => s + e.painLevel, 0) / last7Entries.length)
    : 0
  const topSymptoms = useMemo(() => {
    const counts: Record<string, number> = {}
    entries.forEach((e) => e.symptoms.forEach((s) => (counts[s.type] = (counts[s.type] || 0) + 1)))
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [entries])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  }

  const severityColors: Record<SymptomSeverity, string> = {
    mild: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    severe: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-200/15 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '3s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <BackToHomeButton />
              <div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Health Journal
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Document your wellness journey
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>

          {/* Date Picker & Today Entry */}
          <motion.div
            variants={itemVariants}
            className="grid lg:grid-cols-3 gap-6 mb-8"
          >
            {/* Date & Quick Entry */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-100/50 border border-gray-50">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-teal-400 to-emerald-500 opacity-10 rounded-full blur-3xl -mt-16 -mr-16" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-teal-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Select Date</span>
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-3xl lg:text-4xl font-black text-gray-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl px-2 py-1 -mx-2 cursor-pointer"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-teal-200/50 hover:shadow-2xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {todayEntry ? 'Edit Today\'s Entry' : 'Write Today\'s Entry'}
                  </motion.button>
                </div>

                <AnimatePresence mode="wait">
                  {todayEntry ? (
                    <motion.div
                      key="has-entry"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Today's Notes</span>
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed">
                          {todayEntry.notes || (
                            <span className="text-gray-400 italic">No notes written yet. Click the button above to add some!</span>
                          )}
                        </p>
                      </div>

                      {todayEntry.symptoms.length > 0 && (
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Logged Symptoms</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {todayEntry.symptoms.map((s) => {
                              const opt = SYMPTOM_OPTIONS.find((o) => o.type === s.type)
                              return (
                                <span
                                  key={s.type}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border ${severityColors[s.severity]}`}
                                >
                                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${opt?.color || 'from-gray-400 to-gray-500'}`} />
                                  {opt?.label}
                                  <span className="text-xs opacity-75 capitalize">({s.severity})</span>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-entry"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 rounded-2xl bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border border-dashed border-teal-200"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-teal-500" />
                      </div>
                      <p className="text-gray-600 font-semibold mb-1">No entry for this day</p>
                      <p className="text-sm text-gray-400">Start tracking how you feel today</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="space-y-5">
              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-teal-100/40 border border-teal-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Avg Energy (7d)</span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <motion.span
                    key={avgEnergy}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-black text-gray-800"
                  >
                    {avgEnergy}
                  </motion.span>
                  <span className="text-lg text-gray-400 mb-1">/ 10</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avgEnergy * 10}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-rose-100/40 border border-rose-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-md">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Avg Pain (7d)</span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <motion.span
                    key={avgPain}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-black text-gray-800"
                  >
                    {avgPain}
                  </motion.span>
                  <span className="text-lg text-gray-400 mb-1">/ 10</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avgPain * 10}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      avgPain <= 3 ? 'from-green-400 to-emerald-500' : avgPain <= 6 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500'
                    }`}
                  />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-violet-100/40 border border-violet-50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white shadow-md">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Top Symptoms</span>
                </div>
                {topSymptoms.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {topSymptoms.map(([type, count], i) => {
                      const opt = SYMPTOM_OPTIONS.find((o) => o.type === type)
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${opt?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xs font-black`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{opt?.label}</p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full bg-gradient-to-r ${opt?.color || 'from-gray-400 to-gray-500'}`}
                                style={{ width: `${(count / Math.max(...topSymptoms.map(([, c]) => c))) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-black text-gray-600">{count}x</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Past Entries */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden"
          >
            <div className="p-6 sm:p-7 border-b border-gray-50 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-200">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Journal History</h3>
                  <p className="text-sm text-gray-500">{filteredEntries.length} total entries</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white font-medium text-sm transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
                  <Filter className="w-4 h-4 ml-2 text-gray-500" />
                  <select
                    value={filterSymptom}
                    onChange={(e) => setFilterSymptom(e.target.value as SymptomType | 'all')}
                    className="bg-transparent px-3 py-2 rounded-xl text-sm font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="all">All Symptoms</option>
                    {SYMPTOM_OPTIONS.map((o) => (
                      <option key={o.type} value={o.type}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <AnimatePresence mode="popLayout">
                {filteredEntries.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-14"
                  >
                    <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-teal-100 via-emerald-100 to-cyan-100 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-teal-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">
                      {searchQuery || filterSymptom !== 'all' ? 'No matching entries' : 'Your journal is ready'}
                    </h4>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      {searchQuery || filterSymptom !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Start documenting how you feel each day to spot patterns over time.'}
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ x: 4 }}
                        className="relative p-6 rounded-3xl bg-gradient-to-r from-white via-gray-50/50 to-white border border-gray-100 hover:shadow-xl hover:border-teal-100 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
                          <div className="flex-shrink-0 flex lg:flex-col items-center gap-3 lg:gap-2 lg:pr-5 lg:border-r border-gray-100">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                              <span className="text-2xl font-black">
                                {new Date(entry.date + 'T00:00:00').getDate()}
                              </span>
                            </div>
                            <div className="lg:text-center">
                              <p className="text-xs font-bold uppercase tracking-wider text-teal-600">
                                {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', weekday: 'short' })}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {entry.date === new Date().toISOString().split('T')[0] ? 'Today' :
                                  `${Math.ceil((new Date().getTime() - new Date(entry.date + 'T00:00:00').getTime()) / 86400000)}d ago`}
                              </p>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-3">
                            {entry.notes && (
                              <p className="text-gray-800 font-medium leading-relaxed">
                                {entry.notes}
                              </p>
                            )}
                            {entry.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {entry.symptoms.map((s) => {
                                  const opt = SYMPTOM_OPTIONS.find((o) => o.type === s.type)
                                  return (
                                    <span
                                      key={s.type}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs border ${severityColors[s.severity]}`}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${opt?.color || ''}`} />
                                      {opt?.label}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-cyan-500" />
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{ width: `${entry.energyLevel * 10}%` }} />
                                </div>
                                <span className="text-xs font-bold text-gray-600">E{entry.energyLevel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-rose-500" />
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${
                                      entry.painLevel <= 3 ? 'from-green-400 to-emerald-500' : entry.painLevel <= 6 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500'
                                    }`}
                                    style={{ width: `${entry.painLevel * 10}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-600">P{entry.painLevel}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setEditingEntry(entry)
                                setSelectedDate(entry.date)
                                setFormData({
                                  notes: entry.notes,
                                  symptoms: entry.symptoms,
                                  energyLevel: entry.energyLevel,
                                  painLevel: entry.painLevel,
                                })
                                setShowModal(true)
                              }}
                              className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => deleteJournalEntry(entry.id)}
                              className="p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', stiffness: 250, damping: 25 }}
              className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-full sm:max-w-2xl max-h-[100vh] sm:max-h-[92vh] overflow-y-auto z-50 bg-white sm:rounded-3xl sm:shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-800">
                      {editingEntry ? 'Edit Journal Entry' : '✨ How Are You Feeling Today?'}
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-500" />
                        Daily Notes
                      </div>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white font-medium transition-all resize-none placeholder:text-gray-400"
                      placeholder="How was your day? What did you eat? Any notable feelings or events?"
                      rows={4}
                    />
                  </div>

                  {/* Energy Slider */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-cyan-500" />
                        <span className="font-bold text-gray-800">Energy Level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-cyan-600">
                          {formData.energyLevel <= 3 ? 'Low' : formData.energyLevel <= 6 ? 'Medium' : 'High'}
                        </span>
                        <motion.span
                          key={formData.energyLevel}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-black bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent min-w-[3ch] text-right"
                        >
                          {formData.energyLevel}
                        </motion.span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={formData.energyLevel}
                      onChange={(e) => setFormData({ ...formData, energyLevel: Number(e.target.value) })}
                      className="w-full h-3 bg-white rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between mt-2 text-xs font-bold text-gray-400">
                      <span>0 Exhausted</span>
                      <span>5 Okay</span>
                      <span>10 Energized</span>
                    </div>
                  </div>

                  {/* Pain Slider */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500" />
                        <span className="font-bold text-gray-800">Pain / Discomfort Level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-rose-600">
                          {formData.painLevel <= 3 ? 'None' : formData.painLevel <= 6 ? 'Moderate' : 'Severe'}
                        </span>
                        <motion.span
                          key={formData.painLevel}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`text-3xl font-black min-w-[3ch] text-right bg-gradient-to-r ${
                            formData.painLevel <= 3 ? 'from-green-500 to-emerald-600' : formData.painLevel <= 6 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
                          } bg-clip-text text-transparent`}
                        >
                          {formData.painLevel}
                        </motion.span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={formData.painLevel}
                      onChange={(e) => setFormData({ ...formData, painLevel: Number(e.target.value) })}
                      className="w-full h-3 bg-white rounded-full appearance-none cursor-pointer accent-rose-500"
                    />
                    <div className="flex justify-between mt-2 text-xs font-bold text-gray-400">
                      <span>0 No Pain</span>
                      <span>5 Manageable</span>
                      <span>10 Unbearable</span>
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-violet-500" />
                      <span className="font-bold text-gray-800">Symptoms Today</span>
                      <AlertCircle className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
                      {SYMPTOM_OPTIONS.map((opt) => {
                        const selected = formData.symptoms.some((s) => s.type === opt.type)
                        return (
                          <motion.button
                            key={opt.type}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleSymptom(opt.type)}
                            className={`relative p-3 rounded-2xl border-2 font-bold text-sm transition-all text-left ${
                              selected
                                ? `border-transparent bg-gradient-to-br ${opt.color} text-white shadow-lg`
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt.label}</span>
                              {selected && <Check className="w-4 h-4 flex-shrink-0" />}
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                    {formData.symptoms.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-3">
                          Set Severity
                        </p>
                        <div className="space-y-2">
                          {formData.symptoms.map((s) => {
                            const opt = SYMPTOM_OPTIONS.find((o) => o.type === s.type)
                            return (
                              <div key={s.type} className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-violet-100">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${opt?.color || ''} flex items-center justify-center text-white flex-shrink-0`}>
                                  <Check className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-gray-800 flex-1">{opt?.label}</span>
                                <div className="flex gap-1">
                                  {(['mild', 'moderate', 'severe'] as SymptomSeverity[]).map((sev) => (
                                    <button
                                      key={sev}
                                      type="button"
                                      onClick={() => setSeverity(s.type, sev)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                                        s.severity === sev
                                          ? severityColors[sev] + ' shadow-sm'
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {sev}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-[2] py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-white rounded-2xl font-black shadow-xl shadow-teal-200/50 hover:shadow-2xl"
                    >
                      {editingEntry ? '💾 Save Entry' : '✨ Save Today\'s Entry'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
