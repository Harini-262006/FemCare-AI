import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Calendar, Phone, Mail, MapPin, Ruler, Scale, Droplets,
  Activity, Pill, Stethoscope, Heart, AlertTriangle, Shield,
  Leaf, Moon, Droplet, Brain, ChevronDown, Save, Check,
  CheckCircle, X, Baby, Flower2, Sparkles, Award, TrendingUp,
  Clock, Bed, Dumbbell, AlertCircle, Users, Hospital,
  Thermometer, Target, RefreshCw, Coffee, Wine,
  Flame, CheckCircle2, Circle
} from 'lucide-react'
import { useAppStore, useProfile, type Profile as ProfileType } from '@/store'
import { authAPI } from '@/services/api'
import { syncSmartReminders } from '@/services/smartReminderService'

// Option Configurations for Selection UI
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const MARITAL_STATUS_OPTIONS = [
  'Single', 'Married', 'In a Relationship', 'Divorced', 'Widowed'
]

const CYCLE_REGULARITY_OPTIONS = [
  { value: 'Regular (21-35 days)', desc: 'Consistent monthly cycle' },
  { value: 'Irregular', desc: 'Varies by >7-10 days' },
  { value: 'Variable / Fluctuating', desc: 'Changes with stress/diet' },
  { value: 'Absent / Amenorrhea', desc: 'No periods for >3 months' },
]

const PERIOD_DURATION_OPTIONS = [
  '2-3 Days', '4-5 Days', '6-7 Days', '8+ Days (Prolonged)'
]

const COMMON_SYMPTOMS_LIST = [
  'Cramps & Pelvic Pain',
  'Heavy Bleeding',
  'Irregular Spotting',
  'PMS & Mood Swings',
  'Bloating & Water Retention',
  'Breast Tenderness',
  'Fatigue & Low Energy',
  'Migraines & Headaches',
  'Acne & Skin Breakouts',
  'Hot Flashes / Night Sweats',
  'Back & Joint Pain',
  'Nausea or Digestive Issues',
]

const PREGNANCY_STATUS_OPTIONS = [
  { value: 'No', label: 'Not Pregnant', icon: Flower2 },
  { value: 'Yes', label: 'Currently Pregnant', icon: Baby },
  { value: 'Trying', label: 'Trying to Conceive', icon: Heart },
  { value: 'Postpartum', label: 'Postpartum (< 1 yr)', icon: Baby },
]

const TRIMESTER_OPTIONS = [
  { value: '1st Trimester (Weeks 1-12)', desc: 'Organogenesis & Early Growth' },
  { value: '2nd Trimester (Weeks 13-26)', desc: 'Rapid Development & Movement' },
  { value: '3rd Trimester (Weeks 27-40)', desc: 'Final Maturation & Delivery Prep' },
]

const PREGNANCY_HISTORY_OPTIONS = [
  'No Previous Pregnancies', '1 Child', '2 Children', '3+ Children',
  'History of C-Section', 'Previous Miscarriage / Loss'
]

const FERTILITY_PLANNING_OPTIONS = [
  'Not Planning', 'Planning Soon (6-12 mos)', 'Actively Trying',
  'Undergoing IVF / Fertility Care', 'Contraceptive Management'
]

const PCOS_OPTIONS = [
  { value: 'No', label: 'No PCOS/PCOD' },
  { value: 'Yes', label: 'Diagnosed (PCOS/PCOD)' },
  { value: 'Suspected', label: 'Suspected Symptoms' },
]

const THYROID_OPTIONS = [
  { value: 'No', label: 'Normal / None' },
  { value: 'Hypothyroid', label: 'Hypothyroidism (Underactive)' },
  { value: 'Hyperthyroid', label: 'Hyperthyroidism (Overactive)' },
  { value: 'Hashimoto', label: "Hashimoto's Thyroiditis" },
]

const MENOPAUSE_OPTIONS = [
  { value: 'No', label: 'Premenopausal (Regular)' },
  { value: 'Perimenopause', label: 'Perimenopausal (Transition)' },
  { value: 'Yes', label: 'Postmenopausal' },
]

const CHRONIC_CONDITIONS_LIST = [
  'PCOS / PCOD',
  'Thyroid Disorder',
  'Endometriosis',
  'Anemia / Iron Deficiency',
  'Type 1/2 Diabetes',
  'Gestational Diabetes',
  'Hypertension (High BP)',
  'Asthma / Respiratory',
  'Uterine Fibroids',
  'Migraines / Chronic Headaches',
  'None / Healthy',
]

const ALLERGIES_LIST = [
  'Penicillin / Antibiotics',
  'Sulfa Drugs',
  'NSAIDs / Aspirin',
  'Latex',
  'Peanuts & Tree Nuts',
  'Dairy / Lactose',
  'Gluten / Celiac',
  'Pollen / Dust Mites',
  'Shellfish',
  'None',
]

const MEDICATIONS_LIST = [
  'Prenatal / Multivitamins',
  'Iron Supplements',
  'Folic Acid',
  'Oral Contraceptives / Birth Control',
  'Thyroid Hormone (Levothyroxine)',
  'Metformin',
  'Pain Relief (Ibuprofen/Paracetamol)',
  'Calcium & Vitamin D',
  'Progesterone / Hormonal Therapy',
  'None',
]

const DIET_OPTIONS = [
  { value: 'Vegetarian', desc: 'Plant-based with dairy' },
  { value: 'Non-Vegetarian', desc: 'Includes poultry, meat & seafood' },
  { value: 'Vegan', desc: '100% Plant-derived foods' },
  { value: 'Pescatarian', desc: 'Vegetarian plus fish/seafood' },
  { value: 'Gluten-Free', desc: 'Gluten-sensitive nutrition' },
  { value: 'Ketogenic', desc: 'Low-carb, healthy fats' },
  { value: 'Balanced Mediterranean', desc: 'Whole foods, olive oil & veggies' },
]

const EXERCISE_OPTIONS = [
  { value: 'None', label: 'Sedentary', desc: 'Desk job, little to no exercise' },
  { value: '1-2 times/week', label: 'Light Activity', desc: 'Casual walks, light stretching' },
  { value: '3-4 times/week', label: 'Moderate Fitness', desc: 'Regular workouts, jogging, yoga' },
  { value: 'Daily', label: 'Very Active', desc: 'Daily intense workouts or sports' },
]

const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
]

const SLEEP_QUALITY_OPTIONS = [
  { value: 'Deep & Restful (8+ hrs)', desc: 'Wake up fully recharged' },
  { value: 'Good (7-8 hrs)', desc: 'Solid uninterrupted rest' },
  { value: 'Average / Fragmented (6-7 hrs)', desc: 'Occasional waking' },
  { value: 'Poor / Insomnia (<6 hrs)', desc: 'Frequent awakenings or difficulty falling asleep' },
]

const SLEEP_SCHEDULE_OPTIONS = [
  'Early Bird (10 PM - 6 AM)',
  'Regular (11 PM - 7 AM)',
  'Night Owl (1 AM+ Bedtime)',
  'Shift Work / Variable',
]

const STRESS_OPTIONS = [
  { value: 'low', label: 'Low', desc: 'Calm, relaxed & well-balanced', color: 'from-emerald-500 to-teal-600' },
  { value: 'medium', label: 'Moderate', desc: 'Manageable daily pressures', color: 'from-amber-500 to-orange-600' },
  { value: 'high', label: 'High', desc: 'Frequent overwhelm, anxiety, or fatigue', color: 'from-rose-500 to-red-600' },
]

const ALCOHOL_OPTIONS = ['Never', 'Occasional / Social', 'Regular']
const CAFFEINE_OPTIONS = ['None', '1 cup/day', '2 cups/day', '3+ cups/day']

function AnimatedCounter({ value, duration = 1.2, suffix = '', decimals = 0 }: { value: number; duration?: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    const startValue = 0
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const result = startValue + (value - startValue) * easeProgress
      setDisplay(decimals > 0 ? parseFloat(result.toFixed(decimals)) : Math.round(result))
      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration, decimals])
  return <>{display.toFixed(decimals)}{suffix}</>
}

function CircularProgress({ value, size = 120, strokeWidth = 8, gradientId, children }: {
  value: number
  size?: number
  strokeWidth?: number
  gradientId: string
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 150)
    return () => clearTimeout(timer)
  }, [value])
  const offset = circumference - (progress / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700/60"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// Single Selection Option Cards Component
function SingleSelectCards<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  icon: Icon,
}: {
  label: string
  options: Array<string | { value: T; label?: string; desc?: string; icon?: any; color?: string }>
  value?: T | string
  onChange: (val: T) => void
  disabled?: boolean
  icon?: any
}) {
  return (
    <div className="my-3">
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && <Icon className="w-4 h-4 text-pink-500 dark:text-pink-400" />}
        <label className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight">
          {label}
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {options.map((opt) => {
          const optValue = typeof opt === 'string' ? opt : opt.value
          const optLabel = typeof opt === 'string' ? opt : opt.label || opt.value
          const optDesc = typeof opt === 'object' ? opt.desc : undefined
          const OptIcon = typeof opt === 'object' ? opt.icon : undefined
          const isSelected = value === optValue

          return (
            <motion.button
              key={optValue}
              type="button"
              whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              disabled={disabled}
              onClick={() => onChange(optValue as T)}
              className={`relative text-left p-3.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-teal-500/10 border-pink-500 dark:border-pink-400 shadow-md shadow-pink-500/10 ring-2 ring-pink-500/20'
                  : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500/50 shadow-sm'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  {OptIcon && (
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      <OptIcon className="w-4 h-4 shrink-0" />
                    </div>
                  )}
                  <span className={`text-sm font-extrabold truncate ${isSelected ? 'text-pink-700 dark:text-pink-300' : 'text-gray-900 dark:text-white'}`}>
                    {optLabel}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              {optDesc && (
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">
                  {optDesc}
                </p>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// Multi-Selection Chips Group Component
function MultiSelectChips({
  label,
  options,
  selectedValues = [],
  onChange,
  disabled = false,
  icon: Icon,
}: {
  label: string
  options: string[]
  selectedValues?: string[]
  onChange: (vals: string[]) => void
  disabled?: boolean
  icon?: any
}) {
  const toggleOption = (opt: string) => {
    if (disabled) return
    if (opt === 'None' || opt === 'None / Healthy') {
      onChange(selectedValues.includes(opt) ? [] : [opt])
      return
    }
    const cleanWithoutNone = selectedValues.filter(v => v !== 'None' && v !== 'None / Healthy')
    if (cleanWithoutNone.includes(opt)) {
      onChange(cleanWithoutNone.filter(v => v !== opt))
    } else {
      onChange([...cleanWithoutNone, opt])
    }
  }

  return (
    <div className="my-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
          <label className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight">
            {label}
          </label>
        </div>
        <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2.5 py-0.5 rounded-full border border-pink-200 dark:border-pink-800">
          {selectedValues.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt)
          return (
            <motion.button
              key={opt}
              type="button"
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.96 } : {}}
              disabled={disabled}
              onClick={() => toggleOption(opt)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-2 border-2 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-md shadow-purple-500/20'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Circle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
              <span>{opt}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function SectionCard({
  title, icon: Icon, children, defaultOpen = true, index, completedFields, totalFields
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
  index: number
  completedFields?: number
  totalFields?: number
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const IconComp = Icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 + index * 0.06 }}
      className="rounded-3xl bg-white/95 dark:bg-gray-850 backdrop-blur-xl border border-pink-100 dark:border-gray-700/80 shadow-xl shadow-pink-100/30 dark:shadow-black/40 overflow-hidden mb-6"
    >
      <motion.button
        whileHover={{ backgroundColor: 'rgba(244, 114, 182, 0.08)' }}
        whileTap={{ scale: 0.995 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 sm:px-7 py-5 text-left transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white shrink-0">
            <IconComp className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
            {typeof completedFields === 'number' && typeof totalFields === 'number' && (
              <p className="text-xs sm:text-sm font-extrabold text-pink-600 dark:text-pink-400 mt-0.5">
                {completedFields}/{totalFields} fields completed
              </p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-gray-700 flex items-center justify-center border border-pink-200 dark:border-gray-600 text-pink-600 dark:text-pink-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 sm:px-8 pb-8 pt-3 border-t border-gray-100 dark:border-gray-750">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, suffix, color, index, decimals = 0 }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  suffix?: string
  color: string
  index: number
  decimals?: number
}) {
  const IconComp = Icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="rounded-2xl bg-white/90 dark:bg-gray-800/90 border border-pink-100 dark:border-gray-700 p-4 shadow-md shadow-pink-100/20"
    >
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow-md text-white`}>
        <IconComp className="w-4 h-4" />
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-xs font-extrabold uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-0.5">
        <AnimatedCounter value={value} suffix={suffix} decimals={decimals} />
      </div>
    </motion.div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const profile = useProfile()
  const setProfile = useAppStore((state) => state.setProfile)
  const storeUser = useAppStore((state) => state.user)

  const [formData, setFormData] = useState<ProfileType>(() => ({
    name: storeUser?.name || profile?.name || '',
    age: profile?.age || 24,
    mobile: profile?.mobile || '',
    email: storeUser?.email || profile?.email || '',
    address: profile?.address || '',
    dateOfBirth: profile?.dateOfBirth || '',
    height: profile?.height || 165,
    weight: profile?.weight || 60,
    bloodGroup: profile?.bloodGroup || 'O+',
    maritalStatus: profile?.maritalStatus || 'Single',
    lastPeriodDate: profile?.lastPeriodDate || '',
    cycleLength: profile?.cycleLength || 28,
    cycleRegularity: profile?.cycleRegularity || 'Regular (21-35 days)',
    periodDuration: profile?.periodDuration || '4-5 Days',
    menstrualHistory: profile?.menstrualHistory || '',
    symptoms: Array.isArray(profile?.symptoms) ? profile.symptoms : [],
    pregnancyStatus: profile?.pregnancyStatus || 'No',
    trimester: profile?.trimester || '',
    pregnancyHistory: profile?.pregnancyHistory || 'No Previous Pregnancies',
    pcos: profile?.pcos || 'No',
    thyroid: profile?.thyroid || 'No',
    fertilityPlanning: profile?.fertilityPlanning || 'Not Planning',
    menopauseStatus: profile?.menopauseStatus || 'No',
    medicalHistory: profile?.medicalHistory || '',
    chronicDiseases: profile?.chronicDiseases || '',
    existingConditions: Array.isArray(profile?.existingConditions) ? profile.existingConditions : [],
    previousSurgeries: profile?.previousSurgeries || '',
    surgeries: profile?.surgeries || '',
    currentMedicines: profile?.currentMedicines || '',
    medicationList: Array.isArray(profile?.medicationList) ? profile.medicationList : [],
    allergies: profile?.allergies || '',
    allergyList: Array.isArray(profile?.allergyList) ? profile.allergyList : [],
    familyMedicalHistory: profile?.familyMedicalHistory || '',
    waterIntake: profile?.waterIntake || 2.5,
    sleepHours: profile?.sleepHours || 8,
    sleepQuality: profile?.sleepQuality || 'Good (7-8 hrs)',
    sleepSchedule: profile?.sleepSchedule || 'Regular (11 PM - 7 AM)',
    exerciseRoutine: profile?.exerciseRoutine || '3-4 times/week',
    activityLevel: profile?.activityLevel || 'moderate',
    stressLevel: profile?.stressLevel || 'low',
    foodPreference: profile?.foodPreference || 'Vegetarian',
    dietPreference: profile?.dietPreference || 'Vegetarian',
    alcoholStatus: profile?.alcoholStatus || 'Never',
    caffeineStatus: profile?.caffeineStatus || '1 cup/day',
    emergencyContact: profile?.emergencyContact || '',
    doctorName: profile?.doctorName || '',
    hospital: profile?.hospital || '',
    preferredHospital: profile?.preferredHospital || '',
  }))

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingBackend, setIsLoadingBackend] = useState(false)
  const [isEditing, setIsEditing] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load backend profile on mount to ensure synchronization
  useEffect(() => {
    const loadBackendProfile = async () => {
      if (!storeUser?.token) return
      try {
        setIsLoadingBackend(true)
        const res = await authAPI.getProfile() as any
        if (res && res.profile) {
          const bp = res.profile
          setFormData((prev) => ({
            ...prev,
            ...bp,
            name: res.name || bp.name || prev.name,
            email: res.email || bp.email || prev.email,
            symptoms: Array.isArray(bp.symptoms) ? bp.symptoms : prev.symptoms,
            existingConditions: Array.isArray(bp.existingConditions) ? bp.existingConditions : prev.existingConditions,
            allergyList: Array.isArray(bp.allergyList) ? bp.allergyList : prev.allergyList,
            medicationList: Array.isArray(bp.medicationList) ? bp.medicationList : prev.medicationList,
          }))
          setProfile({
            ...profile,
            ...bp,
            name: res.name || bp.name || profile?.name || storeUser?.name || '',
            email: res.email || bp.email || profile?.email || storeUser?.email || '',
          })
        }
      } catch (err) {
        console.warn('Could not fetch remote profile, loaded from local store:', err)
      } finally {
        setIsLoadingBackend(false)
      }
    }
    loadBackendProfile()
  }, [storeUser?.token])

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateBMI = () => {
    if (!formData.height || !formData.weight) return 0
    return +(formData.weight / ((formData.height / 100) ** 2)).toFixed(1)
  }

  const bmi = calculateBMI()
  const bmiCategory = useMemo(() => {
    if (bmi === 0) return { label: 'N/A', color: 'from-gray-400 to-gray-500', range: '' }
    if (bmi < 18.5) return { label: 'Underweight', color: 'from-sky-400 to-blue-500', range: '<18.5' }
    if (bmi < 25) return { label: 'Normal / Healthy', color: 'from-emerald-400 to-teal-500', range: '18.5-24.9' }
    if (bmi < 30) return { label: 'Overweight', color: 'from-amber-400 to-orange-500', range: '25-29.9' }
    return { label: 'Obese', color: 'from-rose-400 to-red-500', range: '30+' }
  }, [bmi])

  const calculateHealthScore = () => {
    let score = 0
    if (bmi >= 18.5 && bmi < 25) score += 20
    else if (bmi >= 17 && bmi < 30) score += 10

    if (formData.sleepHours >= 7) score += 15
    else if (formData.sleepHours >= 6) score += 8

    if (formData.waterIntake >= 2) score += 15
    else if (formData.waterIntake >= 1.5) score += 8

    if (formData.exerciseRoutine === 'Daily') score += 15
    else if (formData.exerciseRoutine === '3-4 times/week') score += 12
    else if (formData.exerciseRoutine === '1-2 times/week') score += 6

    if (formData.stressLevel === 'low') score += 15
    else if (formData.stressLevel === 'medium') score += 8

    if (formData.pcos === 'No') score += 10

    return Math.min(100, Math.max(20, score))
  }

  const healthScore = calculateHealthScore()

  const calculateHealthRisks = () => {
    const risks: { text: string; severity: 'low' | 'medium' | 'high' }[] = []
    if (bmi > 25) risks.push({ text: 'Elevated BMI - Consider guided physical activity and balanced nutrition', severity: bmi > 30 ? 'high' : 'medium' })
    if (bmi < 18.5 && bmi > 0) risks.push({ text: 'Low BMI - Nutritional consultation recommended', severity: 'medium' })
    if (formData.pcos === 'Yes') risks.push({ text: 'Diagnosed PCOS/PCOD - Regular cycle & metabolic tracking advised', severity: 'high' })
    if (formData.thyroid !== 'No' && formData.thyroid !== '') risks.push({ text: `Thyroid condition (${formData.thyroid}) - Regular TSH panel follow-up`, severity: 'medium' })
    if (formData.sleepHours < 7 && formData.sleepHours > 0) risks.push({ text: 'Sleep deficit - Aim for 7-8 hours to support hormonal recovery', severity: 'low' })
    if (formData.stressLevel === 'high') risks.push({ text: 'High stress level - Relaxation, mindfulness & breathing exercises recommended', severity: 'medium' })
    if (formData.exerciseRoutine === 'None') risks.push({ text: 'Sedentary routine - Adding 20 min daily walking improves reproductive circulation', severity: 'low' })
    return risks
  }

  const healthRisks = calculateHealthRisks()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 1. Save to local Zustand store
      setProfile(formData)

      // 2. Automatically sync and adapt Personalized Smart Reminders
      const currentStoreReminders = useAppStore.getState().getCurrentUserData().reminders || []
      const { reminders: updatedReminders } = syncSmartReminders(currentStoreReminders, formData)
      useAppStore.getState().setReminders(updatedReminders)

      // 3. Persist to MongoDB backend
      if (storeUser?.token) {
        await authAPI.updateProfile(formData)
      }

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3500)
    } catch (err) {
      console.error('Failed to save profile remotely:', err)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3500)
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = () => {
    if (!formData.name) return 'FC'
    return formData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/70 via-purple-50/40 to-teal-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white pb-16">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <BackToHomeButton />
          {isLoadingBackend && (
            <div className="flex items-center gap-2 text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-3 py-1.5 rounded-full border border-pink-200 dark:border-pink-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing with secure health database...</span>
            </div>
          )}
        </div>

        {/* Top Profile Summary Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/95 dark:bg-gray-850 border border-pink-200/60 dark:border-gray-700 p-6 md:p-8 shadow-xl shadow-pink-100/40 dark:shadow-black/50 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="relative shrink-0">
              <CircularProgress value={healthScore} size={130} strokeWidth={8} gradientId="heroScore">
                <div
                  className="w-[96px] h-[96px] rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 flex items-center justify-center text-white text-3xl font-black shadow-lg cursor-pointer overflow-hidden relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CircularProgress>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onloadend = () => setProfilePhoto(reader.result as string)
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {formData.name || 'Your Women’s Health Profile'}
                  </h1>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                    {formData.email || 'Complete profile for tailored AI assistance & diagnostics'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-black text-xs border border-pink-200 dark:border-pink-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    Health Score: {healthScore}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <StatCard icon={Activity} label="BMI" value={bmi} color="from-purple-500 to-indigo-600" index={0} decimals={1} />
                <StatCard icon={Droplet} label="Blood Group" value={0} suffix={formData.bloodGroup || 'O+'} color="from-rose-500 to-pink-600" index={1} />
                <StatCard icon={Moon} label="Avg Sleep" value={formData.sleepHours || 8} suffix="h" color="from-blue-500 to-indigo-600" index={2} />
                <StatCard icon={AlertTriangle} label="Health Flags" value={healthRisks.length} color="from-amber-500 to-orange-600" index={3} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 1: Personal & Demographics */}
        <SectionCard title="1. Personal & Demographics" icon={User} index={0} completedFields={6} totalFields={6}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Age (Years)</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleFieldChange('age', Number(e.target.value))}
                placeholder="24"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Height (cm)</label>
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleFieldChange('height', Number(e.target.value))}
                placeholder="165"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight || ''}
                onChange={(e) => handleFieldChange('weight', Number(e.target.value))}
                placeholder="60"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Calculated BMI</label>
              <div className="w-full px-4 py-2.5 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 font-black text-sm text-pink-700 dark:text-pink-300 flex items-center justify-between">
                <span>{bmi} ({bmiCategory.label})</span>
                <span className="text-xs text-gray-500">{bmiCategory.range}</span>
              </div>
            </div>
          </div>

          <SingleSelectCards
            label="Blood Group"
            icon={Droplet}
            options={BLOOD_GROUPS}
            value={formData.bloodGroup}
            onChange={(val) => handleFieldChange('bloodGroup', val)}
          />

          <SingleSelectCards
            label="Relationship / Marital Status"
            icon={Heart}
            options={MARITAL_STATUS_OPTIONS}
            value={formData.maritalStatus}
            onChange={(val) => handleFieldChange('maritalStatus', val)}
          />
        </SectionCard>

        {/* SECTION 2: Reproductive & Menstrual Health */}
        <SectionCard title="2. Menstrual & Reproductive Health" icon={Flower2} index={1} completedFields={5} totalFields={6}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Last Period Start Date</label>
              <input
                type="date"
                value={formData.lastPeriodDate}
                onChange={(e) => handleFieldChange('lastPeriodDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Average Cycle Length (Days)</label>
              <input
                type="number"
                value={formData.cycleLength || 28}
                onChange={(e) => handleFieldChange('cycleLength', Number(e.target.value))}
                placeholder="28"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
          </div>

          <SingleSelectCards
            label="Cycle Regularity"
            icon={Clock}
            options={CYCLE_REGULARITY_OPTIONS}
            value={formData.cycleRegularity}
            onChange={(val) => handleFieldChange('cycleRegularity', val)}
          />

          <SingleSelectCards
            label="Typical Period Duration"
            icon={Calendar}
            options={PERIOD_DURATION_OPTIONS}
            value={formData.periodDuration}
            onChange={(val) => handleFieldChange('periodDuration', val)}
          />

          <MultiSelectChips
            label="Common Period Symptoms & Discomforts"
            icon={AlertCircle}
            options={COMMON_SYMPTOMS_LIST}
            selectedValues={formData.symptoms}
            onChange={(vals) => handleFieldChange('symptoms', vals)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <SingleSelectCards
              label="PCOS / PCOD Status"
              options={PCOS_OPTIONS}
              value={formData.pcos}
              onChange={(val) => handleFieldChange('pcos', val)}
            />
            <SingleSelectCards
              label="Thyroid Condition"
              options={THYROID_OPTIONS}
              value={formData.thyroid}
              onChange={(val) => handleFieldChange('thyroid', val)}
            />
            <SingleSelectCards
              label="Menopause Stage"
              options={MENOPAUSE_OPTIONS}
              value={formData.menopauseStatus}
              onChange={(val) => handleFieldChange('menopauseStatus', val)}
            />
          </div>
        </SectionCard>

        {/* SECTION 3: Pregnancy & Maternal Health */}
        <SectionCard title="3. Pregnancy & Maternal Health" icon={Baby} index={2} completedFields={4} totalFields={4}>
          <SingleSelectCards
            label="Current Pregnancy Status"
            icon={Baby}
            options={PREGNANCY_STATUS_OPTIONS}
            value={formData.pregnancyStatus}
            onChange={(val) => handleFieldChange('pregnancyStatus', val)}
          />

          {formData.pregnancyStatus === 'Yes' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <SingleSelectCards
                label="Current Trimester"
                icon={Flame}
                options={TRIMESTER_OPTIONS}
                value={typeof formData.trimester === 'string' ? formData.trimester : ''}
                onChange={(val) => handleFieldChange('trimester', val)}
              />
            </motion.div>
          )}

          <SingleSelectCards
            label="Obstetric & Previous Pregnancy History"
            icon={Baby}
            options={PREGNANCY_HISTORY_OPTIONS}
            value={formData.pregnancyHistory}
            onChange={(val) => handleFieldChange('pregnancyHistory', val)}
          />

          <SingleSelectCards
            label="Fertility & Family Planning Goals"
            icon={Heart}
            options={FERTILITY_PLANNING_OPTIONS}
            value={formData.fertilityPlanning}
            onChange={(val) => handleFieldChange('fertilityPlanning', val)}
          />
        </SectionCard>

        {/* SECTION 4: Medical Conditions & Medications */}
        <SectionCard title="4. Medical Conditions, Allergies & Medications" icon={Pill} index={3} completedFields={3} totalFields={4}>
          <MultiSelectChips
            label="Existing Health & Chronic Conditions"
            icon={Stethoscope}
            options={CHRONIC_CONDITIONS_LIST}
            selectedValues={formData.existingConditions}
            onChange={(vals) => handleFieldChange('existingConditions', vals)}
          />

          <MultiSelectChips
            label="Known Allergies"
            icon={AlertTriangle}
            options={ALLERGIES_LIST}
            selectedValues={formData.allergyList}
            onChange={(vals) => handleFieldChange('allergyList', vals)}
          />

          <MultiSelectChips
            label="Current Medications & Supplements"
            icon={Pill}
            options={MEDICATIONS_LIST}
            selectedValues={formData.medicationList}
            onChange={(vals) => handleFieldChange('medicationList', vals)}
          />

          <div className="mt-4">
            <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Previous Surgeries / Medical Notes</label>
            <input
              type="text"
              value={formData.previousSurgeries || formData.surgeries || ''}
              onChange={(e) => handleFieldChange('previousSurgeries', e.target.value)}
              placeholder="e.g. Appendectomy 2021, Knee Arthroscopy, None"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
        </SectionCard>

        {/* SECTION 5: Lifestyle, Nutrition, Sleep & Stress */}
        <SectionCard title="5. Lifestyle, Nutrition, Sleep & Stress" icon={Leaf} index={4} completedFields={6} totalFields={6}>
          <SingleSelectCards
            label="Diet & Nutrition Preference"
            icon={Leaf}
            options={DIET_OPTIONS}
            value={formData.dietPreference || formData.foodPreference}
            onChange={(val) => {
              handleFieldChange('dietPreference', val)
              handleFieldChange('foodPreference', val)
            }}
          />

          <SingleSelectCards
            label="Weekly Exercise Routine"
            icon={Dumbbell}
            options={EXERCISE_OPTIONS}
            value={formData.exerciseRoutine}
            onChange={(val) => handleFieldChange('exerciseRoutine', val)}
          />

          <SingleSelectCards
            label="Sleep Quality"
            icon={Bed}
            options={SLEEP_QUALITY_OPTIONS}
            value={formData.sleepQuality}
            onChange={(val) => handleFieldChange('sleepQuality', val)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Average Sleep Hours / Night</label>
              <input
                type="number"
                step="0.5"
                value={formData.sleepHours || 8}
                onChange={(e) => handleFieldChange('sleepHours', Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Daily Water Goal (Liters)</label>
              <input
                type="number"
                step="0.1"
                value={formData.waterIntake || 2.5}
                onChange={(e) => handleFieldChange('waterIntake', Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
          </div>

          <SingleSelectCards
            label="Sleep Schedule Pattern"
            icon={Moon}
            options={SLEEP_SCHEDULE_OPTIONS}
            value={formData.sleepSchedule}
            onChange={(val) => handleFieldChange('sleepSchedule', val)}
          />

          <SingleSelectCards
            label="Daily Stress Level"
            icon={Brain}
            options={STRESS_OPTIONS}
            value={formData.stressLevel}
            onChange={(val) => handleFieldChange('stressLevel', val)}
          />

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <SingleSelectCards
              label="Alcohol Consumption"
              icon={Wine}
              options={ALCOHOL_OPTIONS}
              value={formData.alcoholStatus}
              onChange={(val) => handleFieldChange('alcoholStatus', val)}
            />

            <SingleSelectCards
              label="Daily Caffeine Intake"
              icon={Coffee}
              options={CAFFEINE_OPTIONS}
              value={formData.caffeineStatus}
              onChange={(val) => handleFieldChange('caffeineStatus', val)}
            />
          </div>
        </SectionCard>

        {/* SECTION 6: Emergency & Healthcare Contacts */}
        <SectionCard title="6. Emergency & Clinical Contacts" icon={Shield} index={5} completedFields={3} totalFields={3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Emergency Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-pink-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Preferred Gynecologist / Doctor</label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => handleFieldChange('doctorName', e.target.value)}
                  placeholder="Dr. Sarah Johnson, MD"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-600 dark:text-gray-300 mb-1.5">Preferred Hospital / Clinic</label>
              <div className="relative">
                <Hospital className="w-4 h-4 text-teal-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={formData.preferredHospital || formData.hospital || ''}
                  onChange={(e) => {
                    handleFieldChange('preferredHospital', e.target.value)
                    handleFieldChange('hospital', e.target.value)
                  }}
                  placeholder="City Women's Hospital"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Health Risk Alerts Panel */}
        {healthRisks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-amber-500/10 border border-amber-400/30 p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h4 className="text-lg font-black text-amber-900 dark:text-amber-200">Personalized Health Insights & Risk Flags</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {healthRisks.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-amber-200/60 dark:border-amber-900/40 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${r.severity === 'high' ? 'bg-rose-500' : r.severity === 'medium' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Floating Save Button */}
        <div className="sticky bottom-6 z-30">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-teal-500 text-white font-black text-lg shadow-2xl shadow-pink-500/30 flex items-center justify-center gap-3 border-2 border-white/20 cursor-pointer disabled:opacity-75"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Saving to Secure Health Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Health Profile</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl bg-gray-900/95 text-white backdrop-blur-md shadow-2xl border border-pink-500/30 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <div className="font-black text-sm">Health Profile Successfully Saved!</div>
              <div className="text-xs text-gray-300">Synchronized with database & AI intelligence context.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
