import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Heart,
  Baby,
  Droplets,
  Activity,
  Scale,
  Thermometer,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  AlertTriangle,
  Phone,
  MapPin,
  Stethoscope,
  Apple,
  Dumbbell,
  Leaf,
  FileText,
  Shield,
  Sun,
  Moon,
  Pill,
  X,
  Sparkles,
  Award,
  Target,
  Footprints,
} from 'lucide-react'
import BackToHomeButton from '../components/BackToHomeButton'
import { useAppStore, useProfile, useReminders } from '../store'

type TabType = 'overview' | 'weekly' | 'baby' | 'health' | 'nutrition' | 'exercise' | 'checklist' | 'contacts'

const TRIMESTER_INFO = [
  {
    name: 'First Trimester',
    weeks: 'Week 1 - 12',
    description: 'Your baby grows from a tiny cluster of cells to a fully formed fetus with all major organs starting to develop.',
    tips: [
      'Start taking prenatal vitamins with folic acid',
      'Stay hydrated - aim for 8-10 glasses of water daily',
      'Eat small, frequent meals to combat morning sickness',
      'Get plenty of rest and aim for 7-9 hours of sleep',
    ],
    color: 'from-pink-400 to-rose-500',
  },
  {
    name: 'Second Trimester',
    weeks: 'Week 13 - 27',
    description: 'You may start feeling your baby move! This is often called the "golden trimester" as morning sickness usually eases.',
    tips: [
      'Start gentle exercises like walking or swimming',
      'Begin thinking about baby names and nursery',
      'Schedule your anatomy scan around 18-22 weeks',
      'Start pelvic floor exercises (Kegels)',
    ],
    color: 'from-purple-400 to-violet-500',
  },
  {
    name: 'Third Trimester',
    weeks: 'Week 28 - 40',
    description: 'Your baby is gaining weight and preparing for birth. You may experience more discomfort as your belly grows.',
    tips: [
      'Prepare your hospital bag by week 36',
      'Attend birthing classes if this is your first baby',
      'Monitor baby movements daily',
      'Practice relaxation techniques for labor',
    ],
    color: 'from-teal-400 to-cyan-500',
  },
]

const FETAL_DEVELOPMENT = [
  { week: 4, size: 'Poppy seed', details: 'The fertilized egg implants in the uterus. The amniotic sac and placenta begin forming.', milestone: 'Implantation complete' },
  { week: 8, size: 'Kidney bean', details: 'All major organs have started forming. Heart is beating. Facial features are developing.', milestone: 'Organs formed' },
  { week: 12, size: 'Lime', details: 'Fingers and toes are distinct. Nails start growing. Baby can make sucking motions.', milestone: 'First trimester end' },
  { week: 16, size: 'Avocado', details: 'You may start feeling movement. Baby can hear your voice. Hair is growing.', milestone: 'Baby moves!' },
  { week: 20, size: 'Banana', details: 'Halfway there! Anatomy scan can show gender. Baby swallows amniotic fluid.', milestone: 'Halfway mark' },
  { week: 24, size: 'Corn cob', details: 'Baby responds to sounds. Lungs are developing. Baby has fingerprints.', milestone: 'Viability reached' },
  { week: 28, size: 'Eggplant', details: 'Baby can blink and dream. Third trimester begins. Brain is rapidly developing.', milestone: 'Third trimester' },
  { week: 32, size: 'Squash', details: 'Baby gains weight quickly. Bones are hardening. Lungs are almost mature.', milestone: 'Rapid weight gain' },
  { week: 36, size: 'Cantaloupe', details: 'Baby drops lower in pelvis. Most babies are in head-down position.', milestone: 'Full term soon!' },
  { week: 40, size: 'Watermelon', details: 'Baby is fully developed and ready to meet you! Average size is 7-8 lbs.', milestone: 'Due date!' },
]

const SAFE_FOODS = [
  { name: 'Leafy Greens', benefit: 'Rich in folate and iron', icon: '🥬' },
  { name: 'Dairy Products', benefit: 'Calcium for bones', icon: '🥛' },
  { name: 'Lean Proteins', benefit: 'Supports baby growth', icon: '🍗' },
  { name: 'Berries', benefit: 'Antioxidants & vitamin C', icon: '🫐' },
  { name: 'Avocados', benefit: 'Healthy fats & folate', icon: '🥑' },
  { name: 'Sweet Potatoes', benefit: 'Beta-carotene & fiber', icon: '🍠' },
  { name: 'Salmon', benefit: 'Omega-3s for brain', icon: '🐟' },
  { name: 'Eggs', benefit: 'Choline for development', icon: '🥚' },
]

const FOODS_TO_AVOID = [
  { name: 'Raw/Undercooked Meat', risk: 'Risk of bacterial infection', icon: '🥩' },
  { name: 'Unpasteurized Dairy', risk: 'Listeria risk', icon: '🧀' },
  { name: 'Raw Eggs', risk: 'Salmonella risk', icon: '🍳' },
  { name: 'High Mercury Fish', risk: 'Mercury toxicity', icon: '🐡' },
  { name: 'Alcohol', risk: 'Fetal alcohol syndrome', icon: '🍷' },
  { name: 'Excess Caffeine', risk: 'Limited to <200mg/day', icon: '☕' },
  { name: 'Raw Sprouts', risk: 'E. coli risk', icon: '🌱' },
  { name: 'Processed Meats', risk: 'Listeria risk', icon: '🌭' },
]

const HOSPITAL_BAG_ITEMS = [
  { category: 'For Mom', items: ['ID & insurance card', 'Birth plan', 'Comfortable clothes', 'Slippers', 'Toiletries', 'Nursing bras', 'Pads', 'Phone charger', 'Snacks & water', 'Lip balm'] },
  { category: 'For Baby', items: ['Going-home outfit', 'Onesies & sleepers', 'Swaddle blankets', 'Diapers (newborn size)', 'Baby wipes', 'Car seat (installed!)', 'Hat & socks', 'Blanket'] },
  { category: 'For Support', items: ['Comfortable clothes', 'Phone & charger', 'Camera', 'Snacks & drinks', 'Pillow & blanket', 'Music/entertainment', 'Massage oil', 'Birth affirmations'] },
]

const TRIMESTER_WORKOUTS: Record<string, { name: string; duration: string; benefit: string; icon: string }[]> = {
  first: [
    { name: 'Brisk Walking', duration: '20-30 min daily', benefit: 'Boosts circulation and energy', icon: '🚶' },
    { name: 'Prenatal Yoga', duration: '2-3x/week', benefit: 'Reduces stress and improves flexibility', icon: '🧘' },
    { name: 'Light Stretching', duration: '10 min daily', benefit: 'Relieves muscle tension', icon: '🤸' },
    { name: 'Kegel Exercises', duration: '3 sets daily', benefit: 'Strengthens pelvic floor', icon: '💪' },
  ],
  second: [
    { name: 'Swimming', duration: '30 min, 2x/week', benefit: 'Low impact, full body workout', icon: '🏊' },
    { name: 'Prenatal Dance', duration: '3x/week', benefit: 'Fun cardio + mood booster', icon: '💃' },
    { name: 'Prenatal Pilates', duration: '2x/week', benefit: 'Core strength for birth', icon: '🎯' },
    { name: 'Walking', duration: '30-45 min daily', benefit: 'Maintains cardiovascular health', icon: '🚶‍♀️' },
  ],
  third: [
    { name: 'Gentle Walking', duration: '20 min daily', benefit: 'Helps baby descend into pelvis', icon: '👣' },
    { name: 'Pelvic Tilts', duration: '10 reps, 2x/day', benefit: 'Eases back pain and prepares pelvis', icon: '🧘‍♀️' },
    { name: 'Birthing Ball Exercises', duration: 'Daily, 15 min', benefit: 'Opens pelvis and eases discomfort', icon: '⚽' },
    { name: 'Deep Breathing', duration: '5-10 min daily', benefit: 'Prepares for labor breathing', icon: '🌬️' },
  ],
}

const VACCINATION_SCHEDULE = [
  { week: 'Pre-conception', vaccine: 'MMR, Varicella', importance: 'Before becoming pregnant if not immune' },
  { week: 'Each flu season', vaccine: 'Influenza (Flu)', importance: 'Any trimester; reduces flu complications' },
  { week: 'Week 27-36', vaccine: 'Tdap', importance: 'Protects baby from whooping cough' },
  { week: 'After 20 weeks', vaccine: 'COVID-19', importance: 'Recommended to protect you and baby' },
]

const SCAN_SCHEDULE = [
  { week: 'Week 6-8', scan: 'Dating/Viability Scan', purpose: 'Confirm pregnancy, check heartbeat' },
  { week: 'Week 11-13', scan: 'NT Scan + Combined Screening', purpose: 'Screen for Down syndrome, trisomy 18' },
  { week: 'Week 18-22', scan: 'Anomaly Scan (Detailed)', purpose: 'Check all organs, determine gender if desired' },
  { week: 'Week 28', scan: 'Growth Scan', purpose: 'Assess baby size, position, fluid levels' },
  { week: 'Week 32', scan: 'Growth & Wellbeing Scan', purpose: 'Check growth, placenta, amniotic fluid' },
  { week: 'Week 36+', scan: 'Presentation Scan (if needed)', purpose: 'Confirm head-down position' },
]

function AnimatedCounter({ value, duration = 1.5, suffix = '', decimals = 0 }: { value: number; duration?: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const result = value * easeProgress
      setDisplay(decimals > 0 ? parseFloat(result.toFixed(decimals)) : Math.round(result))
      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, decimals])
  return <>{display.toFixed(decimals)}{suffix}</>
}

export default function PregnancyTracker() {
  const navigate = useNavigate()
  const profile = useProfile()
  const { addReminder, addAppointment } = useAppStore()
  const reminders = useReminders()

  const [isPregnant, setIsPregnant] = useState(profile?.pregnancyStatus === 'Yes' || profile?.pregnancyStatus === 'Pregnant')
  const [lastPeriodDate, setLastPeriodDate] = useState(profile?.lastPeriodDate || '')
  const [conceptionDate, setConceptionDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [weightEntries, setWeightEntries] = useState<{ date: string; weight: number }[]>([])
  const [waterIntake, setWaterIntake] = useState(0)
  const [waterGoal, setWaterGoal] = useState(10)
  const [kicksCount, setKicksCount] = useState<{ date: string; count: number; time: string }[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [newKickCount, setNewKickCount] = useState('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [contractions, setContractions] = useState<{ start: number; end: number | null }[]>([])
  const [isContractionTimerActive, setIsContractionTimerActive] = useState(false)
  const [currentContractionStart, setCurrentContractionStart] = useState<number | null>(null)

  const calculatedDueDate = useMemo(() => {
    if (dueDate) return new Date(dueDate)
    if (lastPeriodDate) {
      const lmp = new Date(lastPeriodDate)
      const due = new Date(lmp)
      due.setDate(due.getDate() + 280)
      return due
    }
    return null
  }, [lastPeriodDate, dueDate])

  const currentWeek = useMemo(() => {
    if (!calculatedDueDate) return 0
    const now = new Date()
    const diff = calculatedDueDate.getTime() - now.getTime()
    const weeksUntil = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7))
    const week = Math.max(0, Math.min(40, 40 - weeksUntil))
    return week
  }, [calculatedDueDate])

  const currentTrimester = useMemo(() => {
    if (currentWeek <= 12) return 0
    if (currentWeek <= 27) return 1
    return 2
  }, [currentWeek])

  const daysUntilDue = useMemo(() => {
    if (!calculatedDueDate) return 0
    const now = new Date()
    const diff = Math.max(0, Math.ceil((calculatedDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    return diff
  }, [calculatedDueDate])

  const pregnancyProgress = Math.min(100, (currentWeek / 40) * 100)
  const nearestDevelopment = FETAL_DEVELOPMENT.reduce((nearest, item) => {
    if (!nearest) return item
    return Math.abs(item.week - currentWeek) < Math.abs(nearest.week - currentWeek) ? item : nearest
  }, FETAL_DEVELOPMENT[0])

  const handleCalculateDueDate = () => {
    if (lastPeriodDate) {
      const lmp = new Date(lastPeriodDate)
      const due = new Date(lmp)
      due.setDate(due.getDate() + 280)
      setDueDate(due.toISOString().split('T')[0])
    }
  }

  const addWeightEntry = () => {
    if (!newWeight) return
    setWeightEntries(prev => [...prev, { date: new Date().toISOString().split('T')[0], weight: parseFloat(newWeight) }])
    setNewWeight('')
  }

  const addKickEntry = () => {
    if (!newKickCount) return
    setKicksCount(prev => [...prev, { date: new Date().toISOString().split('T')[0], count: parseInt(newKickCount), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setNewKickCount('')
  }

  const startContractionTimer = () => {
    const now = Date.now()
    setCurrentContractionStart(now)
    setIsContractionTimerActive(true)
  }

  const stopContractionTimer = () => {
    if (currentContractionStart) {
      setContractions(prev => [...prev.slice(-9), { start: currentContractionStart, end: Date.now() }])
    }
    setCurrentContractionStart(null)
    setIsContractionTimerActive(false)
  }

  const toggleChecklistItem = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getAverageContractionInterval = () => {
    if (contractions.length < 2) return null
    let total = 0
    for (let i = 1; i < contractions.length; i++) {
      total += contractions[i].start - contractions[i - 1].start
    }
    return Math.round((total / (contractions.length - 1)) / 1000 / 60)
  }

  const getAverageContractionDuration = () => {
    const completed = contractions.filter(c => c.end)
    if (completed.length === 0) return null
    const total = completed.reduce((sum, c) => sum + ((c.end || 0) - c.start), 0)
    return Math.round((total / completed.length) / 1000)
  }

  const tabButtons: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Heart className="w-4 h-4" /> },
    { key: 'weekly', label: 'Week Tracker', icon: <Calendar className="w-4 h-4" /> },
    { key: 'baby', label: 'Baby Growth', icon: <Baby className="w-4 h-4" /> },
    { key: 'health', label: 'Health Vitals', icon: <Activity className="w-4 h-4" /> },
    { key: 'nutrition', label: 'Nutrition', icon: <Apple className="w-4 h-4" /> },
    { key: 'exercise', label: 'Workout', icon: <Dumbbell className="w-4 h-4" /> },
    { key: 'checklist', label: 'Checklists', icon: <FileText className="w-4 h-4" /> },
    { key: 'contacts', label: 'Emergency', icon: <Phone className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-teal-50 py-6 lg:py-10 relative overflow-x-hidden">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl -z-10"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute bottom-0 left-1/4 w-[450px] h-[450px] rounded-full bg-purple-300/20 blur-3xl -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <BackToHomeButton />
          <div className="flex-1 min-w-0 text-center md:text-right">
            <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              🤰 Pregnancy Care Center
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1 md:justify-end justify-center">
              <Baby className="w-4 h-4 text-pink-500" />
              Your complete companion for a healthy pregnancy journey
            </p>
          </div>
        </div>

        {!isPregnant ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-pink-100/60 border border-white/60 p-8 md:p-12 text-center mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 mx-auto mb-6 rounded-[2.5rem] bg-gradient-to-br from-pink-400 via-purple-400 to-teal-400 flex items-center justify-center shadow-2xl"
            >
              <Baby className="w-16 h-16 text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-gray-800 mb-3">Start Your Pregnancy Journey</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Enter your last menstrual period date or your expected due date to unlock personalized tracking, week-by-week development, and expert guidance!
            </p>
            <div className="space-y-5 max-w-md mx-auto mb-8">
              <div className="text-left">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  Last Menstrual Period (LMP)
                </label>
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all"
                />
              </div>
              <div className="text-center text-gray-400 text-sm font-semibold">— OR —</div>
              <div className="text-left">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  Expected Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white font-medium transition-all"
                />
              </div>
              {lastPeriodDate && (
                <button
                  onClick={handleCalculateDueDate}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all"
                >
                  ✨ Calculate My Due Date
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => (lastPeriodDate || dueDate) && setIsPregnant(true)}
              disabled={!lastPeriodDate && !dueDate}
              className={`w-full max-w-md py-4.5 rounded-2xl font-black text-lg shadow-xl transition-all ${
                lastPeriodDate || dueDate
                  ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white hover:shadow-2xl shadow-pink-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              🎀 Begin Pregnancy Tracking
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-100/50 border border-white/60 overflow-hidden mb-8"
            >
              <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 p-6 md:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10 grid md:grid-cols-4 gap-6 items-center">
                  <div className="md:col-span-1 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-32 h-32 mx-auto rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30"
                    >
                      <div className="text-6xl">👶</div>
                    </motion.div>
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30">
                        Week {currentWeek} / 40
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30">
                        {TRIMESTER_INFO[currentTrimester].name}
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30">
                        {daysUntilDue} days until baby!
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black">
                      {calculatedDueDate ? `Due: ${calculatedDueDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : 'Set your due date above'}
                    </h2>
                    <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-300 via-white to-teal-200 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pregnancyProgress}%` }}
                        transition={{ duration: 2, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-white/80">
                      <span>Conception</span>
                      <span>{Math.round(pregnancyProgress)}% Complete</span>
                      <span>Baby's Birthday 🎂</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 md:p-8">
                {[
                  { label: 'Current Week', value: currentWeek, suffix: '', icon: <Calendar className="w-5 h-5" />, color: 'from-pink-400 to-rose-500' },
                  { label: 'Days to Go', value: daysUntilDue, suffix: '', icon: <Clock className="w-5 h-5" />, color: 'from-purple-400 to-violet-500' },
                  { label: 'Trimester', value: currentTrimester + 1, suffix: '/3', icon: <Award className="w-5 h-5" />, color: 'from-teal-400 to-cyan-500' },
                  { label: 'Baby Size', value: 0, suffix: '', icon: <Baby className="w-5 h-5" />, color: 'from-amber-400 to-orange-500', custom: nearestDevelopment.size },
                  { label: 'Milestone', value: 0, suffix: '', icon: <Star className="w-5 h-5" />, color: 'from-indigo-400 to-purple-500', custom: nearestDevelopment.milestone },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md mb-3`}>
                      {stat.icon}
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{stat.label}</div>
                    <div className="text-xl md:text-2xl font-black text-gray-800 leading-tight truncate">
                      {stat.custom ? (
                        stat.custom
                      ) : (
                        <>
                          <AnimatedCounter value={stat.value} />
                          {stat.suffix}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-2 px-2"
            >
              {tabButtons.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 text-white shadow-xl shadow-purple-200 scale-105'
                      : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md border border-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid lg:grid-cols-2 gap-6 mb-8"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-gradient-to-br ${TRIMESTER_INFO[currentTrimester].color} rounded-3xl p-7 md:p-8 text-white shadow-2xl relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/20 mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        {TRIMESTER_INFO[currentTrimester].weeks}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black mb-3">{TRIMESTER_INFO[currentTrimester].name}</h3>
                      <p className="text-white/90 leading-relaxed mb-6">{TRIMESTER_INFO[currentTrimester].description}</p>
                      <div className="space-y-2.5">
                        <div className="text-sm font-bold uppercase tracking-wide text-white/70 mb-3">This Trimester's Tips</div>
                        {TRIMESTER_INFO[currentTrimester].tips.map((tip, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.08 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
                          >
                            <div className="w-6 h-6 rounded-lg bg-white/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-white/95 text-sm font-medium leading-relaxed">{tip}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl shadow-teal-50 border border-white/60"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-cyan-500" />
                            Daily Water Tracker
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">Aim for {waterGoal} glasses for a healthy pregnancy!</p>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white shadow-lg"
                        >
                          💧
                        </motion.div>
                      </div>
                      <div className="mb-5">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-gray-700">{waterIntake} / {waterGoal} glasses</span>
                          <span className="font-bold text-cyan-600">{Math.round((waterIntake / waterGoal) * 100)}%</span>
                        </div>
                        <div className="w-full h-4 bg-cyan-50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (waterIntake / waterGoal) * 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-5">
                        {Array.from({ length: waterGoal }).map((_, i) => (
                          <motion.button
                            key={i}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1, y: -3 }}
                            onClick={() => i < waterIntake ? setWaterIntake(i) : setWaterIntake(i + 1)}
                            className={`aspect-square rounded-xl flex items-center justify-center text-lg transition-all ${
                              i < waterIntake
                                ? 'bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-lg shadow-cyan-200'
                                : 'bg-gray-50 border border-gray-100 opacity-50 hover:opacity-80'
                            }`}
                          >
                            💧
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}
                          className="flex-1 py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                        >
                          Remove 1
                        </button>
                        <button
                          onClick={() => setWaterIntake(Math.min(waterGoal, waterIntake + 1))}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          + Add Glass
                        </button>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-7 shadow-xl shadow-amber-50 border border-white/60"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <Footprints className="w-5 h-5 text-amber-500" />
                            Kick Counter
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">Track baby's daily movements! <span className="text-amber-600 font-semibold">Aim for 10 kicks in 2 hours</span></p>
                        </div>
                      </div>
                      {kicksCount.length > 0 && (
                        <div className="mb-5 space-y-2 max-h-32 overflow-y-auto pr-2">
                          {kicksCount.slice().reverse().slice(0, 5).map((kick, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                              <span className="font-bold text-gray-700">{kick.count} kicks</span>
                              <span className="text-sm text-gray-500">{kick.date} at {kick.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Number of kicks"
                          value={newKickCount}
                          onChange={(e) => setNewKickCount(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                        />
                        <button
                          onClick={addKickEntry}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'weekly' && (
                <motion.div
                  key="weekly"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white/60 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-purple-500" />
                        Week-by-Week Pregnancy Journey
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 4))}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-purple-600 px-4 py-2 rounded-xl bg-purple-50">Week {FETAL_DEVELOPMENT[selectedWeek].week}</span>
                        <button
                          onClick={() => setSelectedWeek(Math.min(FETAL_DEVELOPMENT.length - 1, selectedWeek + 1))}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
                      {FETAL_DEVELOPMENT.map((dev, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedWeek(i)}
                          className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                            selectedWeek === i
                              ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 text-white shadow-xl scale-110 z-10'
                              : dev.week === currentWeek
                              ? 'bg-pink-50 ring-2 ring-pink-400 text-pink-600'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          <span className="text-[10px] font-bold opacity-80">WEEK</span>
                          <span className="text-2xl font-black">{dev.week}</span>
                        </button>
                      ))}
                    </div>
                    <motion.div
                      key={selectedWeek}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid md:grid-cols-2 gap-6"
                    >
                      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-teal-50 border border-white">
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white shadow text-xs font-bold text-purple-600 border border-purple-100">
                          Size Reference
                        </div>
                        <div className="text-center py-6">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-8xl md:text-9xl mb-4"
                          >
                            {['🌰', '🫘', '🥑', '🍐', '🍌', '🌽', '🍆', '🥬', '🍈', '🍉'][selectedWeek] || '👶'}
                          </motion.div>
                          <div className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg shadow-purple-200">
                            About the size of a {FETAL_DEVELOPMENT[selectedWeek].size.toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white">
                              <Baby className="w-4 h-4" />
                            </div>
                            <h4 className="font-black text-gray-800 text-lg">Baby's Development</h4>
                          </div>
                          <p className="text-gray-600 leading-relaxed">{FETAL_DEVELOPMENT[selectedWeek].details}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white">
                              <Star className="w-4 h-4" />
                            </div>
                            <h4 className="font-black text-gray-800 text-lg">Milestone Achieved!</h4>
                          </div>
                          <p className="text-gray-600 font-semibold text-lg">{FETAL_DEVELOPMENT[selectedWeek].milestone}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <h4 className="font-black text-gray-800 text-lg">To-Do This Week</h4>
                          </div>
                          <div className="space-y-2">
                            {[
                              'Keep up with prenatal vitamins 📅',
                              'Stay hydrated - drink water regularly 💧',
                              'Take a gentle walk for 20 mins 🚶',
                              'Eat nutrient-rich meals 🍽️',
                              'Get plenty of rest 😴',
                            ].map((todo, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${checklist[`week-${selectedWeek}-${i}`] ? 'text-teal-500' : 'text-gray-300'}`} />
                                <button
                                  onClick={() => toggleChecklistItem(`week-${selectedWeek}-${i}`)}
                                  className={`text-left text-sm transition-colors ${
                                    checklist[`week-${selectedWeek}-${i}`] ? 'line-through text-gray-400' : 'text-gray-700 hover:text-teal-600'
                                  }`}
                                >
                                  {todo}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'baby' && (
                <motion.div
                  key="baby"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid lg:grid-cols-2 gap-6 mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                    <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                      <Baby className="w-6 h-6 text-pink-500" />
                      Fetal Development Timeline
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {FETAL_DEVELOPMENT.map((dev, i) => (
                        <div
                          key={i}
                          className={`relative p-4 rounded-2xl transition-all ${
                            dev.week <= currentWeek
                              ? 'bg-gradient-to-r from-pink-50 via-purple-50 to-teal-50 border border-pink-200'
                              : 'bg-gray-50 border border-gray-100 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl ${
                              dev.week <= currentWeek
                                ? 'bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-200'
                                : 'bg-gray-200'
                            }`}>
                              {['🌰', '🫘', '🥑', '🍐', '🍌', '🌽', '🍆', '🥬', '🍈', '🍉'][i]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-black ${dev.week <= currentWeek ? 'text-gray-800' : 'text-gray-500'}`}>Week {dev.week}</span>
                                <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">{dev.size}</span>
                                {dev.week <= currentWeek && (
                                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Done
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm truncate ${dev.week <= currentWeek ? 'text-gray-600' : 'text-gray-400'}`}>
                                {dev.milestone}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                      <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-500" />
                        Scan & Appointment Schedule
                      </h3>
                      <div className="space-y-3">
                        {SCAN_SCHEDULE.map((scan, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm">{scan.week}</span>
                              <button
                                onClick={() => {
                                  const apptDate = new Date()
                                  apptDate.setDate(apptDate.getDate() + 7)
                                  addAppointment({
                                    id: Date.now().toString(),
                                    doctorId: '1',
                                    doctorName: 'OB/GYN Doctor',
                                    specialty: scan.scan,
                                    date: apptDate.toISOString().split('T')[0],
                                    time: '10:00',
                                    hospital: profile?.preferredHospital || 'Hospital',
                                    notes: scan.purpose,
                                    status: 'upcoming',
                                  })
                                  addReminder({
                                    id: Date.now().toString() + '-rem',
                                    title: scan.scan,
                                    type: 'appointment',
                                    time: '09:00',
                                    date: apptDate.toISOString().split('T')[0],
                                    notes: scan.purpose,
                                    enabled: true,
                                  })
                                }}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold shadow hover:shadow-lg transition-all"
                              >
                                + Schedule
                              </button>
                            </div>
                            <h4 className="font-bold text-gray-800">{scan.scan}</h4>
                            <p className="text-sm text-gray-600 mt-1">{scan.purpose}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                      <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                        <Pill className="w-6 h-6 text-teal-500" />
                        Recommended Vaccinations
                      </h3>
                      <div className="space-y-3">
                        {VACCINATION_SCHEDULE.map((vac, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-black text-teal-700 bg-white px-3 py-1 rounded-xl shadow-sm text-xs">{vac.week}</span>
                              <h4 className="font-bold text-gray-800">{vac.vaccine}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{vac.importance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'health' && (
                <motion.div
                  key="health"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid lg:grid-cols-2 gap-6 mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <Scale className="w-6 h-6 text-rose-500" />
                        Weight Gain Tracker
                      </h3>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        <Plus className="w-4 h-4" /> Log Weight
                      </button>
                    </div>
                    <AnimatePresence>
                      {showAddModal && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-5 rounded-2xl bg-rose-50 border border-rose-100"
                        >
                          <div className="flex gap-3">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Weight in kg"
                              value={newWeight}
                              onChange={(e) => setNewWeight(e.target.value)}
                              className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400 font-bold"
                            />
                            <button
                              onClick={() => { addWeightEntry(); setShowAddModal(false) }}
                              className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold shadow-lg"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setShowAddModal(false)}
                              className="px-4 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {weightEntries.length > 0 ? (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                        {weightEntries.slice().reverse().map((entry, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                                {i + 1}
                              </div>
                              <div>
                                <div className="font-black text-gray-800">{entry.weight} kg</div>
                                <div className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => setWeightEntries(prev => prev.filter((_, idx) => idx !== weightEntries.length - 1 - i))}
                              className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center text-4xl">⚖️</div>
                        <p className="font-bold text-gray-500">No weight logs yet</p>
                        <p className="text-sm">Track your pregnancy weight gain weekly!</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                          <Activity className="w-6 h-6 text-violet-500" />
                          Contraction Timer
                        </h3>
                        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
                          Time labor contractions
                        </span>
                      </div>
                      <div className="text-center mb-6">
                        {isContractionTimerActive ? (
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-44 h-44 mx-auto rounded-full bg-gradient-to-br from-red-400 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-rose-200 cursor-pointer"
                            onClick={stopContractionTimer}
                          >
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Contracting... Tap when done</div>
                              <ContractionTimer />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startContractionTimer}
                            className="w-44 h-44 mx-auto rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white shadow-2xl shadow-purple-200"
                          >
                            <div>
                              <div className="text-5xl mb-2">⏱️</div>
                              <div className="font-black text-lg">START</div>
                              <div className="text-xs opacity-80 uppercase tracking-wide">Tap at contraction start</div>
                            </div>
                          </motion.button>
                        )}
                      </div>
                      {(getAverageContractionInterval() || getAverageContractionDuration()) && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {getAverageContractionInterval() && (
                            <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                              <div className="text-xs font-bold uppercase text-violet-500 mb-1">Avg Interval</div>
                              <div className="text-2xl font-black text-violet-700">{getAverageContractionInterval()} <span className="text-sm font-bold">min</span></div>
                            </div>
                          )}
                          {getAverageContractionDuration() && (
                            <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 text-center">
                              <div className="text-xs font-bold uppercase text-pink-500 mb-1">Avg Duration</div>
                              <div className="text-2xl font-black text-pink-700">{getAverageContractionDuration()} <span className="text-sm font-bold">sec</span></div>
                            </div>
                          )}
                        </div>
                      )}
                      {contractions.length > 0 && (
                        <div className="text-center text-xs font-bold text-green-600 bg-green-50 rounded-xl p-3">
                          {contractions.length} contraction{contractions.length > 1 ? 's' : ''} logged
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border border-red-100">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <h4 className="font-black text-gray-800">When to Go to Hospital</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1.5">
                          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Contractions every 5 min</li>
                          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Water breaks</li>
                          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Heavy bleeding</li>
                          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Severe abdominal pain</li>
                          <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Baby movements decrease</li>
                        </ul>
                      </div>
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Thermometer className="w-5 h-5 text-amber-500" />
                          <h4 className="font-black text-gray-800">Warning Signs</h4>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1.5">
                          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> Severe headaches</li>
                          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> Blurred vision</li>
                          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> Sudden swelling</li>
                          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> High fever</li>
                          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> Painful urination</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'nutrition' && (
                <motion.div
                  key="nutrition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid lg:grid-cols-2 gap-6 mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white shadow-lg">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-800">Pregnancy Superfoods</h3>
                        <p className="text-sm text-gray-500">Nutrient-dense foods to eat regularly</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {SAFE_FOODS.map((food, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ y: -3, scale: 1.02 }}
                          className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100"
                        >
                          <div className="text-4xl mb-2">{food.icon}</div>
                          <h4 className="font-black text-gray-800 mb-0.5">{food.name}</h4>
                          <p className="text-xs text-green-700 font-semibold">{food.benefit}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
                          <X className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-800">Foods to Avoid</h3>
                          <p className="text-sm text-gray-500">Protect your baby from potential risks</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {FOODS_TO_AVOID.map((food, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100"
                          >
                            <div className="text-4xl mb-2 opacity-70">{food.icon}</div>
                            <h4 className="font-black text-gray-800 mb-0.5 text-sm">{food.name}</h4>
                            <p className="text-[11px] text-red-700 font-bold">{food.risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-7 text-white shadow-2xl">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
                          🍽️
                        </div>
                        <div>
                          <h3 className="text-xl font-black">Trimester Meal Tips</h3>
                          <p className="text-white/80 text-sm">Eating right for every stage</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { trim: '1st Trimester', tip: 'Focus on folate-rich foods. Bland carbs may ease nausea. Small, frequent meals!' },
                          { trim: '2nd Trimester', tip: 'Increase protein and calcium intake. Baby is growing rapidly! Add omega-3s for brain development.' },
                          { trim: '3rd Trimester', tip: 'Extra protein and iron needed. Fiber helps with constipation. Stay hydrated!' },
                        ].map((item, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                            <div className="font-black text-white mb-1">{item.trim}</div>
                            <p className="text-sm text-white/90">{item.tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'exercise' && (
                <motion.div
                  key="exercise"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 md:p-8 shadow-xl border border-white/60">
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2">
                          <Dumbbell className="w-6 h-6 text-emerald-500" />
                          Pregnancy-Safe Workouts by Trimester
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Always consult your doctor before starting a new exercise routine 💚</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                        <div className="text-xs font-bold uppercase text-emerald-600 mb-1">Currently in</div>
                        <div className="font-black text-emerald-700 text-lg">{TRIMESTER_INFO[currentTrimester].name}</div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      {(['first', 'second', 'third'] as const).map((trimKey, trimIdx) => (
                        <div
                          key={trimKey}
                          className={`rounded-3xl overflow-hidden border-2 transition-all ${
                            trimIdx === currentTrimester
                              ? `border-transparent shadow-2xl scale-[1.02] bg-gradient-to-br ${TRIMESTER_INFO[trimIdx].color}`
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          <div className={`p-5 md:p-6 ${trimIdx === currentTrimester ? 'text-white' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className={`font-black text-lg ${trimIdx === currentTrimester ? 'text-white' : 'text-gray-800'}`}>
                                {TRIMESTER_INFO[trimIdx].name}
                              </h4>
                              {trimIdx === currentTrimester && (
                                <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-sm text-xs font-bold border border-white/20">
                                  Now 🎯
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="bg-white rounded-[1.4rem] m-3 md:m-4 p-5 space-y-3">
                            {TRIMESTER_WORKOUTS[trimKey].map((workout, i) => (
                              <motion.div
                                key={i}
                                whileHover={{ x: 4, scale: 1.01 }}
                                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                  {workout.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-black text-gray-800">{workout.name}</div>
                                  <div className="text-xs font-bold text-emerald-600">{workout.duration}</div>
                                  <div className="text-xs text-gray-500 truncate">{workout.benefit}</div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 grid md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                        <h4 className="font-black text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white text-lg">💪</div>
                          Kegel Exercise Guide
                        </h4>
                        <ol className="space-y-3 text-gray-600 text-sm">
                          <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">1</span>Find your pelvic floor muscles (the ones you use to stop urine flow)</li>
                          <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">2</span>Tighten the muscles and hold for 3-5 seconds</li>
                          <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">3</span>Relax for 3-5 seconds</li>
                          <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">4</span>Repeat 10-15 times, 3 sets daily</li>
                        </ol>
                      </div>
                      <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
                        <h4 className="font-black text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-lg">⚠️</div>
                          Exercise Safety Rules
                        </h4>
                        <ul className="space-y-2.5 text-gray-600 text-sm">
                          {[
                            'Stay hydrated before, during & after exercise',
                            'Avoid exercises lying flat on back after 16 weeks',
                            'Wear supportive, non-slip shoes always',
                            'Eat a small snack 30 min before working out',
                            'Stop if you feel pain, dizziness, or bleeding',
                            'Aim for at least 150 minutes of moderate exercise per week',
                            'Avoid contact sports and high fall-risk activities',
                            'Modify intensity as your pregnancy progresses',
                          ].map((rule, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'checklist' && (
                <motion.div
                  key="checklist"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8"
                >
                  <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    {HOSPITAL_BAG_ITEMS.map((section, secIdx) => (
                      <motion.div
                        key={secIdx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: secIdx * 0.1 }}
                        className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60"
                      >
                        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${['from-pink-400 to-rose-500', 'from-purple-400 to-violet-500', 'from-teal-400 to-cyan-500'][secIdx]} flex items-center justify-center text-white shadow-lg text-lg`}>
                            {['👩', '👶', '❤️'][secIdx]}
                          </div>
                          {section.category}
                          <div className="ml-auto text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                            {section.items.filter((_, i) => checklist[`bag-${secIdx}-${i}`]).length}/{section.items.length}
                          </div>
                        </h3>
                        <div className="space-y-2">
                          {section.items.map((item, i) => (
                            <label
                              key={i}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${
                                checklist[`bag-${secIdx}-${i}`] ? 'bg-gradient-to-r from-green-50 to-teal-50 border border-green-100' : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleChecklistItem(`bag-${secIdx}-${i}`)}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                  checklist[`bag-${secIdx}-${i}`]
                                    ? 'bg-gradient-to-br from-green-400 to-teal-500 text-white shadow-md'
                                    : 'border-2 border-gray-200 group-hover:border-green-300'
                                }`}
                              >
                                {checklist[`bag-${secIdx}-${i}`] && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <span className={`font-semibold transition-all ${checklist[`bag-${secIdx}-${i}`] ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                {item}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <h3 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white shadow-lg">
                          📋
                        </div>
                        Birth Plan Checklist
                      </h3>
                      <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">
                        Discuss these with your doctor and birth partner 💜
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      {[
                        {
                          title: 'Labor Preferences',
                          items: ['Natural birth without pain meds', 'Epidural available', 'IV pain medication if needed', 'Water birth / tub labor', 'Birthing ball available', 'Freedom to walk around'],
                          color: 'from-pink-400 to-rose-500',
                        },
                        {
                          title: 'Environment',
                          items: ['Dimmed lights', 'Music playlist ready', 'Essential oils (diffuser)', 'Own pillow / blanket', 'No unnecessary interventions', 'Birth partner present'],
                          color: 'from-purple-400 to-violet-500',
                        },
                        {
                          title: 'After Baby Is Born',
                          items: ['Immediate skin-to-skin contact', 'Delay cord clamping (30-60 sec)', 'Rooming-in (baby stays with me)', 'Breastfeeding support', 'Baby first bath delayed', 'Save placenta (if desired)'],
                          color: 'from-teal-400 to-cyan-500',
                        },
                        {
                          title: 'Post Delivery',
                          items: ['No visitors for first 24 hours', 'Limited photos of baby shared', 'Help with baby baths & diapers', 'Meal train support lined up', 'Contact lactation consultant', 'Plan for rest & recovery'],
                          color: 'from-amber-400 to-orange-500',
                        },
                      ].map((group, gIdx) => (
                        <div key={gIdx} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center text-white shadow-sm`}>
                              <Check className="w-4 h-4" />
                            </div>
                            <h4 className="font-black text-gray-800">{group.title}</h4>
                          </div>
                          <div className="space-y-2">
                            {group.items.map((item, i) => (
                              <label
                                key={i}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                                  checklist[`birth-${gIdx}-${i}`] ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem(`birth-${gIdx}-${i}`)}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                                    checklist[`birth-${gIdx}-${i}`]
                                      ? `bg-gradient-to-br ${group.color} text-white shadow-sm`
                                      : 'border-2 border-gray-200'
                                  }`}
                                >
                                  {checklist[`birth-${gIdx}-${i}`] && <Check className="w-3 h-3" />}
                                </button>
                                <span className={`text-sm transition-all ${checklist[`birth-${gIdx}-${i}`] ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                                  {item}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'contacts' && (
                <motion.div
                  key="contacts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid lg:grid-cols-2 gap-6 mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 overflow-hidden">
                    <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-6 md:p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-5">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl border-4 border-white/30"
                          >
                            🚨
                          </motion.div>
                          <div>
                            <h3 className="text-2xl md:text-3xl font-black">Emergency Contacts</h3>
                            <p className="text-white/85 font-medium">Tap any number to quickly dial</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-5 md:py-6 rounded-3xl bg-white text-red-600 font-black text-xl md:text-2xl shadow-2xl shadow-red-900/20 hover:shadow-red-900/40 transition-all flex items-center justify-center gap-3"
                        >
                          <Phone className="w-7 h-7 md:w-8 md:h-8" />
                          SOS - CALL EMERGENCY SERVICES
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-4">
                      {[
                        { name: 'Emergency Ambulance', number: '108', icon: '🚑', type: 'Medical Emergency', color: 'from-red-400 to-rose-500' },
                        { name: 'Police Emergency', number: '100', icon: '🚓', type: 'Police / Safety', color: 'from-blue-400 to-indigo-500' },
                        { name: 'Women Helpline', number: '1091', icon: '👩‍❤️‍👩', type: 'Women Support', color: 'from-pink-400 to-fuchsia-500' },
                        { name: 'Pregnancy Helpline', number: '1800-180-11104', icon: '🤰', type: 'Pregnancy Support', color: 'from-purple-400 to-violet-500' },
                        { name: 'Mental Health Helpline', number: '1800-599-0019', icon: '💚', type: 'Mental Wellness', color: 'from-emerald-400 to-teal-500' },
                      ].map((contact, i) => (
                        <motion.a
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          href={`tel:${contact.number}`}
                          whileHover={{ x: 6, scale: 1.01 }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-pink-50 border border-gray-100 hover:border-pink-100 transition-all group"
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                            {contact.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-gray-800 text-lg">{contact.name}</div>
                            <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">{contact.type}</div>
                            <div className="text-xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{contact.number}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Phone className="w-5 h-5" />
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                      <h3 className="text-xl font-black text-gray-800 mb-5 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-blue-500" />
                        Nearby Healthcare
                      </h3>
                      <div className="space-y-3">
                        {[
                          { name: profile?.preferredHospital || 'City Women\'s Hospital', type: 'Maternity Hospital', km: '2.3 km', rating: '4.8★', hours: '24/7 Open', phone: profile?.emergencyContact || '+1-555-0100' },
                          { name: 'Women & Child Clinic', type: 'Gynecology Clinic', km: '3.7 km', rating: '4.6★', hours: '9AM - 8PM', phone: '+1-555-0200' },
                          { name: 'Emergency Medical Center', type: 'General Hospital', km: '1.2 km', rating: '4.7★', hours: '24/7 Open', phone: '+1-555-0300' },
                          { name: 'Radiology & Scans', type: 'Diagnostic Center', km: '3.1 km', rating: '4.5★', hours: '7AM - 10PM', phone: '+1-555-0400' },
                        ].map((hc, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-100"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-md flex-shrink-0 text-xl">
                                🏥
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-black text-gray-800">{hc.name}</h4>
                                  <span className="text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-2 py-0.5 rounded-full">{hc.rating}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{hc.type}</span>
                                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">📍 {hc.km}</span>
                                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{hc.hours}</span>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={`tel:${hc.phone}`}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                                  >
                                    <Phone className="w-4 h-4" /> Call
                                  </a>
                                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors">
                                    <MapPin className="w-4 h-4" /> Navigate
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/60">
                      <div className="flex items-center gap-2 mb-5">
                        <Stethoscope className="w-6 h-6 text-pink-500" />
                        <h3 className="text-xl font-black text-gray-800">Your Doctor</h3>
                      </div>
                      {profile?.doctorName || profile?.preferredHospital ? (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-violet-50 border border-pink-100">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 via-purple-400 to-violet-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                              👩‍⚕️
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black text-gray-800 text-lg">{profile?.doctorName || 'Your OB/GYN Doctor'}</div>
                              <div className="text-sm text-purple-600 font-semibold">{profile?.preferredHospital || 'Pregnancy Care Specialist'}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`tel:${profile?.emergencyContact || '+1-555-0000'}`}
                              className="py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                              <Phone className="w-4 h-4" /> Quick Call
                            </a>
                            <button
                              onClick={() => navigate('/doctor-chat/1')}
                              className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                              💬 Chat Now
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400 rounded-2xl bg-gray-50">
                          <div className="text-5xl mb-3">👩‍⚕️</div>
                          <p className="font-bold text-gray-500 mb-1">No doctor added yet</p>
                          <p className="text-sm">Visit your Profile page to add your care provider</p>
                          <button
                            onClick={() => navigate('/profile')}
                            className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-md"
                          >
                            + Add Doctor
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}

function ContractionTimer() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return (
    <div className="text-5xl font-black font-mono mt-2">
      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
    </div>
  )
}
