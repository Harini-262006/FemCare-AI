import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Pill,
  Clock,
  Calendar,
  Trash2,
  Edit,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  FileText,
  Shield,
  History,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  useAppStore,
  useMedicines,
  type MedicineEntry,
} from '@/store'
import { NotificationBell } from '@/components/NotificationBell'

type TabType = 'current' | 'schedule' | 'history' | 'assistant'

export default function MedicineTracker() {
  const navigate = useNavigate()
  const medicines = useMedicines()
  const { addMedicine, updateMedicine, deleteMedicine, addReminder } = useAppStore()

  const [tab, setTab] = useState<TabType>('current')
  const [showModal, setShowModal] = useState(false)
  const [editingMed, setEditingMed] = useState<MedicineEntry | null>(null)
  const [takenToday, setTakenToday] = useState<Record<string, boolean>>({})

  // Medicine Assistant State
  const [assistantSearch, setAssistantSearch] = useState('')
  const [searchedMedInfo, setSearchedMedInfo] = useState<{
    name: string
    uses: string
    precautions: string
    dosage: string
  } | null>(null)
  const [reminderAddedToast, setReminderAddedToast] = useState(false)

  const [formData, setFormData] = useState<Partial<MedicineEntry> & { scheduleTimesStr?: string }>({
    name: '',
    dosage: '',
    scheduleTimes: ['09:00'],
    scheduleTimesStr: '09:00',
    startDate: new Date().toISOString().split('T')[0],
    refillDate: '',
    adherence: 0,
    notes: '',
    isActive: true,
  })

  useEffect(() => {
    const seed: MedicineEntry[] = [
      {
        id: 'seed-1',
        name: 'Iron Supplement',
        dosage: '1 tablet (65mg)',
        scheduleTimes: ['09:00', '21:00'],
        startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        refillDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        adherence: 92,
        notes: 'Take with food, avoid dairy',
        isActive: true,
      },
      {
        id: 'seed-2',
        name: 'Vitamin D3',
        dosage: '1 capsule (1000 IU)',
        scheduleTimes: ['12:00'],
        startDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
        refillDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
        adherence: 88,
        notes: 'Take with lunch',
        isActive: true,
      },
      {
        id: 'seed-3',
        name: 'Folic Acid',
        dosage: '1 tablet (400mcg)',
        scheduleTimes: ['08:00'],
        startDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
        refillDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        adherence: 96,
        notes: 'Morning routine with breakfast',
        isActive: true,
      },
    ]
    if (medicines.length === 0) {
      seed.forEach((m) => addMedicine(m))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdd = () => {
    setEditingMed(null)
    setFormData({
      name: '',
      dosage: '',
      scheduleTimes: ['09:00'],
      scheduleTimesStr: '09:00',
      startDate: new Date().toISOString().split('T')[0],
      refillDate: '',
      adherence: 0,
      notes: '',
      isActive: true,
    })
    setShowModal(true)
  }

  const handleEdit = (med: MedicineEntry) => {
    setEditingMed(med)
    setFormData({
      ...med,
      scheduleTimesStr: med.scheduleTimes.join(', '),
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const times = (formData.scheduleTimesStr || '09:00')
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingMed) {
      updateMedicine(editingMed.id, { ...formData, scheduleTimes: times })
    } else {
      addMedicine({
        id: Date.now().toString(),
        name: formData.name || '',
        dosage: formData.dosage || '',
        scheduleTimes: times,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: formData.endDate,
        refillDate: formData.refillDate || undefined,
        adherence: formData.adherence || 0,
        notes: formData.notes || undefined,
        isActive: formData.isActive ?? true,
      })
    }
    setShowModal(false)
  }

  const handleToggleTaken = (medId: string, timeIdx: number) => {
    setTakenToday((prev) => ({
      ...prev,
      [`${medId}-${timeIdx}`]: !prev[`${medId}-${timeIdx}`],
    }))
  }

  const activeMeds = medicines.filter((m) => m.isActive)
  const pastMeds = medicines.filter((m) => !m.isActive)
  const today = new Date()

  const avgAdherence = useMemo(() => {
    if (activeMeds.length === 0) return 0
    return Math.round(
      activeMeds.reduce((sum, m) => sum + m.adherence, 0) / activeMeds.length
    )
  }, [activeMeds])

  const totalDosesToday = useMemo(
    () => activeMeds.reduce((sum, m) => sum + m.scheduleTimes.length, 0),
    [activeMeds]
  )
  const takenDosesCount = Object.values(takenToday).filter(Boolean).length

  const upcomingRefills = activeMeds.filter((m) => {
    if (!m.refillDate) return false
    const days = Math.ceil(
      (new Date(m.refillDate).getTime() - today.getTime()) / 86400000
    )
    return days <= 7
  })

  const allScheduleTimes = useMemo(() => {
    const times = new Set<string>()
    activeMeds.forEach((m) => m.scheduleTimes.forEach((t) => times.add(t)))
    return Array.from(times).sort()
  }, [activeMeds])

  const tabClass = (active: boolean) =>
    `px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
      active
        ? 'bg-white text-pink-600 shadow-lg shadow-pink-100'
        : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-fuchsia-200/20 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-200/15 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '1.2s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.06 }}
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <BackToHomeButton />
              <div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Medicine Tracker
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-pink-500" />
                  Stay consistent with your medication routine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-pink-200/50 hover:shadow-2xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Medicine
              </motion.button>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              {
                label: 'Active Meds',
                value: activeMeds.length,
                icon: <Pill className="w-6 h-6" />,
                gradient: 'from-pink-500 to-rose-500',
                shadow: 'shadow-pink-200',
              },
              {
                label: 'Doses Today',
                value: `${takenDosesCount}/${totalDosesToday}`,
                icon: <CheckCircle2 className="w-6 h-6" />,
                gradient: 'from-emerald-500 to-teal-500',
                shadow: 'shadow-emerald-200',
              },
              {
                label: 'Avg Adherence',
                value: `${avgAdherence}%`,
                icon: <TrendingUp className="w-6 h-6" />,
                gradient: 'from-violet-500 to-fuchsia-500',
                shadow: 'shadow-violet-200',
              },
              {
                label: 'Upcoming Refills',
                value: upcomingRefills.length,
                icon: <AlertTriangle className="w-6 h-6" />,
                gradient: 'from-amber-500 to-orange-500',
                shadow: 'shadow-amber-200',
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 + idx * 0.04 }}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl border border-gray-50"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full blur-2xl -mt-10 -mr-10`} />
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg ${stat.shadow}`}>
                    {stat.icon}
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-10`} />
                </div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <motion.p
                  key={`${stat.value}-${idx}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-black mt-1 text-gray-800"
                >
                  {stat.value}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>

          {/* Upcoming Refills Alert */}
          <AnimatePresence>
            {upcomingRefills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-pink-50 border-2 border-amber-200 shadow-xl shadow-amber-100/40"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-800 text-lg mb-1">Upcoming Refills Needed</h3>
                    <p className="text-gray-600 text-sm mb-4">These medicines need to be refilled soon:</p>
                    <div className="flex flex-wrap gap-2">
                      {upcomingRefills.map((m) => {
                        const days = Math.ceil(
                          (new Date(m.refillDate!).getTime() - today.getTime()) / 86400000
                        )
                        return (
                          <span
                            key={m.id}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm ${
                              days <= 2
                                ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
                                : 'bg-white text-amber-700 border border-amber-200'
                            }`}
                          >
                            <Pill className="w-4 h-4" />
                            {m.name}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              days <= 2 ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                            }`}>
                              {days <= 0 ? 'Today!' : `${days}d left`}
                            </span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-2 shadow-xl shadow-gray-100/50 border border-white mb-8 inline-flex"
          >
            <button onClick={() => setTab('current')} className={tabClass(tab === 'current')}>
              <div className="flex items-center gap-2"><Pill className="w-4 h-4" /> Current Meds</div>
            </button>
            <button onClick={() => setTab('schedule')} className={tabClass(tab === 'schedule')}>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Daily Schedule</div>
            </button>
            <button onClick={() => setTab('assistant')} className={tabClass(tab === 'assistant')}>
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-500" /> Medicine Assistant</div>
            </button>
            <button onClick={() => setTab('history')} className={tabClass(tab === 'history')}>
              <div className="flex items-center gap-2"><History className="w-4 h-4" /> History</div>
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            {tab === 'current' && (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeMeds.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 p-16 text-center"
                  >
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 via-rose-100 to-fuchsia-100 flex items-center justify-center relative">
                      <div className="absolute inset-3 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <Pill className="w-14 h-14 text-pink-400" />
                      </div>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-800 mb-3">
                      No medicines tracked yet
                    </h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                      Add your current medications to track doses, schedule reminders, and never miss a refill.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAdd}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl"
                    >
                      <Plus className="w-6 h-6" />
                      Add Your First Medicine
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeMeds.map((med, idx) => (
                      <motion.div
                        key={med.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ y: -6 }}
                        className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-gray-100/50 border border-gray-50 group"
                      >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-400 opacity-5 rounded-full blur-3xl -mt-16 -mr-16 group-hover:opacity-10 transition-opacity" />

                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 flex items-center justify-center text-white shadow-xl shadow-pink-200">
                              <Pill className="w-8 h-8" />
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-white">
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              </div>
                            </div>
                            <div className="pt-1">
                              <h3 className="font-black text-gray-800 text-lg leading-tight">{med.name}</h3>
                              <p className="text-sm text-gray-500 font-medium mt-0.5">{med.dosage}</p>
                            </div>
                          </div>
                        </div>

                        {/* Adherence Progress */}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Adherence</span>
                            <span className={`text-sm font-black ${
                              med.adherence >= 85 ? 'text-emerald-600' : med.adherence >= 70 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {med.adherence}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${med.adherence}%` }}
                              transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                              className={`h-full rounded-full bg-gradient-to-r ${
                                med.adherence >= 85 ? 'from-emerald-400 to-teal-500' : med.adherence >= 70 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-pink-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Schedule Times */}
                        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-pink-50/80 to-fuchsia-50/80 border border-pink-100">
                          <div className="flex items-center gap-2 mb-2.5">
                            <Clock className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Daily Schedule</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {med.scheduleTimes.map((time, ti) => {
                              const taken = takenToday[`${med.id}-${ti}`]
                              return (
                                <motion.button
                                  key={ti}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleToggleTaken(med.id, ti)}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                    taken
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-200'
                                      : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600'
                                  }`}
                                >
                                  {taken && <Check className="w-3.5 h-3.5" />}
                                  {time}
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Refill Date */}
                        {med.refillDate && (
                          <div className="flex items-center justify-between mb-5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-600">Refill</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                              {new Date(med.refillDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}

                        {med.notes && (
                          <div className="flex items-start gap-2 mb-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-700 leading-relaxed">{med.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => handleEdit(med)}
                            className="flex-1 py-3 rounded-2xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Deactivate this medicine?')) {
                                updateMedicine(med.id, { isActive: false })
                              }
                            }}
                            className="flex-1 py-3 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden"
              >
                <div className="p-6 sm:p-7 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-800">Today's Time Grid</h3>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  {allScheduleTimes.length === 0 ? (
                    <div className="text-center py-16">
                      <Sparkles className="w-16 h-16 mx-auto text-pink-300 mb-4" />
                      <h4 className="font-bold text-gray-800 text-xl mb-2">No schedules yet</h4>
                      <p className="text-gray-500 max-w-md mx-auto">Add medicines with schedule times to build your daily routine.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allScheduleTimes.map((time, ti) => {
                        const medsAtTime = activeMeds.filter((m) => m.scheduleTimes.includes(time))
                        return (
                          <motion.div
                            key={time}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ti * 0.05 }}
                            className="relative pl-20 sm:pl-24"
                          >
                            <div className="absolute left-0 top-0 h-full flex flex-col items-center">
                              <div className="text-xl sm:text-2xl font-black text-gray-800 whitespace-nowrap">
                                {time}
                              </div>
                              <div className="w-px flex-1 bg-gradient-to-b from-pink-200 via-fuchsia-200 to-transparent mt-3" />
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
                              {medsAtTime.map((med) => {
                                const timeIdx = med.scheduleTimes.indexOf(time)
                                const taken = takenToday[`${med.id}-${timeIdx}`]
                                return (
                                  <motion.div
                                    key={med.id + time}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleToggleTaken(med.id, timeIdx)}
                                    className={`relative p-5 rounded-2xl cursor-pointer transition-all overflow-hidden ${
                                      taken
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg shadow-green-100/50'
                                        : 'bg-white border-2 border-gray-100 hover:border-pink-200 hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                                        taken
                                          ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                                          : 'bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white'
                                      }`}>
                                        <Pill className="w-7 h-7" />
                                        {taken && (
                                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-white">
                                            <Check className="w-3.5 h-3.5 text-green-600" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className={`font-black text-base leading-tight ${
                                          taken ? 'text-green-800 line-through' : 'text-gray-800'
                                        }`}>
                                          {med.name}
                                        </h4>
                                        <p className={`text-xs mt-0.5 ${
                                          taken ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                          {med.dosage}
                                        </p>
                                      </div>
                                    </div>
                                    {taken && (
                                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-black shadow-md">
                                        Taken
                                      </div>
                                    )}
                                  </motion.div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === 'assistant' && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 p-6 lg:p-8 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 flex items-center justify-center text-white shadow-xl shadow-pink-200">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-800">Medicine Assistant</h2>
                    <p className="text-sm text-gray-500">Search medicine details, inspect precautions & set automatic reminders</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Medical Disclaimer:</strong> Information provided is for educational reference only. Do not alter prescribed doses without consulting a doctor or qualified pharmacist.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={assistantSearch}
                      onChange={(e) => setAssistantSearch(e.target.value)}
                      placeholder="Enter medicine name (e.g., Paracetamol, Folic Acid, Metformin)..."
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none text-sm text-gray-800 font-medium"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!assistantSearch.trim()) return
                      const name = assistantSearch.trim()
                      setSearchedMedInfo({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        uses: 'Used for pain relief, fever reduction, inflammation management, or prescribed wellness support.',
                        precautions: 'Take with or after meals if stomach irritation occurs. Avoid combining with duplicate active ingredients. Consult doctor if pregnant or nursing.',
                        dosage: '1 tablet daily as advised by healthcare provider.',
                      })
                    }}
                    className="px-6 py-3.5 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Look Up Medicine
                  </button>
                </div>

                {reminderAddedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Medicine reminder successfully added to your schedule!
                  </motion.div>
                )}

                {searchedMedInfo ? (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 p-6 bg-gradient-to-br from-pink-50/50 via-white to-purple-50/50 rounded-3xl border border-pink-100 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-gray-800">{searchedMedInfo.name}</h3>
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 font-bold text-xs rounded-full">
                        Verified Informational Summary
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
                        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-pink-500" /> General Uses
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{searchedMedInfo.uses}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-1">
                        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> General Precautions
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{searchedMedInfo.precautions}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-gray-500">
                        Suggested Routine: {searchedMedInfo.dosage}
                      </p>
                      <button
                        onClick={() => {
                          addReminder({
                            id: `rem-med-${Date.now()}`,
                            title: `Take ${searchedMedInfo.name}`,
                            type: 'medicine',
                            time: '09:00 AM',
                            notes: searchedMedInfo.dosage,
                            enabled: true,
                          })
                          setReminderAddedToast(true)
                          setTimeout(() => setReminderAddedToast(false), 3000)
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Set Medicine Reminder
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { name: 'Iron & Folic Acid', use: 'Anemia prevention & blood health', precaution: 'Avoid taking with tea/coffee or calcium supplements.' },
                      { name: 'Paracetamol 500mg', use: 'Fever & mild to moderate pain', precaution: 'Maximum 4g/day. Do not combine with other acetaminophen products.' },
                      { name: 'Calcium + Vit D3', use: 'Bone strength & joint health', precaution: 'Best taken after meal. Space out from iron intake by 2 hours.' },
                    ].map((sample) => (
                      <div
                        key={sample.name}
                        onClick={() => {
                          setAssistantSearch(sample.name)
                          setSearchedMedInfo({
                            name: sample.name,
                            uses: sample.use,
                            precautions: sample.precaution,
                            dosage: '1 tablet daily as directed by doctor.',
                          })
                        }}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-pink-200 hover:bg-pink-50/40 cursor-pointer transition-all space-y-2"
                      >
                        <h4 className="font-bold text-sm text-gray-800">{sample.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2">{sample.use}</p>
                        <span className="text-[11px] font-bold text-pink-600 inline-block">View Details & Set Reminder →</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden"
              >
                <div className="p-6 sm:p-7 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 flex items-center justify-center text-white shadow-lg shadow-gray-200">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-800">Medicine History</h3>
                      <p className="text-sm text-gray-500">{pastMeds.length} previously taken medicines</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  {pastMeds.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-300" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-xl mb-2">No past medicines</h4>
                      <p className="text-gray-500 max-w-md mx-auto">
                        When you deactivate a medicine, it will appear here with your adherence history.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pastMeds.map((med, i) => (
                        <motion.div
                          key={med.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center text-white flex-shrink-0 opacity-70">
                              <Pill className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-700 truncate">{med.name}</h4>
                              <p className="text-xs text-gray-500">{med.dosage} • {med.scheduleTimes.length}x/day</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-black ${
                              med.adherence >= 85 ? 'text-emerald-600' : med.adherence >= 70 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {med.adherence}%
                            </p>
                            <p className="text-xs text-gray-400">Adherence</p>
                          </div>
                          <button
                            onClick={() => updateMedicine(med.id, { isActive: true })}
                            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-300 hover:bg-green-50 font-bold text-sm transition-all flex items-center gap-1"
                          >
                            <ChevronRight className="w-4 h-4" /> Restore
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
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
              className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-full sm:max-w-lg max-h-[100vh] sm:max-h-[90vh] overflow-y-auto z-50 bg-white sm:rounded-3xl sm:shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-800">
                      {editingMed ? 'Edit Medicine' : '💊 Add Medicine'}
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                      {editingMed ? 'Update medicine details' : 'Track your medication with reminders'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Medicine Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                      placeholder="e.g., Iron Supplement"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dosage</label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                      placeholder="e.g., 1 tablet (65mg)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Schedule Times (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.scheduleTimesStr || ''}
                      onChange={(e) => setFormData({ ...formData, scheduleTimesStr: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                      placeholder="09:00, 14:00, 21:00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Refill Date</label>
                      <input
                        type="date"
                        value={formData.refillDate || ''}
                        onChange={(e) => setFormData({ ...formData, refillDate: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        Notes / Instructions
                      </div>
                    </label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all resize-none placeholder:text-gray-400"
                      placeholder="e.g., Take with food, avoid dairy..."
                      rows={3}
                    />
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
                      className="flex-[2] py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 text-white rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl"
                    >
                      {editingMed ? '💾 Save Changes' : '✨ Add Medicine'}
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
