
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Pill,
  Activity,
  AlertTriangle,
  Leaf,
  Baby,
  Clock,
  CalendarCheck,
  AlertOctagon,
  Apple,
  Sparkles,
  Send,
  X,
} from 'lucide-react'
import { useAppStore, useNotifications, type Notification as AppNotification } from '@/store'
import { requestNotificationPermission, playBeep, showNotification } from '@/hooks/useReminders'

type NotificationCategory =
  | 'all'
  | 'reminder'
  | 'medicine'
  | 'appointment'
  | 'pregnancy'
  | 'cycle'
  | 'health'
  | 'wellness'
  | 'emergency'
  | 'chat'
  | 'nutrition'

type ExtendedNotificationType = Exclude<NotificationCategory, 'all'>

const categories: { key: NotificationCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reminder', label: 'Reminders' },
  { key: 'medicine', label: 'Medicines' },
  { key: 'appointment', label: 'Appointments' },
  { key: 'pregnancy', label: 'Pregnancy Updates' },
  { key: 'cycle', label: 'Cycle Updates' },
  { key: 'health', label: 'Health Tips' },
  { key: 'wellness', label: 'Workout Reminders' },
  { key: 'emergency', label: 'Emergency Alerts' },
  { key: 'chat', label: 'Doctor Messages' },
  { key: 'nutrition', label: 'Nutrition Tips' },
]

const typeIcons: Record<ExtendedNotificationType, JSX.Element> = {
  reminder: <Bell className="w-6 h-6" />,
  medicine: <Pill className="w-6 h-6" />,
  appointment: <Calendar className="w-6 h-6" />,
  pregnancy: <Baby className="w-6 h-6" />,
  cycle: <CalendarCheck className="w-6 h-6" />,
  health: <Activity className="w-6 h-6" />,
  wellness: <Leaf className="w-6 h-6" />,
  emergency: <AlertTriangle className="w-6 h-6" />,
  chat: <MessageCircle className="w-6 h-6" />,
  nutrition: <Apple className="w-6 h-6" />,
}

const typeColors: Record<ExtendedNotificationType, string> = {
  reminder: 'bg-amber-100 text-amber-600',
  medicine: 'bg-pink-100 text-pink-600',
  appointment: 'bg-blue-100 text-blue-600',
  pregnancy: 'bg-rose-100 text-rose-500',
  cycle: 'bg-purple-100 text-purple-600',
  health: 'bg-green-100 text-green-600',
  wellness: 'bg-emerald-100 text-emerald-600',
  emergency: 'bg-red-100 text-red-600',
  chat: 'bg-violet-100 text-violet-600',
  nutrition: 'bg-lime-100 text-lime-700',
}

const typeBadgeColors: Record<ExtendedNotificationType, string> = {
  reminder: 'bg-gradient-to-r from-amber-500 to-amber-600',
  medicine: 'bg-gradient-to-r from-pink-500 to-rose-500',
  appointment: 'bg-gradient-to-r from-blue-500 to-blue-600',
  pregnancy: 'bg-gradient-to-r from-rose-400 to-pink-400',
  cycle: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
  health: 'bg-gradient-to-r from-green-500 to-emerald-500',
  wellness: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  emergency: 'bg-gradient-to-r from-red-500 to-red-600',
  chat: 'bg-gradient-to-r from-violet-500 to-purple-500',
  nutrition: 'bg-gradient-to-r from-lime-500 to-green-500',
}

type SampleNotif = {
  type: ExtendedNotificationType
  title: string
  message: string
  hoursAgo: number
}

const sampleNotificationsData: SampleNotif[] = [
  {
    type: 'reminder',
    title: 'Time to take your medication',
    message: 'Please take your prenatal vitamin with a glass of water. This helps support your baby\'s development.',
    hoursAgo: 0.2,
  },
  {
    type: 'medicine',
    title: 'Iron supplement refill soon',
    message: 'Your iron supplement (Ferrous Sulfate 325mg) will run out in 3 days. Schedule a refill with your pharmacy.',
    hoursAgo: 1,
  },
  {
    type: 'appointment',
    title: 'Upcoming: OB-GYN checkup tomorrow',
    message: 'You have an appointment with Dr. Sarah Johnson at 10:00 AM tomorrow at City Women\'s Hospital.',
    hoursAgo: 4,
  },
  {
    type: 'pregnancy',
    title: 'Week 20 Update — Halfway there! 🎉',
    message: 'Your baby is now the size of a banana. This week: baby can hear your voice! Try talking or singing to them.',
    hoursAgo: 8,
  },
  {
    type: 'cycle',
    title: 'Next period predicted in 5 days',
    message: 'Based on your cycle history, your next period is expected on July 5. Stock up on essentials if needed.',
    hoursAgo: 12,
  },
  {
    type: 'health',
    title: 'Stay hydrated — you\'re at 40% of goal',
    message: 'Aim for 8 glasses of water today. Proper hydration helps reduce fatigue, headaches, and bloating.',
    hoursAgo: 18,
  },
  {
    type: 'wellness',
    title: 'Gentle yoga session due in 1 hour',
    message: 'Your 20-minute prenatal yoga flow is scheduled at 5:00 PM. Great for relieving lower back pain!',
    hoursAgo: 24,
  },
  {
    type: 'emergency',
    title: '⚠️ Severe symptom detected',
    message: 'Persistent abdominal pain reported. If accompanied by bleeding or fever, contact your doctor immediately or call emergency services.',
    hoursAgo: 36,
  },
  {
    type: 'chat',
    title: 'Dr. Maria Garcia replied to your message',
    message: '"Hi! Thank you for sharing your symptoms. The mild cramping you\'re experiencing in week 16 is normal — it\'s likely round ligament pain. Stay hydrated and rest on your side. Let me know if it worsens!"',
    hoursAgo: 48,
  },
  {
    type: 'nutrition',
    title: 'Iron + Vitamin C = Better absorption',
    message: 'Pro tip: Pair your iron-rich foods (spinach, lentils, red meat) with Vitamin C sources (oranges, bell peppers, tomatoes) to boost absorption by up to 6x!',
    hoursAgo: 72,
  },
]

type ReadFilter = 'all' | 'read' | 'unread'

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let rafId: number
    const startVal = 0

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(startVal + (value - startVal) * eased))
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [value, duration])

  return <span>{display}</span>
}

export default function Notifications() {
  const navigate = useNavigate()
  const notifications = useNotifications()
  const addNotification = useAppStore(state => state.addNotification)
  const markNotificationRead = useAppStore(state => state.markNotificationRead)
  const markAllNotificationsRead = useAppStore(state => state.markAllNotificationsRead)

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all')
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [dismissPermissionBanner, setDismissPermissionBanner] = useState(false)
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (notifications.length === 0) {
      sampleNotificationsData.forEach((sample, idx) => {
        const ts = new Date(Date.now() - sample.hoursAgo * 60 * 60 * 1000)
        const notif: AppNotification = {
          id: `sample-${Date.now()}-${idx}`,
          title: sample.title,
          message: sample.message,
          type: sample.type,
          read: idx >= 4,
          timestamp: ts,
        }
        addNotification(notif)
      })
    }
  }, [notifications.length, addNotification])

  const handleLoadSampleNotifications = () => {
    sampleNotificationsData.forEach((sample, idx) => {
      const ts = new Date(Date.now() - sample.hoursAgo * 60 * 60 * 1000)
      const notif: AppNotification = {
        id: `sample-manual-${Date.now()}-${idx}`,
        title: sample.title,
        message: sample.message,
        type: sample.type,
        read: false,
        timestamp: ts,
      }
      addNotification(notif)
    })
    playBeep?.()
  }

  const handleSendTestNotification = () => {
    const title = '🔔 FemCare Test Notification'
    const body = 'This is a test notification from FemCare AI. Your browser notifications are working correctly!'
    showNotification(title, body)
    addNotification({
      id: `test-${Date.now()}`,
      title: 'Test Notification Sent',
      message: 'A browser notification was just sent. Check your browser notifications area (usually top-right or bottom-right of your screen).',
      type: 'reminder',
      read: false,
      timestamp: new Date(),
    })
    playBeep?.()
  }

  const handleRequestPermission = async () => {
    await requestNotificationPermission()
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        playBeep?.()
      }
    }
  }

  const handleAskLater = () => {
    setDismissPermissionBanner(true)
  }

  const filteredNotifications = useMemo(() => {
    let result = notifications
    if (activeCategory !== 'all') {
      result = result.filter(n => n.type === activeCategory)
    }
    if (readFilter === 'read') {
      result = result.filter(n => n.read)
    } else if (readFilter === 'unread') {
      result = result.filter(n => !n.read)
    }
    return result
  }, [notifications, activeCategory, readFilter])

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const stats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length
    const remindersToday = notifications.filter(n => {
      const ts = new Date(n.timestamp)
      return n.type === 'reminder' && ts >= startOfDay && ts < new Date(startOfDay.getTime() + 86400000)
    }).length
    const appointmentsThisWeek = notifications.filter(n => {
      const ts = new Date(n.timestamp)
      return n.type === 'appointment' && ts >= startOfWeek && ts < endOfWeek
    }).length
    const nutritionThisMonth = notifications.filter(n => {
      const ts = new Date(n.timestamp)
      return n.type === 'nutrition' && ts >= startOfMonth
    }).length
    const cycleAlertsCount = notifications.filter(n => n.type === 'cycle').length
    return { total, unread, remindersToday, appointmentsThisWeek, nutritionThisMonth, cycleAlertsCount }
  }, [notifications, startOfDay, startOfWeek, endOfWeek, startOfMonth])

  const handleMarkAllRead = () => {
    playBeep?.()
    markAllNotificationsRead()
  }

  const getNotificationType = (type: string): ExtendedNotificationType => {
    const validTypes: ExtendedNotificationType[] = [
      'reminder', 'medicine', 'appointment', 'pregnancy', 'cycle', 'health', 'wellness', 'emergency', 'chat', 'nutrition'
    ]
    return validTypes.includes(type as ExtendedNotificationType)
      ? (type as ExtendedNotificationType)
      : 'reminder'
  }

  const readFilters: { key: ReadFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-20 -left-20 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-30 pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-40 -right-20 w-[28rem] h-[28rem] bg-purple-300 rounded-full blur-3xl opacity-30 pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute top-1/2 left-1/3 w-80 h-80 bg-rose-200 rounded-full blur-3xl opacity-20 pointer-events-none"
      />

      <div className="container mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          {permission === 'default' && !dismissPermissionBanner && (
            <motion.div
              key="default-banner"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mb-6 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 shadow-2xl shadow-pink-500/30 overflow-hidden border-4 border-white/40"
            >
              <div className="relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 text-white flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center flex-shrink-0 ring-2 ring-white/40 animate-pulse">
                        <Bell className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl sm:text-2xl font-bold">🔔 Enable Notifications</h2>
                          <span className="px-2.5 py-0.5 bg-white/25 rounded-full text-xs font-bold backdrop-blur-sm">
                            Recommended
                          </span>
                        </div>
                        <p className="text-white/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                          Get <strong>real-time alerts</strong> for medicine reminders, upcoming appointments, pregnancy milestones, cycle updates, and personalized health tips — delivered straight to your browser.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <button
                        onClick={handleRequestPermission}
                        className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 bg-white text-pink-600 rounded-2xl font-bold text-base shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Bell className="w-5 h-5" />
                        Allow Notifications
                      </button>
                      <button
                        onClick={handleAskLater}
                        className="flex-1 sm:flex-none px-5 py-3.5 bg-white/15 backdrop-blur-sm text-white rounded-2xl font-semibold border-2 border-white/30 hover:bg-white/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Ask Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {permission === 'denied' && (
            <motion.div
              key="denied-banner"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mb-6 rounded-3xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 shadow-2xl shadow-red-500/30 overflow-hidden"
            >
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">⛔ Notifications Blocked</h2>
                  <p className="text-white/90 text-sm sm:text-base max-w-2xl mb-3">
                    You&apos;ve blocked notifications in your browser settings. To receive medicine, appointment &amp; health alerts, please unblock FemCare in your browser permissions:
                  </p>
                  <ul className="text-white/85 text-sm space-y-1 list-disc list-inside">
                    <li>Click the 🔒 lock or ⓘ icon in your browser address bar</li>
                    <li>Find &quot;Notifications&quot; and set it to &quot;Allow&quot;</li>
                    <li>Refresh this page after updating settings</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {permission === 'granted' && (
            <motion.div
              key="granted-banner"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 shadow-2xl shadow-emerald-500/30 overflow-hidden"
            >
              <div className="p-6 sm:p-8 flex items-center gap-4 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">✅ Notifications Enabled</h2>
                  <p className="text-white/90 text-sm sm:text-base">
                    You&apos;ll receive real-time alerts for medicines, appointments &amp; pregnancy updates.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-pink-700 bg-clip-text text-transparent">
              Notifications
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleLoadSampleNotifications}
              className="flex items-center gap-2 px-5 py-3 backdrop-blur-md bg-white/80 text-purple-700 rounded-2xl font-bold shadow-lg shadow-purple-100/50 border border-purple-100 hover:bg-white hover:shadow-xl hover:shadow-purple-200/50 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              <Sparkles className="w-5 h-5" />
              Load Sample Data
            </button>
            <button
              onClick={handleSendTestNotification}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              <Send className="w-5 h-5" />
              Send Test Notification
            </button>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <CheckCircle2 className="w-5 h-5" />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          {[
            { label: 'Total', value: stats.total, icon: Bell, color: 'from-blue-500 to-blue-600' },
            { label: 'Unread', value: stats.unread, icon: AlertTriangle, color: 'from-pink-500 to-rose-500' },
            { label: 'Reminders Today', value: stats.remindersToday, icon: Clock, color: 'from-amber-500 to-orange-500' },
            { label: 'Appointments This Week', value: stats.appointmentsThisWeek, icon: Calendar, color: 'from-purple-500 to-fuchsia-500' },
            { label: 'Nutrition Tips This Month', value: stats.nutritionThisMonth, icon: Apple, color: 'from-lime-500 to-green-500' },
            { label: 'Cycle Alerts Count', value: stats.cycleAlertsCount, icon: CalendarCheck, color: 'from-fuchsia-500 to-pink-500' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              className="backdrop-blur-xl bg-white/70 rounded-3xl p-4 sm:p-5 shadow-xl shadow-black/5 border border-white/60 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg shadow-black/10 flex-shrink-0`}>
                  <s.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                    <AnimatedCounter value={s.value} />
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-4 flex items-center justify-end gap-2"
        >
          <span className="text-sm font-semibold text-gray-500 mr-2">Filter:</span>
          <div className="flex gap-1.5 p-1.5 backdrop-blur-md bg-white/70 rounded-2xl border border-pink-100 shadow-sm">
            {readFilters.map((f) => {
              const isActive = readFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setReadFilter(f.key)}
                  className={`px-4 py-1.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <div className="flex gap-2 min-w-max">
            {categories.map((cat, i) => {
              const isActive = activeCategory === cat.key
              return (
                <motion.button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.55 + i * 0.04 }}
                  whileHover={{ scale: isActive ? 1.03 : 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-pink-500/30'
                      : 'backdrop-blur-md bg-white/70 text-gray-700 border border-pink-100 hover:bg-white hover:shadow-md hover:shadow-pink-100/50'
                  }`}
                >
                  {cat.label}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {filteredNotifications.length > 0 ? (
            <motion.div
              key="notif-list"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="space-y-4"
            >
              {filteredNotifications.map((notification, index) => {
                const notifType = getNotificationType(notification.type)
                return (
                  <motion.div
                    key={notification.id}
                    variants={{
                      hidden: { opacity: 0, x: -30, scale: 0.96 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        },
                      },
                    }}
                    whileHover={{
                      x: 4,
                      scale: 1.005,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`backdrop-blur-xl bg-white/75 rounded-3xl shadow-xl shadow-black/5 border border-white/70 p-5 sm:p-6 cursor-pointer transition-all duration-300 ${
                      !notification.read
                        ? 'border-l-8 border-l-pink-500 shadow-pink-200/40'
                        : 'hover:shadow-2xl hover:shadow-black/10'
                    }`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${typeColors[notifType]} flex items-center justify-center shadow-inner`}>
                          {typeIcons[notifType]}
                        </div>
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${typeBadgeColors[notifType]} shadow-md border-2 border-white`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug break-words">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 + index * 0.02, type: 'spring', stiffness: 500 }}
                                className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-md shadow-pink-400/50 flex-shrink-0"
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-2 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center py-12 sm:py-20"
            >
              <div className="relative inline-block mb-8">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-pink-100 via-white to-purple-100 flex items-center justify-center shadow-2xl shadow-pink-200/50 border border-white"
                >
                  <span className="text-6xl sm:text-7xl">🔕</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                  className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-pink-400/40"
                >
                  ✨
                </motion.div>
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-2xl sm:text-3xl font-black mb-3 bg-gradient-to-r from-gray-800 via-gray-900 to-pink-700 bg-clip-text text-transparent"
              >
                No notifications yet
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto leading-relaxed"
              >
                We&apos;ll alert you about medicines, appointments &amp; health tips here!
              </motion.p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.4, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(236, 72, 153, 0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoadSampleNotifications}
                  className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-purple-500/30 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  Load Sample Notifications
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(236, 72, 153, 0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/reminders')}
                  className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-pink-500/30 transition-all duration-300"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  Go to Reminders
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
