import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Bell,
  Droplets,
  Activity,
  Clock,
  Sparkles,
  Smile,
  Pill,
  Users,
  Heart,
  Sun,
  Moon,
  Zap,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  useReminders,
  useAppointments,
  useCycleEntries,
  useHydrationEntries,
  useMoodEntries,
  useProfile,
} from '@/store'
import { NotificationBell } from '@/components/NotificationBell'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type DayEvent = {
  type: 'reminder' | 'appointment' | 'cycle'
  title: string
  time?: string
  color: string
  bgColor: string
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const reminders = useReminders()
  const appointments = useAppointments()
  const cycleEntries = useCycleEntries()
  const hydrationEntries = useHydrationEntries()
  const moodEntries = useMoodEntries()
  const profile = useProfile()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [animateMonth, setAnimateMonth] = useState(0)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    setAnimateMonth((n) => n + 1)
  }, [currentMonth])

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

  const getEventsForDate = (dateStr: string): DayEvent[] => {
    const events: DayEvent[] = []

    const dayReminders = reminders.filter(
      (r) => (r.date || '').split('T')[0] === dateStr
    )
    dayReminders.forEach((r) => {
      events.push({
        type: 'reminder',
        title: r.title,
        time: r.time,
        color: r.type === 'medicine' ? 'text-pink-600' : r.type === 'appointment' ? 'text-blue-600' : 'text-purple-600',
        bgColor: r.type === 'medicine' ? 'bg-pink-100' : r.type === 'appointment' ? 'bg-blue-100' : 'bg-purple-100',
      })
    })

    const dayAppointments = appointments.filter(
      (a) => (a.date || '').split('T')[0] === dateStr
    )
    dayAppointments.forEach((a) => {
      events.push({
        type: 'appointment',
        title: `Dr. ${a.doctorName.split(' ')[1] || a.doctorName}`,
        time: a.time,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
      })
    })

    const dayCycle = cycleEntries.find((c) => c.date === dateStr)
    if (dayCycle?.isPeriod) {
      events.push({
        type: 'cycle',
        title: `${dayCycle.flowIntensity} flow`,
        color: 'text-rose-600',
        bgColor: 'bg-rose-100',
      })
    }
    return events
  }

  const hasCycle = (dateStr: string) =>
    cycleEntries.some((c) => c.date === dateStr && c.isPeriod)
  const hasAppointment = (dateStr: string) =>
    appointments.some((a) => (a.date || '').split('T')[0] === dateStr)
  const hasReminder = (dateStr: string) =>
    reminders.some((r) => (r.date || '').split('T')[0] === dateStr && r.enabled)

  const upcomingEvents = useMemo(() => {
    const events: Array<{ id: string; date: string; time?: string; title: string; type: string; color: string; icon: React.ReactNode }> = []

    reminders
      .filter((r) => r.enabled && (r.date || '').split('T')[0] >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 5)
      .forEach((r) => {
        events.push({
          id: r.id,
          date: r.date || today,
          time: r.time,
          title: r.title,
          type: r.type,
          color: r.type === 'medicine' ? 'from-pink-500 to-rose-500' : r.type === 'appointment' ? 'from-blue-500 to-indigo-500' : r.type === 'water' ? 'from-cyan-500 to-teal-500' : 'from-purple-500 to-violet-500',
          icon: r.type === 'medicine' ? <Pill className="w-4 h-4" /> : r.type === 'water' ? <Droplets className="w-4 h-4" /> : r.type === 'appointment' ? <Users className="w-4 h-4" /> : <Bell className="w-4 h-4" />,
        })
      })

    appointments
      .filter((a) => (a.date || '').split('T')[0] >= today && a.status === 'upcoming')
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 5)
      .forEach((a) => {
        events.push({
          id: a.id,
          date: a.date,
          time: a.time,
          title: `${a.doctorName} - ${a.specialty}`,
          type: 'appointment',
          color: 'from-indigo-500 to-blue-500',
          icon: <Users className="w-4 h-4" />,
        })
      })

    return events
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 6)
  }, [reminders, appointments, today])

  // Selected date details
  const selectedHydration = hydrationEntries.find((h) => h.date === selectedDate)
  const selectedMood = moodEntries.find((m) => m.date === selectedDate)
  const selectedDayEvents = getEventsForDate(selectedDate)
  const selectedCycle = cycleEntries.find((c) => c.date === selectedDate)

  const nextCycleInfo = useMemo(() => {
    if (!profile?.lastPeriodDate || !profile?.cycleLength) return null
    const lastPeriod = new Date(profile.lastPeriodDate)
    const nextDate = new Date(lastPeriod)
    nextDate.setDate(nextDate.getDate() + profile.cycleLength)
    const daysUntil = Math.ceil(
      (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return { nextDate, daysUntil: Math.max(0, daysUntil) }
  }, [profile])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-200/15 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '4s' }} />

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
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Wellness Calendar
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Track your health journey day by day
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Calendar */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-100/50 border border-gray-50"
            >
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <motion.h3
                    key={animateMonth}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-gray-800"
                  >
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </motion.h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {calendarDays.filter(Boolean).length} days this month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-2xl font-bold text-sm hover:shadow-md transition-all"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs sm:text-sm font-bold text-gray-500 py-2 uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={animateMonth}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-7 gap-1 sm:gap-2"
                >
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={idx} className="aspect-square" />
                    const dateStr = day.toISOString().split('T')[0]
                    const isToday = dateStr === today
                    const isSelected = dateStr === selectedDate
                    const cycleDay = hasCycle(dateStr)
                    const apptDay = hasAppointment(dateStr)
                    const remDay = hasReminder(dateStr)

                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square relative p-1 sm:p-2 rounded-2xl transition-all text-left flex flex-col ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white shadow-xl shadow-purple-300/40 scale-105 z-10'
                            : isToday
                            ? 'bg-purple-50 ring-2 ring-purple-400 ring-offset-2'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isSelected
                              ? 'text-white'
                              : isToday
                              ? 'text-purple-600'
                              : 'text-gray-800'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-auto flex gap-0.5 flex-wrap items-end">
                          {cycleDay && (
                            <div
                              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-rose-500'
                              }`}
                            />
                          )}
                          {apptDay && (
                            <div
                              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-indigo-500'
                              }`}
                            />
                          )}
                          {remDay && (
                            <div
                              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-amber-500'
                              }`}
                            />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-semibold text-gray-600">Period</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs font-semibold text-gray-600">Appointment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-gray-600">Reminder</span>
                </div>
              </div>
            </motion.div>

            {/* Selected Date Details */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-gray-100/50 border border-gray-50 h-fit"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Selected Day</p>
                  <h3 className="text-2xl font-black text-gray-800">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                </div>
                {selectedDate === today && (
                  <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {/* Cycle Status */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Cycle Status</span>
                  </div>
                  {selectedCycle?.isPeriod ? (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 capitalize">{selectedCycle.flowIntensity} flow</span>
                      {selectedCycle.flowIntensity === 'heavy' && <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                  ) : nextCycleInfo && selectedDate === today ? (
                    <div>
                      <p className="font-bold text-gray-800 text-lg">
                        {nextCycleInfo.daysUntil} days
                      </p>
                      <p className="text-xs text-gray-500">until next expected period</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 font-medium">No period logged</p>
                  )}
                </div>

                {/* Water Intake */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Water Intake</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-black text-gray-800">
                      {selectedHydration?.glasses || 0}
                    </span>
                    <span className="text-sm text-gray-400 mb-1">
                      / {selectedHydration?.goal || 8} glasses
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          ((selectedHydration?.glasses || 0) / (selectedHydration?.goal || 8)) * 100,
                          100
                        )}%`,
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Mood */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Smile className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Mood & Energy</span>
                  </div>
                  {selectedMood ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold capitalize text-gray-700">
                          {selectedMood.mood.replace('-', ' ')}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-lg shadow-md bg-gradient-to-br ${
                          ['happy', 'excited', 'calm'].includes(selectedMood.mood)
                            ? 'from-green-400 to-emerald-500'
                            : ['sad', 'anxious', 'stressed'].includes(selectedMood.mood)
                            ? 'from-indigo-400 to-purple-500'
                            : 'from-amber-400 to-orange-500'
                        }`}>
                          {['happy', 'excited'].includes(selectedMood.mood)
                            ? '😊'
                            : selectedMood.mood === 'calm'
                            ? '😌'
                            : ['sad', 'anxious', 'stressed'].includes(selectedMood.mood)
                            ? '😔'
                            : selectedMood.mood === 'angry'
                            ? '😤'
                            : '😐'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-gray-500">Stress: {selectedMood.stressLevel}/10</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 font-medium">No mood logged</p>
                  )}
                </div>

                {/* Events */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Today's Events ({selectedDayEvents.length})
                    </span>
                  </div>
                  {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-5 rounded-2xl bg-gray-50/60">
                      <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-1.5" />
                      <p className="text-xs text-gray-400 font-medium">Nothing scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEvents.map((ev, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-xl ${ev.bgColor}`}
                        >
                          {ev.type === 'reminder' && <Bell className={`w-4 h-4 ${ev.color}`} />}
                          {ev.type === 'appointment' && <Users className={`w-4 h-4 ${ev.color}`} />}
                          {ev.type === 'cycle' && <Activity className={`w-4 h-4 ${ev.color}`} />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${ev.color} truncate`}>{ev.title}</p>
                            {ev.time && <p className="text-xs text-gray-500">{ev.time}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Upcoming Events */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden"
          >
            <div className="p-6 sm:p-7 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Upcoming Events</h3>
                  <p className="text-sm text-gray-500">
                    {upcomingEvents.length} scheduled in the next days
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/reminders')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-200 hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </motion.button>
            </div>

            <div className="p-6 sm:p-7">
              <AnimatePresence mode="popLayout">
                {upcomingEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-teal-100 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-purple-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Your calendar is clear!</h4>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      No upcoming events or reminders. Add some to stay on track with your wellness goals.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event, idx) => {
                      const isToday = event.date === today
                      const eventDate = new Date(event.date + 'T00:00:00')
                      const daysAway = Math.ceil(
                        (eventDate.getTime() - new Date(today + 'T00:00:00').getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                      return (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ x: 4 }}
                          className="relative flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-gray-50/80 to-white border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all"
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                            {event.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <h4 className="font-black text-gray-800 truncate">{event.title}</h4>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                  isToday
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                                    : daysAway <= 1
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {isToday ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d`}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm flex-wrap">
                              <span className="text-gray-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              {event.time && (
                                <span className="text-gray-500 font-medium flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {event.time}
                                </span>
                              )}
                            </div>
                          </div>
                          {isToday && (
                            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 animate-pulse" />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
