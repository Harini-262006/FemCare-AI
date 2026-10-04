import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Bell,
  Pill,
  Calendar,
  Droplets,
  Dumbbell,
  Activity,
  Utensils,
  Moon,
  Heart,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Clock,
  X,
  Check,
  AlertCircle,
  FileText,
  Repeat,
  Stethoscope,
  Baby,
  ScanLine,
  Leaf,
  Flower2,
  Sparkles,
  Brain,
  Flame,
  BedDouble,
  Monitor,
  Info,
  RefreshCw,
  Save,
  CheckCircle,
} from 'lucide-react'
import {
  useAppStore,
  useProfile,
  useReminders as useStoreReminders,
  type Reminder,
  type ReminderType,
} from '@/store'
import { reminderAPI } from '@/services/api'
import { syncSmartReminders } from '@/services/smartReminderService'
import { playBeep, requestNotificationPermission, showNotification } from '@/hooks/useReminders'
import { NotificationBell } from '@/components/NotificationBell'

type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'
type ViewMode = 'list' | 'calendar'
type FilterType = 'all' | 'smart' | 'manual' | ReminderType
type PermissionState = NotificationPermission | 'not-supported'

const typeIcons: Record<ReminderType, React.ReactNode> = {
  medicine: <Pill className="w-5 h-5" />,
  appointment: <Calendar className="w-5 h-5" />,
  water: <Droplets className="w-5 h-5" />,
  exercise: <Dumbbell className="w-5 h-5" />,
  period: <Activity className="w-5 h-5" />,
  meal: <Utensils className="w-5 h-5" />,
  sleep: <Moon className="w-5 h-5" />,
  'self-care': <Heart className="w-5 h-5" />,
  'prenatal-vitamins': <Baby className="w-5 h-5" />,
  iron: <Pill className="w-5 h-5" />,
  calcium: <Pill className="w-5 h-5" />,
  scan: <ScanLine className="w-5 h-5" />,
  ovulation: <Leaf className="w-5 h-5" />,
  fertility: <Flower2 className="w-5 h-5" />,
  yoga: <Sparkles className="w-5 h-5" />,
  meditation: <Brain className="w-5 h-5" />,
  'doctor-appointment': <Stethoscope className="w-5 h-5" />,
  'scan-appointment': <Monitor className="w-5 h-5" />,
  'menstrual-reminder': <Activity className="w-5 h-5" />,
  'ovulation-reminder': <Leaf className="w-5 h-5" />,
  'fertility-reminder': <Flower2 className="w-5 h-5" />,
  'workout-reminder': <Flame className="w-5 h-5" />,
  'yoga-reminder': <Sparkles className="w-5 h-5" />,
  'meditation-reminder': <Brain className="w-5 h-5" />,
  'sleep-reminder': <BedDouble className="w-5 h-5" />,
}

const typeColors: Record<ReminderType, { gradient: string; bg: string; text: string; light: string }> = {
  medicine: { gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50' },
  appointment: { gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  water: { gradient: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
  exercise: { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
  period: { gradient: 'from-purple-500 to-violet-500', bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
  meal: { gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  sleep: { gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50' },
  'self-care': { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50' },
  'prenatal-vitamins': { gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' },
  iron: { gradient: 'from-red-500 to-rose-600', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
  calcium: { gradient: 'from-sky-400 to-blue-500', bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50' },
  scan: { gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-500', text: 'text-slate-600', light: 'bg-slate-50' },
  ovulation: { gradient: 'from-teal-400 to-emerald-500', bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
  fertility: { gradient: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', light: 'bg-fuchsia-50' },
  yoga: { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50' },
  meditation: { gradient: 'from-blue-400 to-cyan-500', bg: 'bg-blue-400', text: 'text-blue-600', light: 'bg-blue-50' },
  'doctor-appointment': { gradient: 'from-emerald-600 to-green-700', bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50' },
  'scan-appointment': { gradient: 'from-gray-600 to-slate-700', bg: 'bg-gray-600', text: 'text-gray-700', light: 'bg-gray-50' },
  'menstrual-reminder': { gradient: 'from-pink-600 to-purple-600', bg: 'bg-pink-600', text: 'text-pink-700', light: 'bg-pink-50' },
  'ovulation-reminder': { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
  'fertility-reminder': { gradient: 'from-pink-500 to-fuchsia-600', bg: 'bg-fuchsia-600', text: 'text-fuchsia-700', light: 'bg-fuchsia-50' },
  'workout-reminder': { gradient: 'from-orange-600 to-red-500', bg: 'bg-orange-600', text: 'text-orange-700', light: 'bg-orange-50' },
  'yoga-reminder': { gradient: 'from-purple-500 to-indigo-600', bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50' },
  'meditation-reminder': { gradient: 'from-cyan-600 to-blue-700', bg: 'bg-cyan-600', text: 'text-cyan-700', light: 'bg-cyan-50' },
  'sleep-reminder': { gradient: 'from-indigo-600 to-violet-700', bg: 'bg-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-50' },
}

const typeLabels: Record<ReminderType, string> = {
  medicine: 'Medicine',
  appointment: 'Appointment',
  water: 'Water',
  exercise: 'Exercise',
  period: 'Period',
  meal: 'Meal',
  sleep: 'Sleep',
  'self-care': 'Self Care',
  'prenatal-vitamins': 'Prenatal',
  iron: 'Iron',
  calcium: 'Calcium',
  scan: 'Scan',
  ovulation: 'Ovulation',
  fertility: 'Fertility',
  yoga: 'Yoga',
  meditation: 'Meditation',
  'doctor-appointment': 'Doctor',
  'scan-appointment': 'Scan Appt',
  'menstrual-reminder': 'Menstrual',
  'ovulation-reminder': 'Ovulation R',
  'fertility-reminder': 'Fertility R',
  'workout-reminder': 'Workout',
  'yoga-reminder': 'Yoga R',
  'meditation-reminder': 'Meditation R',
  'sleep-reminder': 'Sleep R',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Reminders() {
  const navigate = useNavigate()
  const profile = useProfile()
  const reminders = useStoreReminders()
  const { addReminder, setReminders, updateReminder, deleteReminder } = useAppStore()
  const storeUser = useAppStore((state) => state.user)

  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [formData, setFormData] = useState<Partial<Reminder & {
    description?: string
    medicineName?: string
    dosage?: string
    recurrence?: RecurrenceType
    completed?: boolean
    completedDates?: string[]
  }>>({
    title: '',
    type: 'medicine',
    time: '09:00',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    enabled: true,
    description: '',
    medicineName: '',
    dosage: '',
    recurrence: 'daily',
    completed: false,
    completedDates: [],
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('default')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [completedReminders, setCompletedReminders] = useState<Set<string>>(new Set())
  const [isSyncing, setIsSyncing] = useState(false)
  const scheduledTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // 1. Fetch remote backend reminders on mount and merge with local
  useEffect(() => {
    const loadBackendReminders = async () => {
      if (!storeUser?.token) return
      try {
        const backendReminders = await reminderAPI.getReminders()
        if (Array.isArray(backendReminders)) {
          const mappedBackend: Reminder[] = backendReminders.map((br: any) => ({
            id: br._id || br.id,
            title: br.title,
            type: br.type as ReminderType,
            time: br.time,
            date: br.date,
            notes: br.notes || '',
            recurrence: (br.recurrence as RecurrenceType) || 'daily',
            enabled: br.enabled !== undefined ? br.enabled : true,
            completedDates: br.completedDates || [],
            category: br.category || 'manual',
            isSmart: br.isSmart || false,
            smartKey: br.smartKey,
            smartPurpose: br.smartPurpose,
          }))

          // Merge backend reminders with store
          const currentSmart = reminders.filter(r => r.isSmart || r.category === 'smart')
          const manualFromBackend = mappedBackend.filter(r => !r.isSmart && r.category !== 'smart')
          
          const mergedMap = new Map<string, Reminder>()
          currentSmart.forEach(r => mergedMap.set(r.id, r))
          manualFromBackend.forEach(r => mergedMap.set(r.id, r))
          
          const mergedList = Array.from(mergedMap.values())
          const { reminders: synced } = syncSmartReminders(mergedList, profile)
          setReminders(synced)
        }
      } catch (err) {
        console.warn('Could not fetch backend reminders, using local store:', err)
      }
    }
    loadBackendReminders()
  }, [storeUser?.token])

  // 2. Idempotently sync smart reminders when profile changes
  useEffect(() => {
    const { reminders: synced, hasChanges } = syncSmartReminders(reminders, profile)
    if (hasChanges || (synced.length > 0 && reminders.length === 0)) {
      setReminders(synced)
    }
  }, [profile])

  useEffect(() => {
    setPermissionStatus('granted')
  }, [])

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showModal])

  useEffect(() => {
    return () => {
      scheduledTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      scheduledTimeoutsRef.current.clear()
    }
  }, [])

  const scheduleReminderNotification = (reminder: Reminder) => {
    if (!reminder.enabled) return
    if (!reminder.date || !reminder.time) return

    const [hours, minutes] = reminder.time.split(':').map(Number)
    const targetDate = new Date(reminder.date)
    targetDate.setHours(hours, minutes, 0, 0)

    const now = new Date()
    const delay = targetDate.getTime() - now.getTime()

    if (delay <= 0) return

    if (scheduledTimeoutsRef.current.has(reminder.id)) {
      clearTimeout(scheduledTimeoutsRef.current.get(reminder.id)!)
    }

    const timeoutId = setTimeout(() => {
      playBeep()
      showNotification('FemCare Reminder', reminder.title)
      scheduledTimeoutsRef.current.delete(reminder.id)
    }, delay)

    scheduledTimeoutsRef.current.set(reminder.id, timeoutId)
  }

  const handleManualSync = () => {
    setIsSyncing(true)
    const { reminders: synced } = syncSmartReminders(reminders, profile)
    setReminders(synced)
    showToast('Smart reminders synchronized with your latest health profile!')
    setTimeout(() => setIsSyncing(false), 600)
  }

  const handleAdd = () => {
    setEditingReminder(null)
    setFormError(null)
    const today = selectedDate || new Date().toISOString().split('T')[0]
    setFormData({
      title: '',
      type: 'medicine',
      time: '09:00',
      date: today,
      notes: '',
      enabled: true,
      description: '',
      medicineName: '',
      dosage: '',
      recurrence: 'daily',
      completed: false,
      completedDates: [],
      category: 'manual',
      isSmart: false,
    })
    setShowModal(true)
  }

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setFormError(null)
    setFormData({
      ...reminder,
      recurrence: (reminder.recurrence as RecurrenceType) || 'daily',
    })
    setShowModal(true)
  }

  const handleQuickTimeChange = async (id: string, time: string) => {
    updateReminder(id, { time })
    if (id.length > 10 && !id.startsWith('smart-') && storeUser?.token) {
      try {
        await reminderAPI.updateReminder(id, { time })
      } catch (err) {
        console.error('Failed to update time on backend:', err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title || !formData.title.trim()) {
      setFormError('Please enter a reminder title')
      return
    }
    if (!formData.time) {
      setFormError('Please select a reminder time')
      return
    }

    setIsSubmitting(true)
    let reminderId: string
    const recurrence = (formData.recurrence as RecurrenceType) || 'daily'

    try {
      if (editingReminder) {
        reminderId = editingReminder.id
        const updatedData: Reminder = {
          ...editingReminder,
          title: formData.title.trim(),
          type: (formData.type as ReminderType) || editingReminder.type || 'medicine',
          time: formData.time,
          date: formData.date || editingReminder.date,
          notes: formData.notes?.trim() || '',
          recurrence,
          enabled: formData.enabled !== undefined ? formData.enabled : editingReminder.enabled,
        }

        updateReminder(editingReminder.id, updatedData)

        if (permissionStatus === 'granted') {
          scheduleReminderNotification(updatedData)
        }

        if (editingReminder.id.length > 10 && !editingReminder.id.startsWith('smart-') && storeUser?.token) {
          try {
            await reminderAPI.updateReminder(editingReminder.id, {
              title: updatedData.title,
              type: updatedData.type,
              time: updatedData.time,
              date: updatedData.date,
              notes: updatedData.notes,
              recurrence: updatedData.recurrence,
              enabled: updatedData.enabled,
            })
          } catch (err) {
            console.error('Failed to update reminder on backend:', err)
          }
        }

        showToast('Reminder updated successfully!')
      } else {
        reminderId = Date.now().toString()
        const newReminder: Reminder = {
          id: reminderId,
          title: formData.title.trim(),
          type: (formData.type as ReminderType) || 'medicine',
          time: formData.time,
          date: formData.date || new Date().toISOString().split('T')[0],
          notes: formData.notes?.trim() || '',
          recurrence,
          enabled: formData.enabled ?? true,
          category: 'manual',
          isSmart: false,
        }

        addReminder(newReminder)

        if (permissionStatus === 'granted') {
          scheduleReminderNotification(newReminder)
        }

        if (storeUser?.token) {
          try {
            const created = await reminderAPI.createReminder({
              title: newReminder.title,
              type: newReminder.type,
              time: newReminder.time,
              date: newReminder.date,
              notes: newReminder.notes,
              recurrence: newReminder.recurrence,
              enabled: newReminder.enabled,
            })
            if (created && created._id) {
              updateReminder(reminderId, { id: created._id })
            }
          } catch (err) {
            console.error('Failed to create reminder on backend:', err)
          }
        }

        showToast('Manual reminder set successfully!')
      }

      setShowModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = (reminderId: string) => {
    setCompletedReminders((prev) => {
      const next = new Set(prev)
      if (next.has(reminderId)) {
        next.delete(reminderId)
      } else {
        next.add(reminderId)
      }
      return next
    })
  }

  const handleDeleteReminder = async (id: string) => {
    deleteReminder(id)
    showToast('Reminder deleted')
    if (id.length > 10 && !id.startsWith('smart-') && storeUser?.token) {
      try {
        await reminderAPI.deleteReminder(id)
      } catch (err) {
        console.error('Failed to delete reminder from backend:', err)
      }
    }
  }

  const handleToggleEnable = async (id: string, currentEnabled: boolean) => {
    updateReminder(id, { enabled: !currentEnabled })
    if (id.length > 10 && !id.startsWith('smart-') && storeUser?.token) {
      try {
        await reminderAPI.toggleReminder(id)
      } catch (err) {
        console.error('Failed to toggle reminder on backend:', err)
      }
    }
  }

  // Categorize reminders
  const smartReminders = useMemo(
    () => reminders.filter((r) => r.isSmart || r.category === 'smart'),
    [reminders]
  )

  const manualReminders = useMemo(
    () => reminders.filter((r) => !r.isSmart && r.category !== 'smart'),
    [reminders]
  )

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }, [currentMonth])

  const remindersForDate = (dateString: string) => {
    return reminders.filter(r => {
      if (r.recurrence === 'daily') return true
      const reminderDate = r.date ? r.date.split('T')[0] : null
      return reminderDate === dateString
    })
  }

  const filteredReminders = useMemo(() => {
    let list = [...reminders]
    if (filterType === 'smart') {
      list = list.filter(r => r.isSmart || r.category === 'smart')
    } else if (filterType === 'manual') {
      list = list.filter(r => !r.isSmart && r.category !== 'smart')
    } else if (filterType !== 'all') {
      list = list.filter(r => r.type === filterType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q) ||
        (r.smartPurpose || '').toLowerCase().includes(q)
      )
    }
    if (selectedDate) {
      list = list.filter(r => {
        if (r.recurrence === 'daily') return true
        return (r.date || '').split('T')[0] === selectedDate
      })
    }
    return list
  }, [reminders, filterType, searchQuery, selectedDate])

  const today = new Date().toISOString().split('T')[0]
  const todayRemindersCount = remindersForDate(today).length
  const upcomingCount = reminders.filter(r => {
    const d = (r.date || today).split('T')[0]
    return d >= today
  }).length

  const goToPrevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goToNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(today)
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
      active
        ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-md'
        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50'
    }`

  const headerExtra = (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <NotificationBell />
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
        <Check className="w-4 h-4 stroke-[3]" />
        <span className="hidden sm:inline">Smart Notifications Active</span>
        <span className="sm:hidden">Active</span>
      </div>
      <button
        onClick={playBeep}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Test Alert Sound</span>
        <span className="sm:hidden">Sound</span>
      </button>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleAdd}
        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-teal-500 text-white px-5 sm:px-6 py-2.5 rounded-2xl font-black text-sm shadow-xl shadow-pink-500/30 hover:shadow-2xl transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Set Manual Reminder</span>
        <span className="sm:hidden">Set Reminder</span>
      </motion.button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/60 via-purple-50/30 to-teal-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 py-6 lg:py-10 relative overflow-hidden text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Smart & Personalized Reminders"
          subtitle="Adaptive health reminders powered by your female health profile"
          subtitleIcon={<Sparkles className="w-4 h-4 text-pink-500" />}
          hideBell={true}
          extra={headerExtra}
        />

        {/* Top Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Smart AI Reminders', value: smartReminders.length, icon: <Sparkles className="w-6 h-6" />, gradient: 'from-pink-500 to-purple-500', shadow: 'shadow-pink-500/20' },
            { label: 'Manual Reminders', value: manualReminders.length, icon: <Bell className="w-6 h-6" />, gradient: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/20' },
            { label: "Today's Schedule", value: todayRemindersCount, icon: <Calendar className="w-6 h-6" />, gradient: 'from-teal-500 to-emerald-500', shadow: 'shadow-teal-500/20' },
            { label: 'Completed Today', value: completedReminders.size, icon: <Check className="w-6 h-6 stroke-[3]" />, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring' }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden bg-white/90 dark:bg-gray-850 rounded-3xl p-6 shadow-xl shadow-pink-100/30 dark:shadow-black/30 border border-pink-100/60 dark:border-gray-800"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full blur-2xl -mt-10 -mr-10`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg ${stat.shadow}`}>
                  {stat.icon}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-10`} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl sm:text-4xl font-black mt-1 text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ============================================================ */}
        {/* SECTION 1: PERSONALIZED SMART REMINDERS                      */}
        {/* ============================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-teal-500/5 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-teal-950/20 rounded-3xl p-6 sm:p-8 border-2 border-pink-200/70 dark:border-pink-900/40 shadow-xl shadow-pink-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-pink-100 dark:border-gray-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      Personalized Smart Reminders
                    </h2>
                    <span className="text-xs font-black bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                      Profile-Adapted
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                    Tailored automatically from your hydration, diet, exercise, sleep, cycle & clinical details
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-pink-200 dark:border-gray-700 text-pink-600 dark:text-pink-400 text-xs font-black shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-pink-500' : ''}`} />
                  <span>{isSyncing ? 'Synchronizing...' : 'Re-sync with Profile'}</span>
                </motion.button>
              </div>
            </div>

            {smartReminders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">Complete your User Profile to generate personalized smart reminders.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {smartReminders.map((reminder) => {
                  const colors = typeColors[reminder.type] || typeColors.medicine
                  const isCompleted = completedReminders.has(reminder.id)

                  return (
                    <motion.div
                      key={reminder.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -3 }}
                      className={`relative bg-white dark:bg-gray-850 rounded-2xl p-5 border-2 transition-all flex flex-col justify-between shadow-sm ${
                        reminder.enabled
                          ? 'border-pink-200 dark:border-pink-900/60 shadow-pink-500/5'
                          : 'border-gray-200 dark:border-gray-800 opacity-60'
                      }`}
                    >
                      <div>
                        {/* Top Bar: Purpose Tag + Enable Toggle */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${colors.light} dark:bg-gray-800 ${colors.text}`}>
                            {typeIcons[reminder.type]}
                            <span>{reminder.smartPurpose || typeLabels[reminder.type]}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleEnable(reminder.id, reminder.enabled)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                              reminder.enabled
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                            title={reminder.enabled ? 'Click to pause' : 'Click to enable'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${reminder.enabled ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                            <span>{reminder.enabled ? 'Enabled' : 'Paused'}</span>
                          </button>
                        </div>

                        {/* Title & Description */}
                        <h4 className={`text-base font-black tracking-tight mb-1.5 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {reminder.title}
                        </h4>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          {reminder.notes}
                        </p>
                      </div>

                      {/* Bottom Controls: Time Adjuster + Actions */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                          <Clock className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                          <input
                            type="time"
                            value={reminder.time}
                            onChange={(e) => handleQuickTimeChange(reminder.id, e.target.value)}
                            className="bg-transparent text-xs font-black text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                            title="Quickly adjust time"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleComplete(reminder.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-600'
                            }`}
                            title={isCompleted ? 'Marked complete' : 'Mark as done today'}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => handleEdit(reminder)}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors cursor-pointer"
                            title="Edit notes & schedule"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Dismiss reminder"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* ============================================================ */}
        {/* SECTION 2: MANUAL & SCHEDULED REMINDERS                      */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Manual Reminders & Calendar
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                Your custom reminders with full scheduling and repetition
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-teal-500 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-pink-500/20 hover:shadow-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Reminder</span>
          </motion.button>
        </div>

        {/* Toolbar: Search, Filters & View Mode */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-850 rounded-3xl p-4 sm:p-5 shadow-xl shadow-pink-100/20 dark:shadow-black/20 border border-gray-100 dark:border-gray-800 mb-6"
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl self-start">
              <button onClick={() => setViewMode('list')} className={tabClass(viewMode === 'list')}>
                <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> List View</div>
              </button>
              <button onClick={() => setViewMode('calendar')} className={tabClass(viewMode === 'calendar')}>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Calendar View</div>
              </button>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, notes, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 font-bold text-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Filter className="w-4 h-4 ml-2 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="bg-transparent px-3 py-2 rounded-xl text-xs sm:text-sm font-black text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Reminders</option>
                  <option value="manual">Manual Reminders Only</option>
                  <option value="smart">Smart Reminders Only</option>
                  {(Object.keys(typeLabels) as ReminderType[]).map(t => (
                    <option key={t} value={t}>{typeLabels[t]}</option>
                  ))}
                </select>
              </div>

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 rounded-2xl font-bold text-xs hover:bg-pink-200 transition-colors"
                >
                  <span>{selectedDate}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={goToToday}
                className="px-4 py-2.5 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-750 text-pink-600 dark:text-pink-400 rounded-2xl font-black text-xs hover:shadow-md transition-all cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>
        </motion.div>

        {/* View Layout: Calendar or List */}
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 bg-white dark:bg-gray-850 rounded-3xl p-6 sm:p-8 shadow-xl shadow-pink-100/20 dark:shadow-black/20 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevMonth}
                      className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNextMonth}
                      className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-3">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="text-center text-xs font-black text-gray-400 uppercase py-2">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarDays.map((day, idx) => {
                    if (!day) {
                      return <div key={idx} className="aspect-square" />
                    }
                    const dateStr = day.toISOString().split('T')[0]
                    const dateReminders = remindersForDate(dateStr)
                    const isToday = dateStr === today
                    const isSelected = selectedDate === dateStr

                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square relative p-1 sm:p-2 rounded-2xl transition-all text-left flex flex-col cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl scale-105 z-10'
                            : isToday
                            ? 'bg-pink-50 dark:bg-pink-950/40 ring-2 ring-pink-500 ring-offset-2'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className={`text-xs sm:text-sm font-black ${
                          isSelected ? 'text-white' : isToday ? 'text-pink-600 dark:text-pink-400' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {day.getDate()}
                        </span>
                        {dateReminders.length > 0 && (
                          <div className="mt-auto flex gap-0.5 flex-wrap">
                            {dateReminders.slice(0, 3).map((r) => (
                              <div
                                key={r.id}
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                                  isSelected ? 'bg-white' : (typeColors[r.type] || typeColors.medicine).bg
                                }`}
                              />
                            ))}
                            {dateReminders.length > 3 && (
                              <span className={`text-[10px] font-black ${
                                isSelected ? 'text-white' : 'text-gray-500'
                              }`}>+{dateReminders.length - 3}</span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-850 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 h-fit">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : "Today's Schedule"}
                  </h3>
                </div>
                {(() => {
                  const dateKey = selectedDate || today
                  const list = remindersForDate(dateKey)
                    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                  if (list.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-pink-50 dark:bg-gray-800 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-pink-400" />
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">No reminders for this day</h4>
                        <p className="text-xs text-gray-500 mb-4">Enjoy your free time!</p>
                        <button
                          onClick={handleAdd}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Set Reminder
                        </button>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-3">
                      {list.map((r) => {
                        const colors = typeColors[r.type] || typeColors.medicine
                        const isCompleted = completedReminders.has(r.id)
                        return (
                          <motion.div
                            key={r.id}
                            layout
                            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                              isCompleted
                                ? `${colors.light} dark:bg-gray-800/50 border-transparent opacity-60`
                                : `${colors.light}/50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`
                            }`}
                          >
                            <button
                              onClick={() => handleToggleComplete(r.id)}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isCompleted
                                  ? `${colors.bg} border-transparent text-white`
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-black truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {r.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                                <Clock className="w-3 h-3 text-pink-500" />
                                <span>{r.time}</span>
                                {r.isSmart && (
                                  <span className="text-[10px] bg-pink-500/10 text-pink-600 dark:text-pink-400 px-1.5 py-0.2 rounded font-black">AI</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {filteredReminders.length === 0 ? (
                <div className="bg-white dark:bg-gray-850 rounded-3xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-800">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-50 dark:bg-gray-800 flex items-center justify-center">
                    <Bell className="w-10 h-10 text-pink-400" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Matching Reminders</h3>
                  <p className="text-gray-500 text-sm mb-6">Create a reminder or adjust your search filter.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    Set Reminder
                  </motion.button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <AnimatePresence mode="popLayout">
                    {filteredReminders.map((reminder, index) => {
                      const colors = typeColors[reminder.type] || typeColors.medicine
                      const isCompleted = completedReminders.has(reminder.id)
                      const isSmart = reminder.isSmart || reminder.category === 'smart'

                      return (
                        <motion.div
                          key={reminder.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ y: -4 }}
                          className={`relative overflow-hidden bg-white dark:bg-gray-850 rounded-3xl p-6 shadow-xl border transition-all flex flex-col justify-between ${
                            reminder.enabled ? 'border-gray-100 dark:border-gray-800' : 'border-gray-200 dark:border-gray-800/60 opacity-60'
                          } ${isSmart ? 'ring-1 ring-pink-500/20' : ''}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleToggleComplete(reminder.id)}
                                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white shadow-lg cursor-pointer ${
                                    isCompleted ? 'ring-4 ring-offset-2 ring-emerald-400' : ''
                                  }`}
                                >
                                  {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : typeIcons[reminder.type]}
                                </motion.button>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className={`text-base font-black tracking-tight ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                      {reminder.title}
                                    </h4>
                                    {isSmart ? (
                                      <span className="text-[10px] font-black bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full border border-pink-500/20">
                                        Smart
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                                        Manual
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3.5 h-3.5 text-pink-500" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-extrabold">{reminder.time}</p>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-xs text-gray-500 capitalize">{reminder.recurrence === 'daily' ? 'Daily' : (reminder.recurrence || 'Active')}</p>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleToggleEnable(reminder.id, reminder.enabled)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${
                                  reminder.enabled
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                }`}
                                title={reminder.enabled ? 'Enabled' : 'Disabled'}
                              >
                                {reminder.enabled ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs font-black ${colors.text} ${colors.light} dark:bg-gray-800 px-3 py-1 rounded-xl capitalize`}>
                                {typeIcons[reminder.type]}
                                {reminder.smartPurpose || typeLabels[reminder.type]}
                              </span>
                            </div>

                            {reminder.notes && (
                              <p className={`text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 mb-4 leading-relaxed ${isCompleted ? 'line-through' : ''}`}>
                                {reminder.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <button
                              onClick={() => handleEdit(reminder)}
                              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl bg-gray-900/95 text-white backdrop-blur-md shadow-2xl border border-pink-500/30 flex items-center gap-3 font-bold text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Creating / Editing Reminder */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
                />

                {/* Modal Dialog Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="relative w-full max-w-lg sm:max-w-xl max-h-[85vh] sm:max-h-[90vh] bg-white dark:bg-gray-850 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 z-10"
                >
                  {/* Modal Header (Fixed at top of modal) */}
                  <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-850/95 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            {editingReminder ? 'Edit Reminder' : 'Set Manual Reminder'}
                          </h2>
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold">
                            {editingReminder ? 'Update time, frequency or notes' : 'Configure a custom schedule for your wellness'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Form Container with Flex Column Layout */}
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4.5">
                      {formError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-sm font-bold text-rose-600 dark:text-rose-300 shadow-sm"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                          <span>{formError}</span>
                        </motion.div>
                      )}

                      {/* 1. Reminder Title */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                          Reminder Title <span className="text-pink-500 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value })
                            if (formError) setFormError(null)
                          }}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 font-bold text-sm text-gray-900 dark:text-white transition-all"
                          placeholder="e.g. Iron Supplement / Doctor Appointment / 2L Water"
                          required
                        />
                      </div>

                      {/* 2. Description */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                          Description / Notes
                        </label>
                        <textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl font-semibold text-sm text-gray-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 resize-none transition-all"
                          placeholder="e.g. Take with a glass of water after breakfast"
                          rows={2}
                        />
                      </div>

                      {/* 3. Date & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                            Date
                          </label>
                          <input
                            type="date"
                            value={formData.date || ''}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:border-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                            Time <span className="text-pink-500 font-black">*</span>
                          </label>
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) => {
                              setFormData({ ...formData, time: e.target.value })
                              if (formError) setFormError(null)
                            }}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-sm text-gray-900 dark:text-white focus:outline-none focus:border-pink-500"
                            required
                          />
                        </div>
                      </div>

                      {/* 4. Repeat / Recurrence */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                          Repeat Frequency
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['once', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((r) => {
                            const isSelected = (formData.recurrence === r || (!formData.recurrence && r === 'daily'))
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setFormData({ ...formData, recurrence: r })}
                                className={`py-2.5 px-2 rounded-2xl font-black text-xs capitalize transition-all cursor-pointer border-2 ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-teal-500 text-white border-transparent shadow-md shadow-pink-500/20'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-750'
                                }`}
                              >
                                {r === 'once' ? 'Once' : r === 'daily' ? 'Daily' : r === 'weekly' ? 'Weekly' : 'Monthly'}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* 5. Reminder Category */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                          Reminder Category
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 border-2 border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/70 dark:bg-gray-900/30">
                          {(Object.keys(typeIcons) as ReminderType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData({ ...formData, type })}
                              className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                                formData.type === type
                                  ? `border-transparent bg-gradient-to-br ${(typeColors[type] || typeColors.medicine).gradient} text-white shadow-md`
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-pink-300'
                              }`}
                            >
                              <div>{typeIcons[type]}</div>
                              <span>{typeLabels[type]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 6. Active Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white">Enable Reminder Notifications</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">Active alerts with audio & browser notification</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                          className={`relative w-12 h-7 rounded-full transition-all cursor-pointer ${
                            formData.enabled ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-0.5 ${formData.enabled ? 'left-5.5' : 'left-0.5'} w-6 h-6 rounded-full bg-white shadow-md transition-all`} />
                        </button>
                      </div>
                    </div>

                    {/* Sticky/Fixed Footer - SET REMINDER BUTTON IS ALWAYS VISIBLE */}
                    <div className="shrink-0 p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/80 backdrop-blur-md flex flex-col gap-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-pink-500 via-purple-600 to-teal-500 text-white rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-75"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Saving Reminder...</span>
                          </>
                        ) : editingReminder ? (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Save Reminder</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 stroke-[3]" />
                            <span>Set Reminder</span>
                          </>
                        )}
                      </motion.button>

                      <div className="text-center pt-0.5">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="text-xs font-black text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
