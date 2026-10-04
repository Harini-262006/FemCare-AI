import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  MessageCircle,
  Users,
  Droplets,
  Activity,
  Calendar,
  Pill,
  Bell,
  Smile,
  Dumbbell,
  Settings,
  ClipboardList,
  TrendingUp,
  Sparkles,
  Heart,
  Moon,
  Flame,
  Clock,
  ChevronRight,
  Star,
  Plus,
  ArrowRight,
  CloudRain,
  Coffee,
  Sun,
  Thermometer,
  Upload,
  AlertTriangle,
  Eye,
  Footprints,
  Zap,
  Wind,
  CloudSun,
  Droplet,
  BedDouble,
  Battery,
  BatteryCharging,
  X,
  Check,
  CalendarClock,
  CalendarDays,
  Umbrella,
  Stethoscope,
  Phone,
  Video,
  LogOut,
  RefreshCcw,
} from 'lucide-react'
import { useAppStore, useProfile, useReminders, useAppointments, useHydrationEntries, useMoodEntries, useCycleEntries, useFitnessEntries, useSleepEntries, useChats } from '../store'
import { NotificationBell } from '../components/NotificationBell'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { hydrationAPI, prescriptionAPI, appointmentAPI } from '../services/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts'

const motivationalQuotes = [
  { text: 'Nurture your body, it\'s the only place you have to live.', author: 'Jim Rohn' },
  { text: 'Every step you take today is a gift to your future self.', author: 'Unknown' },
  { text: 'Your health is an investment, not an expense.', author: 'Unknown' },
  { text: 'Self-care is not selfish, it\'s essential.', author: 'Unknown' },
  { text: 'Small steps every day lead to big changes.', author: 'Unknown' },
  { text: 'You are stronger than you think. Keep going!', author: 'Unknown' },
  { text: 'Wellness is a journey, not a destination.', author: 'Unknown' },
]

const moodEmojis: Record<string, { emoji: string; label: string; gradient: string }> = {
  happy: { emoji: '😊', label: 'Happy', gradient: 'from-yellow-400 to-amber-400' },
  excited: { emoji: '🤩', label: 'Excited', gradient: 'from-orange-400 to-pink-400' },
  calm: { emoji: '😌', label: 'Calm', gradient: 'from-teal-400 to-cyan-400' },
  anxious: { emoji: '😰', label: 'Anxious', gradient: 'from-violet-400 to-purple-400' },
  stressed: { emoji: '😣', label: 'Stressed', gradient: 'from-red-400 to-rose-400' },
  sad: { emoji: '😢', label: 'Sad', gradient: 'from-blue-400 to-indigo-400' },
  angry: { emoji: '😠', label: 'Angry', gradient: 'from-red-500 to-orange-500' },
  neutral: { emoji: '😐', label: 'Neutral', gradient: 'from-gray-400 to-slate-400' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 110,
      damping: 14,
      delay: i * 0.05,
    },
  }),
}

const widgetVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 90,
      damping: 15,
      delay: i * 0.08,
    },
  }),
}

function getWeekDates() {
  const dates = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Home() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const profile = useProfile()
  const reminders = useReminders()
  const appointments = useAppointments()
  const hydrationEntries = useHydrationEntries()
  const moodEntries = useMoodEntries()
  const cycleEntries = useCycleEntries()
  const fitnessEntries = useFitnessEntries()
  const sleepEntries = useSleepEntries()
  const chats = useChats()

  const logoutUser = useAppStore((state) => state.logoutUser)
  const handleLogout = useCallback(() => {
    logoutUser()
    try {
      localStorage.removeItem('user-storage')
    } catch (e) {
      // Storage fallback
    }
    navigate('/login', { replace: true })
  }, [logoutUser, navigate])

  const [animateScore, setAnimateScore] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [reminderToggles, setReminderToggles] = useState<Record<string, boolean>>({})

  // Real-time MongoDB Hydration State for Home Dashboard
  const [homeHydration, setHomeHydration] = useState<{
    consumedMl: number;
    goalMl: number;
    percentage: number;
    remainingMl: number;
    loading: boolean;
  }>({
    consumedMl: 0,
    goalMl: 2500,
    percentage: 0,
    remainingMl: 2500,
    loading: true,
  });

  const fetchHomeHydration = useCallback(async () => {
    try {
      const dateStr = new Date().toLocaleDateString('en-CA');
      const doc = await hydrationAPI.getToday(dateStr);
      if (doc) {
        const consumed = Number(doc.consumedMl) || 0;
        const goal = Number(doc.goalMl) || 2500;
        const percentage = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;
        const remaining = Math.max(goal - consumed, 0);

        console.log('[HOME HYDRATION]', {
          user: user?.email,
          goalMl: goal,
          consumedMl: consumed,
          percentage: `${percentage}%`,
          remainingMl: remaining,
          doc,
        });

        setHomeHydration({
          consumedMl: consumed,
          goalMl: goal,
          percentage,
          remainingMl: remaining,
          loading: false,
        });
      }
    } catch (err) {
      console.error('[HOME HYDRATION] Failed to fetch hydration data:', err);
      setHomeHydration((prev) => ({ ...prev, loading: false }));
    }
  }, [user]);

  // User Prescriptions & Appointments
  const [homePrescriptions, setHomePrescriptions] = useState<any[]>([]);
  const [homeAppointments, setHomeAppointments] = useState<any[]>([]);

  const fetchHomeData = useCallback(async () => {
    try {
      const [prescs, appts] = await Promise.all([
        prescriptionAPI.getPrescriptions().catch(() => []),
        appointmentAPI.getUserAppointments().catch(() => []),
      ]);
      setHomePrescriptions(prescs);
      setHomeAppointments(appts);
    } catch (e) {
      console.error('Failed to fetch home extra data:', e);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  useEffect(() => {
    fetchHomeHydration();

    // Refetch when window regains focus (e.g. returning from Hydration page)
    const onFocus = () => fetchHomeHydration();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchHomeHydration]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const weekDates = useMemo(() => getWeekDates(), [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { greeting, timeOfDayIcon, healthGreeting } = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return {
        greeting: 'Good Morning',
        timeOfDayIcon: <Coffee className="w-5 h-5 text-amber-500" />,
        healthGreeting: 'Rise and shine! Let\'s start your day with hydration and positivity. 🌅',
      }
    }
    if (hour < 17) {
      return {
        greeting: 'Good Afternoon',
        timeOfDayIcon: <Sun className="w-5 h-5 text-yellow-500" />,
        healthGreeting: 'Halfway through the day! Don\'t forget to stretch and sip some water. ☀️',
      }
    }
    return {
      greeting: 'Good Evening',
      timeOfDayIcon: <Moon className="w-5 h-5 text-indigo-500" />,
      healthGreeting: 'Wind down beautifully. Prioritize rest and reflection tonight. 🌙',
    }
  }, [])

  const dailyQuote = useMemo(() => {
    const idx = new Date().getDate() % motivationalQuotes.length
    return motivationalQuotes[idx]
  }, [])

  const weather = useMemo(() => {
    const hour = new Date().getHours()
    const temp = hour < 12 ? 22 : hour < 17 ? 28 : 24
    const cond = hour < 12 ? 'Partly Cloudy' : hour < 17 ? 'Sunny' : 'Clear'
    const humidity = 55
    return { temp, cond, humidity }
  }, [])

  const bmi = useMemo(() => {
    if (profile && profile.height > 0 && profile.weight > 0) {
      const val = profile.weight / (profile.height / 100) ** 2
      return { value: val.toFixed(1), status: val < 18.5 ? 'Underweight' : val < 25 ? 'Normal' : val < 30 ? 'Overweight' : 'Obese' }
    }
    return { value: '—', status: 'Track BMI' }
  }, [profile])

  const healthScore = useMemo(() => {
    let score = 55
    const bmiVal = profile && profile.height > 0 && profile.weight > 0
      ? profile.weight / (profile.height / 100) ** 2 : 0
    if (bmiVal >= 18.5 && bmiVal <= 24.9) score += 10
    if ((profile?.waterIntake || 2) >= 2) score += 6
    if ((profile?.sleepHours || 0) >= 7) score += 8
    if (profile?.exerciseRoutine && profile.exerciseRoutine !== 'None') score += 8
    const todayHydration = hydrationEntries.find((h) => h.date === todayStr)
    if (todayHydration && todayHydration.glasses >= todayHydration.goal * 0.7) score += 5
    const todayMood = moodEntries.find((m) => m.date === todayStr)
    if (todayMood && (todayMood.mood === 'happy' || todayMood.mood === 'calm')) score += 4
    const todayWorkout = fitnessEntries.find((f) => f.date === todayStr)
    if (todayWorkout) score += 4
    return Math.min(Math.round(score), 100)
  }, [profile, hydrationEntries, moodEntries, fitnessEntries, todayStr])

  useEffect(() => {
    const t = setTimeout(() => setAnimateScore(healthScore), 400)
    return () => clearTimeout(t)
  }, [healthScore])

  const todayHydration = useMemo(() => {
    const h = hydrationEntries.find((e) => e.date === todayStr)
    return { glasses: h?.glasses || 0, goal: h?.goal || 8 }
  }, [hydrationEntries, todayStr])

  const todayMood = useMemo(() => moodEntries.find((m) => m.date === todayStr), [moodEntries, todayStr])
  const todayWorkout = useMemo(() => fitnessEntries.find((f) => f.date === todayStr), [fitnessEntries, todayStr])

  const weeklyMoodData = useMemo(() => {
    const moodValue: Record<string, number> = { happy: 7, excited: 8, calm: 6, neutral: 5, anxious: 3, sad: 2, stressed: 2, angry: 1 }
    return weekDates.map((d) => {
      const entry = moodEntries.find((m) => m.date === d)
      return entry ? moodValue[entry.mood] ?? 5 : 4
    })
  }, [moodEntries, weekDates])

  const weeklyWorkoutData = useMemo(() => {
    return weekDates.map((d) => {
      const entry = fitnessEntries.find((f) => f.date === d)
      return entry ? entry.duration : 0
    })
  }, [fitnessEntries, weekDates])

  const weeklyHydrationData = useMemo(() => {
    return weekDates.map((d) => {
      const entry = hydrationEntries.find((h) => h.date === d)
      return entry ? (entry.glasses / (entry.goal || 8)) * 100 : 25
    })
  }, [hydrationEntries, weekDates])

  const weeklySleepData = useMemo(() => {
    return weekDates.map((d) => {
      const entry = sleepEntries.find((s) => s.date === d)
      if (entry) return entry.durationHours
      return 0
    })
  }, [sleepEntries, weekDates])

  const cycleInfo = useMemo(() => {
    if (!profile?.lastPeriodDate || !profile?.cycleLength) {
      return { nextDate: null, daysUntil: 0, phase: 'Tracking', phaseColor: 'from-slate-400 to-gray-500', fertileStart: null, fertileEnd: null }
    }
    const last = new Date(profile.lastPeriodDate)
    const next = new Date(last)
    next.setDate(next.getDate() + profile.cycleLength)
    const daysUntil = Math.max(0, Math.ceil((next.getTime() - new Date().getTime()) / 86400000))
    const dayInCycle = profile.cycleLength - daysUntil
    let phase = 'Follicular'
    let phaseColor = 'from-pink-400 to-rose-400'
    if (daysUntil <= 5 && daysUntil >= 0) { phase = 'Menstrual'; phaseColor = 'from-rose-500 to-red-500' }
    else if (dayInCycle >= 10 && dayInCycle <= 17) { phase = 'Ovulation'; phaseColor = 'from-teal-400 to-cyan-500' }
    else if (dayInCycle > 17) { phase = 'Luteal'; phaseColor = 'from-violet-400 to-purple-500' }
    const ovulationDay = profile.cycleLength - 14
    const fertileStart = new Date(last)
    fertileStart.setDate(fertileStart.getDate() + ovulationDay - 5)
    const fertileEnd = new Date(last)
    fertileEnd.setDate(fertileEnd.getDate() + ovulationDay + 1)
    return { nextDate: next, daysUntil, phase, phaseColor, fertileStart, fertileEnd }
  }, [profile])

  const todayReminders = useMemo(() => reminders.filter((r) => r.enabled).slice(0, 5), [reminders])
  const upcomingAppointments = useMemo(() => appointments.filter((a) => a.status === 'upcoming').slice(0, 3), [appointments])

  const healthInsights = useMemo(() => {
    const insights: { icon: React.ReactNode; text: string; gradient: string }[] = []
    if ((profile?.waterIntake || 0) < 2 || todayHydration.glasses < todayHydration.goal * 0.5) {
      insights.push({
        icon: <Droplets className="w-4 h-4" />,
        text: 'Hydration is below 50%. Aim for 8 glasses today!',
        gradient: 'from-cyan-400 to-blue-500',
      })
    }
    if ((profile?.sleepHours || 0) < 7) {
      insights.push({
        icon: <Moon className="w-4 h-4" />,
        text: 'Sleep target is low. 7-9 hours is ideal for recovery.',
        gradient: 'from-indigo-400 to-purple-500',
      })
    }
    if (!todayWorkout && (!profile?.exerciseRoutine || profile.exerciseRoutine === 'None')) {
      insights.push({
        icon: <Dumbbell className="w-4 h-4" />,
        text: 'No workout logged yet. A 20-min walk counts too!',
        gradient: 'from-emerald-400 to-teal-500',
      })
    }
    if (insights.length === 0) {
      insights.push({
        icon: <Sparkles className="w-4 h-4" />,
        text: 'You\'re on track! Keep building these healthy habits.',
        gradient: 'from-purple-400 to-pink-500',
      })
      insights.push({
        icon: <Heart className="w-4 h-4" />,
        text: 'Consistency is key. Your future self thanks you!',
        gradient: 'from-rose-400 to-pink-500',
      })
    }
    while (insights.length < 3) {
      insights.push({
        icon: <Star className="w-4 h-4" />,
        text: 'Don\'t forget to log today\'s mood and meals!',
        gradient: 'from-amber-400 to-orange-500',
      })
    }
    return insights.slice(0, 3)
  }, [profile, todayHydration, todayWorkout])

  const doctorMessages = useMemo(() => {
    const doctorChats = chats.filter((c) => c.type === 'doctor').slice(0, 3)
    if (doctorChats.length > 0) {
      return doctorChats.map((c) => {
        const last = c.messages[c.messages.length - 1]
        return {
          chatId: c.id,
          doctorName: c.title,
          preview: last ? last.content.substring(0, 60) + (last.content.length > 60 ? '...' : '') : 'Start conversation',
          time: last ? new Date(last.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: last?.role === 'doctor',
        }
      })
    }
    return [
      { doctorName: 'Dr. Sarah Johnson', preview: 'Your recent reports look good, keep following the plan!', time: '10:30 AM', unread: true, chatId: '1' },
      { doctorName: 'Dr. Maria Garcia', preview: 'Schedule your follow-up at your convenience.', time: 'Yesterday', unread: false, chatId: '2' },
    ]
  }, [chats])

  const weight = profile?.weight || 0
  const steps = 6248 + (new Date().getHours() * 400)
  const calories = Math.round(steps * 0.04 + (todayWorkout?.duration || 0) * 3.5)
  const todaySleepEntry = sleepEntries.find((s) => s.date === todayStr) || sleepEntries[0]
  const sleepHours = todaySleepEntry ? todaySleepEntry.durationHours : (profile?.sleepHours || 7)

  const quickActions = [
    { icon: <Sparkles className="w-5 h-5" />, title: 'AI Chat', gradient: 'from-violet-500 via-purple-500 to-indigo-500', path: '/ai-chat', pulse: true },
    { icon: <Moon className="w-5 h-5" />, title: 'Sleep Tracker', gradient: 'from-indigo-500 via-purple-500 to-violet-500', path: '/sleep-entry' },
    { icon: <Smile className="w-5 h-5" />, title: 'Mood Tracker', gradient: 'from-fuchsia-500 via-pink-500 to-rose-500', path: '/mood-entry' },
    { icon: <Dumbbell className="w-5 h-5" />, title: 'Workout', gradient: 'from-green-500 via-emerald-500 to-teal-500', path: '/workout-entry' },
    { icon: <Droplets className="w-5 h-5" />, title: 'Hydration', gradient: 'from-cyan-500 via-sky-500 to-blue-500', path: '/hydration' },
    { icon: <Stethoscope className="w-5 h-5" />, title: 'Consult Doctor', gradient: 'from-sky-500 via-blue-500 to-indigo-500', path: '/doctors' },
    { icon: <MessageCircle className="w-5 h-5" />, title: 'Doctor Chat', gradient: 'from-teal-500 via-cyan-500 to-sky-500', path: '/doctor-chat' },
    { icon: <Upload className="w-5 h-5" />, title: 'Upload Report', gradient: 'from-emerald-500 via-teal-500 to-cyan-500', path: '/health-reports' },
    { icon: <Bell className="w-5 h-5" />, title: 'Add Reminder', gradient: 'from-orange-500 via-amber-500 to-yellow-500', path: '/reminders' },
    { icon: <CalendarDays className="w-5 h-5" />, title: 'View Calendar', gradient: 'from-pink-500 via-rose-500 to-red-500', path: '/cycle-tracker' },
    { icon: <AlertTriangle className="w-5 h-5" />, title: 'Emergency SOS', gradient: 'from-red-500 via-rose-500 to-pink-500', path: '/emergency', danger: true },
  ]

  const toggleReminder = (id: string) => {
    setReminderToggles((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getAppointmentCountdown = (dateStr: string, timeStr: string) => {
    const dt = new Date(`${dateStr}T${timeStr}`)
    const diff = dt.getTime() - new Date().getTime()
    if (diff <= 0) return 'Soon'
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    if (days > 0) return `${days}d ${hours}h`
    const mins = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${mins}m`
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-rose-50 via-purple-50 to-teal-50">
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-300/30 rounded-full blur-3xl -z-10 pointer-events-none"
        style={{ y: scrollY * 0.15 }}
      />
      <motion.div
        className="absolute top-40 -left-20 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl -z-10 pointer-events-none"
        style={{ y: scrollY * 0.1, x: scrollY * 0.02 }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-teal-300/25 rounded-full blur-3xl -z-10 pointer-events-none"
        style={{ y: -scrollY * 0.08 }}
      />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s' }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* ============== HERO SECTION ============== */}
          <motion.section variants={itemVariants} className="relative mb-8">
            <motion.div
              className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-10"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.95) 0%, rgba(168,85,247,0.95) 45%, rgba(20,184,166,0.92) 100%)',
                y: scrollY * -0.05,
              }}
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl -mt-20 -mr-20" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mb-16 -ml-10" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="absolute top-8 right-16 w-56 h-56 rounded-full border border-white/20 border-dashed opacity-40"
              />

              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2.5">
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/20 hover:bg-white/35 backdrop-blur-md text-white border border-white/30 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md hover:scale-105 active:scale-95"
                  title="Logout from FemCare AI"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>

              <div className="relative z-10 grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                {/* Left: Greeting + User */}
                <div className="lg:col-span-2">
                  <div className="flex items-start gap-4 sm:gap-5 mb-5">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.1 }}
                      className="relative flex-shrink-0"
                    >
                      <div className="absolute -inset-1.5 bg-gradient-to-br from-amber-300 to-pink-300 rounded-[1.75rem] opacity-60 blur-md animate-pulse" />
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-gradient-to-br from-white via-pink-50 to-purple-100 flex items-center justify-center text-3xl sm:text-4xl font-black text-pink-600 shadow-2xl border-4 border-white/60">
                        {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '👤'}
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-400 rounded-full border-[3px] border-white shadow-lg"
                      />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white/95 mb-2 border border-white/25"
                      >
                        {timeOfDayIcon}
                        <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                      </motion.div>
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-sm">
                        {greeting}, {user?.name?.split(' ')[0] || 'Beautiful'} ✨
                      </h1>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/90 text-base sm:text-lg leading-relaxed max-w-xl"
                      >
                        {healthGreeting}
                      </motion.p>
                    </div>
                  </div>

                  {/* Daily Quote */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative mb-5 sm:mb-6"
                  >
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white/95 text-sm sm:text-base font-medium italic leading-relaxed">
                            &ldquo;{dailyQuote.text}&rdquo;
                          </p>
                          <p className="text-white/70 text-xs sm:text-sm mt-1.5 font-semibold">— {dailyQuote.author}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Health Score CTA */}
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/ai-chat')}
                      className="inline-flex items-center gap-2 bg-white text-pink-600 px-5 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all"
                    >
                      <Sparkles className="w-4.5 h-4.5" />
                      Talk to FemCare AI
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/profile')}
                      className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-white/25 transition-all"
                    >
                      <User className="w-4.5 h-4.5" />
                      My Profile
                    </motion.button>
                  </div>
                </div>

                {/* Right: Weather + Health Score Mini */}
                <div className="space-y-4">
                  {/* Weather Widget */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 text-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CloudSun className="w-5 h-5 text-amber-200" />
                        <span className="text-xs sm:text-sm font-semibold text-white/85 uppercase tracking-wide">Weather</span>
                      </div>
                      <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded-full">Your City</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl sm:text-5xl font-black">{weather.temp}°</span>
                          <span className="text-lg font-bold text-white/70">C</span>
                        </div>
                        <p className="text-sm text-white/80 font-medium mt-0.5">{weather.cond}</p>
                      </div>
                      <motion.div
                        animate={{ y: [0, -4, 0], rotate: [0, 6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-5xl sm:text-6xl"
                      >
                        ☁️
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/15">
                      <div className="flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-cyan-200" />
                        <span className="text-xs font-semibold text-white/80">{weather.humidity}% Humidity</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-xs font-semibold text-white/80">12 km/h</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Mini Health Score */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 text-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-200 animate-pulse" />
                        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-white/85">Health Score</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="9" />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="white"
                            strokeWidth="9"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0, 251' }}
                            animate={{ strokeDasharray: `${(animateScore / 100) * 251}, 251` }}
                            transition={{ duration: 1.6, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black">{animateScore}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold mb-1">
                          {animateScore >= 80 ? 'Excellent! 🌟' : animateScore >= 65 ? 'Good going! 💪' : 'Let\'s improve ✨'}
                        </p>
                        <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-amber-300 to-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${animateScore}%` }}
                            transition={{ duration: 1.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* ============== 9 HEALTH SCORE CARDS ============== */}
          <section className="mb-8">
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-200">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Today\'s Vitals</h2>
                <p className="text-sm text-gray-500">Your health snapshot at a glance</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-pink-200 via-purple-200 to-transparent" />
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* 1. BMI Card */}
              <motion.div
                custom={0}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-rose-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-400/10 to-pink-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200 group-hover:rotate-6 transition-transform">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wide">BMI</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-rose-600 bg-clip-text text-transparent">{bmi.value}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-rose-600 mb-2">{bmi.status}</p>
                  <div className="h-1.5 w-full bg-rose-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: bmi.value !== '—' ? `${Math.min(parseFloat(bmi.value) / 40 * 100, 100)}%` : '20%' }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* 2. Weight Card */}
              <motion.div
                custom={1}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-blue-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                      <BatteryCharging className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Weight</span>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-blue-600 bg-clip-text text-transparent">{weight || '—'}</span>
                    <span className="text-sm font-bold text-gray-400">kg</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-2">{weight ? 'Track your progress' : 'Update profile'}</p>
                  <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: weight ? `${Math.min((weight / 100) * 100, 100)}%` : '20%' }}
                      transition={{ duration: 1, delay: 0.25 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* 3. Water Progress Card (Beside Weight Progress) */}
              <motion.div
                custom={2}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => {
                  console.log('[NAVIGATION DEBUG] Water Progress card clicked -> navigating to /hydration');
                  navigate('/hydration');
                }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-cyan-100/50 cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-teal-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:rotate-6 transition-transform">
                      <Droplets className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Water Progress</span>
                  </div>

                  {homeHydration.loading ? (
                    <div className="py-2 text-xs font-semibold text-cyan-600 animate-pulse">
                      Loading hydration...
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-cyan-600 bg-clip-text text-transparent">
                          {homeHydration.percentage}%
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          ({homeHydration.consumedMl} / {homeHydration.goalMl} ml)
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-cyan-600 mb-2">
                        {homeHydration.consumedMl >= homeHydration.goalMl
                          ? 'Daily goal completed! 🎉'
                          : `Remaining: ${homeHydration.remainingMl} ml`}
                      </p>
                      <div className="h-1.5 w-full bg-cyan-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${homeHydration.percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* 4. Sleep Hours */}
              <motion.div
                custom={3}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => navigate('/sleep-entry')}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-indigo-100/50 cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-violet-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                      <BedDouble className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Sleep</span>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-indigo-600 bg-clip-text text-transparent">{sleepHours}</span>
                    <span className="text-sm font-bold text-gray-400">hrs</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-indigo-600 mb-2">
                    {sleepHours >= 7 ? 'Well rested 💤' : 'Need more rest'}
                  </p>
                  <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((sleepHours / 10) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.35 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* 5. Steps */}
              <motion.div
                custom={4}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-emerald-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform">
                      <Footprints className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Steps</span>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-emerald-600 bg-clip-text text-transparent">{steps.toLocaleString()}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-600 mb-2">Goal: 10,000 ({Math.round((steps / 10000) * 100)}%)</p>
                  <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((steps / 10000) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* 6. Calories Burned */}
              <motion.div
                custom={5}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-orange-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:rotate-6 transition-transform">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Calories</span>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-orange-600 bg-clip-text text-transparent">{calories.toLocaleString()}</span>
                    <span className="text-sm font-bold text-gray-400">kcal</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-orange-600 mb-2">Target: 2,000 kcal</p>
                  <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((calories / 2000) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.45 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* 7. Mood */}
              <motion.div
                custom={6}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-pink-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-fuchsia-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${todayMood ? moodEmojis[todayMood.mood]?.gradient : 'from-amber-400 to-pink-500'} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                      <Smile className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Mood</span>
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <motion.span
                      key={todayMood?.mood || 'none'}
                      initial={{ scale: 0.5, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      className="text-4xl sm:text-5xl"
                    >
                      {todayMood ? moodEmojis[todayMood.mood]?.emoji || '😐' : '🤔'}
                    </motion.span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-pink-600 mb-2">
                    {todayMood ? moodEmojis[todayMood.mood]?.label || 'Neutral' : 'Not logged yet'}
                  </p>
                  <button
                    onClick={() => navigate('/mood-entry')}
                    className="w-full text-[10px] sm:text-xs font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 py-2 rounded-xl transition-colors"
                  >
                    {todayMood ? 'Update Mood' : '+ Log Mood'}
                  </button>
                </div>
              </motion.div>

              {/* 8. Cycle Status */}
              <motion.div
                custom={7}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-violet-100/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cycleInfo.phaseColor} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                      <Umbrella className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Cycle</span>
                  </div>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-gray-800 to-violet-600 bg-clip-text text-transparent">{cycleInfo.daysUntil}</span>
                    <span className="text-sm font-bold text-gray-400">days</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-violet-600 mb-2">
                    {cycleInfo.phase} Phase
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.5 + i * 0.03, type: 'spring', stiffness: 150 }}
                        className={`flex-1 rounded-full ${
                          i < 7 ? `h-${[1.5, 2, 3, 4, 5, 4, 3][i] || 3} bg-gradient-to-t from-violet-300 to-pink-400` : 'h-1.5 bg-gray-200'
                        }`}
                        style={{ height: i < 3 ? 6 : i < 5 ? 12 : i < 7 ? 16 : 5, transformOrigin: 'bottom' }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 9. Overall Health Score - Big with Circular */}
              <motion.div
                custom={8}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative group overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white/90 via-purple-50/80 to-pink-50/80 backdrop-blur-xl border border-white shadow-xl shadow-purple-100/60"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-2xl -ml-8 -mb-8" />
                <div className="relative flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <svg className="w-24 h-24 sm:w-28 sm:h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(203,213,225,0.4)" strokeWidth="9" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="url(#scoreGrad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0, 264' }}
                        animate={{ strokeDasharray: `${(animateScore / 100) * 264}, 264` }}
                        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        key={animateScore}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-gray-800 via-purple-700 to-pink-600 bg-clip-text text-transparent"
                      >
                        {animateScore}
                      </motion.span>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400">OF 100</span>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-2 rounded-full border border-dashed border-purple-200/40"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wide">Overall</span>
                    <h3 className="text-lg sm:text-xl font-black text-gray-800 mt-1.5 mb-1">Health Score</h3>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-3">
                      {animateScore >= 85 ? 'Exceptional! Keep shining ✨' : animateScore >= 70 ? 'Great! Building consistency 💪' : animateScore >= 55 ? 'Good effort, room to grow 🌱' : 'Let\'s get healthier today!'}
                    </p>
                    <button
                      onClick={() => navigate('/profile')}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl transition-all"
                    >
                      Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ============== 9+ QUICK ACTIONS ============== */}
          <section className="mb-8">
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Quick Actions</h2>
                <p className="text-sm text-gray-500">One-tap access to everything you need</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-teal-200 via-cyan-200 to-transparent" />
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.title}
                  variants={itemVariants}
                  custom={i}
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(action.path)}
                  className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-lg shadow-gray-100 hover:shadow-2xl transition-all duration-300"
                >
                  {action.pulse && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                      className={`absolute top-3 sm:top-4 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${action.gradient} opacity-40 blur-sm`}
                    />
                  )}
                  <div
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${action.danger ? 'shadow-red-300/50' : ''}`}
                  >
                    {action.icon}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-gray-700 text-center leading-tight">
                    {action.title}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </section>

          {/* ============== DASHBOARD WIDGETS GRID ============== */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 mb-8">
            {/* Widget 1: Today's Reminders */}
            <motion.div
              custom={0}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-orange-100/50"
            >
              <div className="p-5 sm:p-6 border-b border-orange-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Today\'s Reminders</h3>
                    <p className="text-xs text-gray-500 font-medium">{todayReminders.length} active</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/reminders')}
                  className="text-xs font-bold text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-xl transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="p-5 sm:p-6">
                {todayReminders.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                      <Bell className="w-8 h-8 text-orange-400" />
                    </div>
                    <h4 className="font-bold text-gray-700 mb-1">No reminders</h4>
                    <p className="text-xs text-gray-500 mb-4">Tap to add your first one</p>
                    <button
                      onClick={() => navigate('/reminders')}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Reminder
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {todayReminders.map((r) => {
                      const enabled = reminderToggles[r.id] ?? r.enabled
                      return (
                        <motion.div
                          key={r.id}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          className="flex items-center gap-3 p-3 mb-2 last:mb-0 rounded-2xl bg-gradient-to-r from-orange-50/60 to-amber-50/40 hover:from-orange-100/60 hover:to-amber-100/50 border border-orange-100/60 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4.5 h-4.5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-800 truncate">{r.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full capitalize">{r.type}</span>
                              <span className="text-[10px] font-semibold text-gray-500">{r.time}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleReminder(r.id)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${enabled ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gray-200'}`}
                          >
                            <motion.div
                              animate={{ x: enabled ? 22 : 2 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                            />
                          </button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>

            {/* Widget 2: Upcoming Appointments */}
            <motion.div
              custom={1}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-blue-100/50"
            >
              <div className="p-5 sm:p-6 border-b border-blue-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
                    <CalendarClock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Appointments</h3>
                    <p className="text-xs text-gray-500 font-medium">{upcomingAppointments.length} upcoming</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/appointments')}
                  className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
                >
                  All
                </button>
              </div>
              <div className="p-5 sm:p-6 space-y-3">
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-gray-700 mb-1">No appointments</h4>
                    <p className="text-xs text-gray-500 mb-4">Book a consultation today</p>
                    <button
                      onClick={() => navigate('/doctors')}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Users className="w-3.5 h-3.5" /> Find Doctors
                    </button>
                  </div>
                ) : (
                  upcomingAppointments.map((a, idx) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100/60"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                          {a.doctorName.split(' ').slice(1).map(n => n[0]).join('') || 'DR'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-gray-800 truncate">{a.doctorName}</h4>
                            <span className="flex-shrink-0 text-[10px] font-black bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-0.5 rounded-full">{getAppointmentCountdown(a.date, a.time)}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium truncate">{a.specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span className="font-semibold">{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span className="font-semibold">{a.time}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto text-indigo-500">
                          <Video className="w-3 h-3" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Widget 3: Recent Doctor Messages */}
            <motion.div
              custom={2}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-teal-100/50"
            >
              <div className="p-5 sm:p-6 border-b border-teal-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Doctor Messages</h3>
                    <p className="text-xs text-gray-500 font-medium">Recent conversations</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/doctor-chat')}
                  className="text-xs font-bold text-teal-600 hover:bg-teal-50 px-3 py-2 rounded-xl transition-colors"
                >
                  Chat
                </button>
              </div>
              <div className="p-5 sm:p-6 space-y-3">
                {doctorMessages.map((msg, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(204, 251, 241, 0.4)' }}
                    onClick={() => navigate('/doctor-chat')}
                    className="w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${idx === 0 ? 'from-pink-400 to-rose-500' : idx === 1 ? 'from-violet-400 to-purple-500' : 'from-emerald-400 to-teal-500'} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                        {msg.doctorName.split(' ').slice(1).map(n => n[0]).join('') || 'DR'}
                      </div>
                      {msg.unread && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{msg.doctorName}</h4>
                        <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0">{msg.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate leading-relaxed">{msg.preview}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Widget 4: AI Health Insights */}
            <motion.div
              custom={3}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50/90 via-pink-50/80 to-rose-50/90 backdrop-blur-xl border border-white shadow-xl shadow-purple-100/50"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative p-5 sm:p-6 border-b border-purple-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">AI Health Insights</h3>
                    <p className="text-xs text-gray-500 font-medium">Personalized for you</p>
                  </div>
                </div>
              </div>
              <div className="relative p-5 sm:p-6 space-y-3">
                {healthInsights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.08 }}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white shadow-sm"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${insight.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                      {insight.icon}
                    </div>
                    <p className="text-sm font-semibold text-gray-700 leading-relaxed pt-0.5">{insight.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Widget 5: Mood Trend Chart */}
            <motion.div
              custom={4}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-fuchsia-100/50"
            >
              <div className="p-5 sm:p-6 border-b border-fuchsia-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
                    <Smile className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Mood Trend</h3>
                    <p className="text-xs text-gray-500 font-medium">Last 7 days</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/mood-entry')}
                  className="text-xs font-bold text-pink-600 hover:bg-pink-50 px-3 py-2 rounded-xl transition-colors"
                >
                  Log
                </button>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 sm:h-36 mb-3">
                  {weeklyMoodData.map((val, i) => {
                    const pct = (val / 8) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex flex-col justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 120, damping: 14 }}
                            className={`w-full rounded-t-xl rounded-b-md bg-gradient-to-t ${
                              val >= 6 ? 'from-pink-400 to-fuchsia-500' : val >= 4 ? 'from-amber-300 to-orange-400' : 'from-blue-400 to-indigo-500'
                            } shadow-md relative overflow-hidden group-hover:brightness-110 transition-all`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-60" />
                          </motion.div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500">{dayLabels[i]}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Mood Line Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="h-40 mb-3 rounded-2xl bg-gradient-to-br from-pink-50/80 to-fuchsia-50/60 border border-pink-100/60 p-2 -mx-1"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dayLabels.map((d, i) => ({ day: d, Mood: weeklyMoodData[i] }))} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="50%" stopColor="#d946ef" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f472b6" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#c084fc" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1e8ff" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 8]} tick={{ fontSize: 9, fill: '#a78bfa', fontWeight: 700 }} tickLine={false} axisLine={false} ticks={[2, 4, 6, 8]} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: 14,
                          border: '1px solid #f5d0fe',
                          boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.2)',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        labelStyle={{ color: '#a21caf', fontWeight: 800, fontSize: 11 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Mood"
                        stroke="url(#moodStroke)"
                        strokeWidth={3}
                        dot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: '#ec4899' }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#d946ef' }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500" /> Positive</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-300 to-orange-400" /> Neutral</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" /> Low</div>
                </div>
              </div>
            </motion.div>

            {/* Widget 6: Workout Progress Chart */}
            <motion.div
              custom={5}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-emerald-100/50"
            >
              <div className="p-5 sm:p-6 border-b border-emerald-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Dumbbell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Workout Progress</h3>
                    <p className="text-xs text-gray-500 font-medium">Minutes / day (7 days)</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/workout-entry')}
                  className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors"
                >
                  + Add
                </button>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 sm:h-36 mb-3">
                  {weeklyWorkoutData.map((val, i) => {
                    const pct = Math.min((val / 90) * 100, val > 0 ? 15 : 5)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 h-3">{val > 0 ? val + 'm' : ''}</span>
                        <div className="w-full flex flex-col justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ delay: 0.35 + i * 0.07, type: 'spring', stiffness: 120, damping: 14 }}
                            className={`w-full rounded-t-xl rounded-b-md bg-gradient-to-t ${
                              val >= 45 ? 'from-emerald-500 to-teal-400' : val > 0 ? 'from-teal-400 to-cyan-400' : 'from-gray-200 to-gray-100'
                            } shadow-md relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent opacity-60" />
                          </motion.div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500">{dayLabels[i]}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Workout Activity Area Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.5 }}
                  className="h-40 mb-3 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-100/60 p-2 -mx-1"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dayLabels.map((d, i) => ({ day: d, Minutes: weeklyWorkoutData[i] }))} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="workoutStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="workoutFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#10b981', fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: 14,
                          border: '1px solid #a7f3d0',
                          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.2)',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        labelStyle={{ color: '#047857', fontWeight: 800, fontSize: 11 }}
                        formatter={(val) => [`${val} min`, 'Duration']}
                      />
                      <Area
                        type="monotone"
                        dataKey="Minutes"
                        stroke="url(#workoutStroke)"
                        strokeWidth={2.5}
                        fill="url(#workoutFill)"
                        dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#10b981' }}
                        activeDot={{ r: 5.5, strokeWidth: 2, stroke: '#fff', fill: '#0d9488' }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Weekly total</p>
                    <p className="text-lg font-black text-emerald-600">{weeklyWorkoutData.reduce((a, b) => a + b, 0)} <span className="text-xs font-bold text-gray-400">min</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Target</p>
                    <p className="text-lg font-black text-gray-700">300 <span className="text-xs font-bold text-gray-400">min</span></p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Widget 7: Water Tracker - Glass Counter */}
            <motion.div
              custom={6}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              onClick={() => {
                console.log('[NAVIGATION DEBUG] Hydration Widget card clicked -> navigating to /hydration');
                navigate('/hydration');
              }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-cyan-100/50 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="relative p-5 sm:p-6 border-b border-cyan-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Hydration Tracker</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {homeHydration.consumedMl} ml of {homeHydration.goalMl} ml goal
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[NAVIGATION DEBUG] Hydration header button clicked -> navigating to /hydration');
                    navigate('/hydration');
                  }}
                  className="text-xs font-bold text-cyan-600 hover:bg-cyan-50 px-3 py-2 rounded-xl transition-colors"
                >
                  Open Tracker →
                </button>
              </div>
              <div className="relative p-5 sm:p-6">
                {/* Glass Counter */}
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2 mb-4">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const glassesFilled = Math.floor((homeHydration.consumedMl / (homeHydration.goalMl || 2500)) * 8);
                    const filled = i < glassesFilled;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + i * 0.03, type: 'spring' }}
                        whileHover={{ scale: 1.15, y: -2 }}
                        className="aspect-[3/4] relative"
                      >
                        <div className={`w-full h-full rounded-b-xl rounded-t-md border-2 ${filled ? 'bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-500 border-cyan-400 shadow-lg shadow-cyan-200/60' : 'bg-white border-gray-200'} transition-all relative overflow-hidden`}>
                          {filled && (
                            <>
                              <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/70 rounded-full"
                              />
                              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-600/30 to-transparent" />
                            </>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-600">Progress</span>
                    <span className="text-xs font-black text-cyan-600">
                      {homeHydration.percentage}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-cyan-50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 rounded-full relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${homeHydration.percentage}%` }}
                      transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
                      />
                    </motion.div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-700 font-bold bg-cyan-50 px-2.5 py-1.5 rounded-xl">
                    💧 Remaining: {homeHydration.remainingMl} ml
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[NAVIGATION DEBUG] Hydration footer button clicked -> navigating to /hydration');
                      navigate('/hydration');
                    }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Open Tracker →
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Widget 8: Sleep Tracker Weekly Bars */}
            <motion.div
              custom={7}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-indigo-100/50"
            >
              <div className="p-5 sm:p-6 border-b border-indigo-50/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Moon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Sleep Tracker</h3>
                    <p className="text-xs text-gray-500 font-medium">Hours / night</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/sleep-entry')}
                  className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors"
                >
                  + Log Sleep
                </button>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 sm:h-36 mb-3">
                  {weeklySleepData.map((hrs, i) => {
                    const pct = (hrs / 10) * 100
                    const good = hrs >= 7
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[9px] sm:text-[10px] font-black text-indigo-600 h-3">{hrs}h</span>
                        <div className="w-full flex flex-col justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 120, damping: 14 }}
                            className={`w-full rounded-t-xl rounded-b-md bg-gradient-to-t ${good ? 'from-indigo-500 via-violet-500 to-purple-400' : 'from-amber-400 to-orange-400'} shadow-md relative overflow-hidden`}
                          >
                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px]">{good ? '💤' : '😴'}</div>
                          </motion.div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500">{dayLabels[i]}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Sleep Duration Line Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="h-40 mb-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-violet-50/70 to-purple-50/60 border border-indigo-100/60 p-2 -mx-1"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dayLabels.map((d, i) => ({ day: d, Hours: weeklySleepData[i] }))} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sleepStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="50%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#6366f1', fontWeight: 700 }} tickLine={false} axisLine={false} ticks={[4, 6, 7, 8, 10]} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: 14,
                          border: '1px solid #c7d2fe',
                          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.2)',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        labelStyle={{ color: '#4338ca', fontWeight: 800, fontSize: 11 }}
                        formatter={(val) => [`${val} hours`, 'Sleep']}
                      />
                      <ReferenceLine
                        y={7}
                        stroke="#22c55e"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: 'Rec. 7h',
                          fill: '#16a34a',
                          fontSize: 10,
                          fontWeight: 700,
                          position: 'insideTopRight',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Hours"
                        stroke="url(#sleepStroke)"
                        strokeWidth={3}
                        dot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: '#6366f1' }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#8b5cf6' }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center p-2 rounded-xl bg-indigo-50/60">
                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Avg</p>
                    <p className="text-base font-black text-indigo-700">
                      {(weeklySleepData.reduce((a, b) => a + b, 0) / 7).toFixed(1)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">h</span>
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-violet-50/60">
                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Best</p>
                    <p className="text-base font-black text-violet-700">
                      {Math.max(...weeklySleepData)}<span className="text-[10px] font-bold text-gray-400 ml-0.5">h</span>
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-emerald-50/60">
                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">Quality</p>
                    <p className="text-base font-black text-emerald-700">
                      {weeklySleepData.filter(h => h >= 7).length}<span className="text-[10px] font-bold text-gray-400 ml-0.5">/7</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Widget 9: Cycle Summary */}
            <motion.div
              custom={8}
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50/90 via-pink-50/85 to-purple-50/90 backdrop-blur-xl border border-white shadow-xl shadow-rose-100/60"
            >
              <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-rose-400/20 to-pink-400/20 rounded-full blur-3xl -ml-12 -mt-12" />
              <div className="relative p-5 sm:p-6 border-b border-rose-100/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cycleInfo.phaseColor} flex items-center justify-center shadow-lg`}>
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800">Cycle Summary</h3>
                    <p className="text-xs text-gray-500 font-medium">Next period & fertile window</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/cycle-tracker')}
                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors"
                >
                  Tracker
                </button>
              </div>
              <div className="relative p-5 sm:p-6 space-y-4">
                {/* Next Period Prediction */}
                <div className="p-4 rounded-2xl bg-white/75 backdrop-blur-sm border border-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Umbrella className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Next Period</span>
                    </div>
                    <motion.span
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs font-black bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-full shadow-md"
                    >
                      In {cycleInfo.daysUntil} days
                    </motion.span>
                  </div>
                  {cycleInfo.nextDate ? (
                    <p className="text-lg font-black bg-gradient-to-br from-gray-800 to-rose-600 bg-clip-text text-transparent">
                      {cycleInfo.nextDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-gray-500">Update profile to predict</p>
                  )}
                </div>

                {/* Current Phase */}
                <div className="p-4 rounded-2xl bg-white/75 backdrop-blur-sm border border-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Current Phase</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cycleInfo.phaseColor} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-800">{cycleInfo.phase} Phase</p>
                      <p className="text-xs text-gray-500 font-medium">Listen to your body ✨</p>
                    </div>
                  </div>
                </div>

                {/* Fertile Window */}
                {cycleInfo.fertileStart && cycleInfo.fertileEnd && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-teal-500" />
                      <span className="text-xs font-bold uppercase tracking-wide text-teal-700">Fertile Window</span>
                    </div>
                    <p className="text-sm font-black text-gray-800">
                      {cycleInfo.fertileStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {cycleInfo.fertileEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* Cycle Timeline Dots */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const dayOfCycle = (profile?.cycleLength || 28) - cycleInfo.daysUntil
                    const isActive = i < Math.round((dayOfCycle / (profile?.cycleLength || 28)) * 14)
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.03, type: 'spring' }}
                        className={`flex-1 h-2 rounded-full ${isActive ? 'bg-gradient-to-r from-rose-400 to-purple-500 shadow-sm' : 'bg-gray-200'}`}
                      />
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </section>

          {/* ============== AI CTA BANNER ============== */}
          <motion.section variants={itemVariants} className="mb-6">
            <div className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white shadow-2xl">
              <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl -mt-28 -ml-20" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-500/25 rounded-full blur-3xl -mb-24 -mr-12" />
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 blur-2xl"
              />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-purple-200 mb-5 border border-white/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    Powered by Advanced AI
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                    Meet <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">FemCare AI</span>,
                    <br className="hidden sm:block" /> Your Personal Health Companion
                  </h2>
                  <p className="text-lg text-purple-200 mb-8 leading-relaxed">
                    Get instant, personalized guidance on women\'s health, nutrition, fitness,
                    and mental wellness — 24/7.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                    <motion.button
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/ai-chat')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-7 py-4 rounded-2xl font-black shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Chat with FemCare AI
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/doctors')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-7 py-4 rounded-2xl font-bold transition-all"
                    >
                      <Stethoscope className="w-5 h-5" />
                      Consult a Doctor
                    </motion.button>
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 80 }}
                  className="relative flex-shrink-0"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-52 h-52 sm:w-60 sm:h-60 rounded-[2rem] bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-purple-900/60"
                  >
                    <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-[1.75rem] bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex flex-col items-center justify-center border border-white/20">
                      <Sparkles className="w-14 h-14 text-white mb-2" />
                      <span className="text-4xl">🌸</span>
                    </div>
                  </motion.div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 -m-6 rounded-[2.5rem] border-2 border-dashed border-white/10"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -inset-4 rounded-[2.5rem] border border-white/20"
                  />
                </motion.div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  )
}
