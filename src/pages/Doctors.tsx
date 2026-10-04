import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Calendar,
  Search,
  Clock,
  MapPin,
  DollarSign,
  MessageCircle,
  Video,
  Phone,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Edit3,
  Trash2,
  Settings2,
  Eye,
  Upload,
  Sparkles,
  ShieldCheck,
  Award,
  Globe,
  Languages,
  Stethoscope,
  GraduationCap,
  Building2,
  UserCircle2,
  Mail,
  Smartphone,
  BadgeCheck,
  Clock3,
  HeartHandshake,
  Quote,
  CalendarCheck2,
  CalendarX2,
  CalendarClock,
  Filter,
  SortAsc,
  BriefcaseMedical,
  ChevronRight,
  Info,
  Pill,
  FileText,
  FileSpreadsheet,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react'
import { useAppStore, useAppointments, type Doctor, type Appointment } from '@/store'
import { doctorAPI } from '../services/api'
import clsx from 'clsx'

type FilterChip = 'all' | 'online' | 'toprated'
type SortOption = 'rating' | 'experience' | 'fee-asc' | 'fee-desc'
type Mode = 'browse' | 'manage'
type ConsultationMode = 'in-clinic' | 'video-call' | 'voice-call'

interface ExtendedDoctor extends Doctor {
  email?: string
  qualification?: string
  registrationId?: string
  bio?: string
  languages?: string[]
  availableDays?: string[]
  services?: string[]
  reviews?: Array<{
    id: string
    patient: string
    rating: number
    comment: string
    date: string
  }>
  photo?: string
  reviewCount?: number
}

interface BookAppointmentState {
  doctor: ExtendedDoctor
  date: string
  time: string | null
  reason: string
  mode: ConsultationMode
  reschedulingId?: string
}

interface CallModalState {
  doctor: ExtendedDoctor
  type: 'voice' | 'video'
  status: 'connecting' | 'connected' | 'ended'
  muted: boolean
  cameraOn: boolean
  speakerOn: boolean
  duration: number
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DEFAULT_LANGUAGES = ['English', 'Spanish', 'French', 'Hindi', 'Arabic', 'Mandarin']
const SPECIALTIES = [
  'Gynecologist',
  'Obstetrician',
  'Fertility Specialist',
  'Endocrinologist',
  'Nutritionist',
  'Mental Health Counselor',
  'Lactation Consultant',
  'Pediatrician',
  'Dermatologist',
  'Cardiologist',
  'Psychiatrist',
  'Oncologist',
  'General Physician',
  'Neurologist',
]
const REQUIRED_SPECIALTIES = [
  'Gynecologist',
  'Obstetrician',
  'Fertility Specialist',
  'Endocrinologist',
  'Nutritionist',
  'Mental Health Counselor',
  'Lactation Consultant',
]
const DEFAULT_REVIEWS = [
  { id: 'r1', patient: 'Emma W.', rating: 5, comment: 'Very thorough and compassionate. Highly recommended!', date: '2025-06-15' },
  { id: 'r2', patient: 'Sophia L.', rating: 4, comment: 'Great doctor, listens carefully and explains everything.', date: '2025-05-22' },
  { id: 'r3', patient: 'Olivia M.', rating: 5, comment: 'Best consultation I have ever had. Very professional.', date: '2025-04-10' },
]

const EXTRA_LOCAL_DOCTORS: ExtendedDoctor[] = [
  {
    id: 'local-extra-1',
    name: 'Dr. Aisha Patel',
    specialty: 'Obstetrician',
    experience: 12,
    hospital: 'Maternity Care Center',
    rating: 4.9,
    availableTime: ['08:00 AM', '10:00 AM', '01:00 PM', '03:00 PM'],
    fees: 180,
    online: true,
    phone: '+1 555-246-8100',
    videoLink: 'https://zoom.us/j/1122334455',
    email: 'aisha.patel@femcare.com',
    qualification: 'MD, MBBS, DGO',
    registrationId: 'REG-582934',
    bio: 'Dr. Aisha Patel is a board-certified obstetrician with over 12 years of experience in prenatal care, high-risk pregnancies, and postnatal support. She is passionate about holistic maternity care and believes in empowering mothers throughout their pregnancy journey.',
    languages: ['English', 'Hindi', 'Gujarati'],
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    services: ['Prenatal Care', 'High-Risk Pregnancy', 'Delivery Planning', 'Postnatal Checkup', 'Ultrasound Scans'],
    reviews: DEFAULT_REVIEWS,
    reviewCount: 189,
  },
  {
    id: 'local-extra-2',
    name: 'Dr. Rachel Thompson',
    specialty: 'Fertility Specialist',
    experience: 15,
    hospital: 'Fertility & Wellness Institute',
    rating: 4.8,
    availableTime: ['09:30 AM', '11:30 AM', '02:30 PM', '04:30 PM'],
    fees: 220,
    online: true,
    phone: '+1 555-369-2580',
    videoLink: 'https://zoom.us/j/5566778899',
    email: 'rachel.thompson@femcare.com',
    qualification: 'MD, FRCOG, Fellowship in Reproductive Medicine',
    registrationId: 'REG-724168',
    bio: 'Dr. Rachel Thompson is a renowned fertility specialist dedicated to helping couples achieve their dream of parenthood. With advanced training in IVF, IUI, and reproductive endocrinology, she offers compassionate, personalized treatment plans tailored to each patient.',
    languages: ['English', 'French'],
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    services: ['Fertility Assessment', 'IVF Consultation', 'IUI Treatment', 'Hormone Therapy', 'Reproductive Surgery'],
    reviews: DEFAULT_REVIEWS,
    reviewCount: 242,
  },
]

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return parts[0][0] + parts[1][0]
  return parts[0][0] || '?'
}

const avatarGradient = (seed: string) => {
  const gradients = [
    'from-pink-400 via-rose-400 to-fuchsia-500',
    'from-purple-400 via-violet-400 to-indigo-500',
    'from-teal-400 via-emerald-400 to-cyan-500',
    'from-amber-400 via-orange-400 to-rose-500',
    'from-lavender-400 via-purple-400 to-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
}

const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
  const sizeClasses = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= Math.round(rating)
        const halfFilled = !filled && s - 0.5 <= rating
        return (
          <Star
            key={s}
            className={clsx(
              sizeClasses,
              filled ? 'text-amber-400 fill-amber-400' : halfFilled ? 'text-amber-300 fill-amber-200' : 'text-gray-300'
            )}
          />
        )
      })}
    </div>
  )
}

export default function Doctors() {
  const navigate = useNavigate()
  const appointments = useAppointments()
  const addAppointment = useAppStore((s) => s.addAppointment)
  const updateAppointment = useAppStore((s) => s.updateAppointment)
  const storeDoctors = useAppStore((s) => s.doctors)
  const addDoctor = useAppStore((s) => s.addDoctor)
  const updateDoctor = useAppStore((s) => s.updateDoctor)
  const deleteDoctor = useAppStore((s) => s.deleteDoctor)

  const [doctors, setDoctors] = useState<ExtendedDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterChip>('all')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')
  const [showSpecialtyDrop, setShowSpecialtyDrop] = useState(false)
  const [showSortDrop, setShowSortDrop] = useState(false)

  const [selectedDoctor, setSelectedDoctor] = useState<ExtendedDoctor | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('Action completed successfully!')
  const [activeTab, setActiveTab] = useState<'doctors' | 'appointments'>('doctors')

  const [mode, setMode] = useState<Mode>('browse')
  const [showForm, setShowForm] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<ExtendedDoctor | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ExtendedDoctor | null>(null)
  const [drawerTab, setDrawerTab] = useState<'about' | 'schedule' | 'reviews' | 'book'>('about')

  const [bookModal, setBookModal] = useState<BookAppointmentState | null>(null)
  const [callModal, setCallModal] = useState<CallModalState | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prescriptionInputRef = useRef<HTMLInputElement>(null)
  const reportInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true)
        const backendDoctors = await doctorAPI.getDoctors()
        if (backendDoctors && Array.isArray(backendDoctors) && backendDoctors.length > 0) {
          const seen = new Set<string>()
          const formatted: ExtendedDoctor[] = []
          backendDoctors.forEach((d: any) => {
            const id = (d._id || d.id || '').toString()
            if (id && !seen.has(id)) {
              seen.add(id)
              formatted.push({
                id,
                name: d.name,
                specialty: d.specialty || d.specialization || 'General Physician',
                experience: d.experience || 5,
                hospital: d.hospital || 'FemCare Health Clinic',
                rating: d.rating || 4.9,
                availableTime: d.availableTime?.length ? d.availableTime : ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
                fees: d.fees || d.consultationFee || 1500,
                online: d.online !== false,
                phone: d.phone || '+1 555-000-0000',
                videoLink: d.videoLink || 'https://meet.google.com/new',
                email: d.email,
                qualification: d.qualification || 'MD, MBBS',
                registrationId: d.registrationId || `REG-${Math.floor(Math.random() * 900000) + 100000}`,
                bio: d.bio || `Dr. ${d.name.split(' ')[1] || d.name.split(' ')[0]} is a dedicated ${d.specialty} with a passion for providing personalized, evidence-based care. With extensive experience in managing complex conditions, they take the time to listen and develop tailored treatment plans that address each patient's unique needs and concerns.`,
                languages: d.languages || ['English', 'Spanish'],
                availableDays: d.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                services: d.services || [
                  `${d.specialty} Consultation`,
                  'Follow-up Visit',
                  'Health Check-up',
                  'Prescription Review',
                ],
                reviews: d.reviews || DEFAULT_REVIEWS,
                reviewCount: d.reviewCount ?? Math.floor(Math.random() * 200) + 50,
              })
            }
          })
          setDoctors(formatted)
        } else {
          setDoctors([])
        }
      } catch (error) {
        console.error('Failed to load doctors:', error)
        setDoctors([])
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  useEffect(() => {
    if (callModal?.status === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallModal((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null))
      }, 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
  }, [callModal?.status])

  useEffect(() => {
    if (callModal?.status === 'connecting') {
      const timer = setTimeout(() => {
        setCallModal((prev) => (prev ? { ...prev, status: 'connected' } : null))
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [callModal?.status])

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialty))
    REQUIRED_SPECIALTIES.forEach((s) => set.add(s))
    return ['all', ...Array.from(set)]
  }, [doctors])

  const filteredDoctors = useMemo(() => {
    let list = [...doctors]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q) ||
          (d.phone && d.phone.includes(q))
      )
    }
    if (filter === 'online') list = list.filter((d) => d.online)
    if (filter === 'toprated') list = list.filter((d) => d.rating >= 4.7)
    if (specialtyFilter !== 'all') list = list.filter((d) => d.specialty === specialtyFilter)

    switch (sortBy) {
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'experience':
        list.sort((a, b) => b.experience - a.experience)
        break
      case 'fee-asc':
        list.sort((a, b) => a.fees - b.fees)
        break
      case 'fee-desc':
        list.sort((a, b) => b.fees - a.fees)
        break
    }
    return list
  }, [doctors, search, filter, sortBy, specialtyFilter])

  const handleChat = (doctor: ExtendedDoctor) => {
    navigate(`/doctor-chat/${doctor.id}`)
  }

  const handleBook = useCallback(() => {
    if (!selectedDoctor || !selectedTime) return
    addAppointment({
      id: Date.now().toString(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: selectedDate,
      time: selectedTime,
      hospital: selectedDoctor.hospital,
      status: 'upcoming',
    })
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setSelectedDoctor(null)
      setSelectedTime(null)
      setDrawerTab('about')
    }, 2000)
  }, [selectedDoctor, selectedTime, selectedDate, addAppointment])

  const openBookModal = useCallback((doctor: ExtendedDoctor, rescheduling?: Appointment) => {
    setBookModal({
      doctor,
      date: rescheduling?.date || new Date().toISOString().split('T')[0],
      time: rescheduling?.time || null,
      reason: rescheduling?.notes || '',
      mode: 'video-call',
      reschedulingId: rescheduling?.id,
    })
  }, [])

  const confirmBookModal = useCallback(() => {
    if (!bookModal || !bookModal.time) return
    const apt: Appointment = {
      id: bookModal.reschedulingId || Date.now().toString(),
      doctorId: bookModal.doctor.id,
      doctorName: bookModal.doctor.name,
      specialty: bookModal.doctor.specialty,
      date: bookModal.date,
      time: bookModal.time,
      hospital: bookModal.doctor.hospital,
      notes: bookModal.reason || undefined,
      status: 'upcoming',
    }
    if (bookModal.reschedulingId) {
      updateAppointment(bookModal.reschedulingId, apt)
      setSuccessMessage('Appointment rescheduled successfully!')
    } else {
      addAppointment(apt)
      setSuccessMessage('Appointment booked successfully!')
    }
    setShowSuccess(true)
    setBookModal(null)
    setTimeout(() => {
      setShowSuccess(false)
    }, 2000)
  }, [bookModal, addAppointment, updateAppointment])

  const handleSaveDoctor = (form: Omit<ExtendedDoctor, 'id' | 'reviews' | 'reviewCount'>) => {
    if (editingDoctor) {
      const updated: ExtendedDoctor = { ...editingDoctor, ...form }
      setDoctors((prev) => prev.map((d) => (d.id === editingDoctor.id ? updated : d)))
      updateDoctor(editingDoctor.id, form as Doctor)
    } else {
      const id = Date.now().toString()
      const newDoc: ExtendedDoctor = {
        id,
        ...form,
        reviews: DEFAULT_REVIEWS,
        reviewCount: 0,
      }
      setDoctors((prev) => [newDoc, ...prev])
      addDoctor(form as Doctor)
    }
    setShowForm(false)
    setEditingDoctor(null)
  }

  const handleDelete = () => {
    if (!showDeleteConfirm) return
    setDoctors((prev) => prev.filter((d) => d.id !== showDeleteConfirm.id))
    deleteDoctor(showDeleteConfirm.id)
    setShowDeleteConfirm(null)
  }

  const openCallModal = useCallback((doctor: ExtendedDoctor, type: 'voice' | 'video') => {
    setCallModal({
      doctor,
      type,
      status: 'connecting',
      muted: false,
      cameraOn: type === 'video',
      speakerOn: true,
      duration: 0,
    })
  }, [])

  const endCall = useCallback(() => {
    setCallModal((prev) => (prev ? { ...prev, status: 'ended' } : null))
    setTimeout(() => setCallModal(null), 800)
  }, [])

  const handlePrescriptionUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      showToast(`Prescription "${file.name}" uploaded successfully!`, 'success')
    }
    if (prescriptionInputRef.current) prescriptionInputRef.current.value = ''
  }, [showToast])

  const handleReportUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      showToast(`Report "${file.name}" shared successfully!`, 'success')
    }
    if (reportInputRef.current) reportInputRef.current.value = ''
  }, [showToast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-fuchsia-50 to-teal-50 relative overflow-x-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -right-24 w-80 h-80 bg-gradient-to-br from-teal-400/25 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <HeroHeader
          onBack={() => navigate('/home')}
          search={search}
          onSearch={setSearch}
          totalDoctors={doctors.length}
          onlineCount={doctors.filter((d) => d.online).length}
        />

        <div className="container mx-auto px-4 pb-24 -mt-8 md:-mt-10">
          <div className="max-w-6xl mx-auto">
            <ModeToggle mode={mode} setMode={setMode} />

            <SpecialtyFilterChips
              specialtyFilter={specialtyFilter}
              setSpecialtyFilter={setSpecialtyFilter}
            />

            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} appointmentCount={appointments.length} />

            <AnimatePresence mode="wait">
              {activeTab === 'doctors' ? (
                <motion.div
                  key="doctors-tab"
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FilterBar
                    filter={filter}
                    setFilter={setFilter}
                    specialtyFilter={specialtyFilter}
                    setSpecialtyFilter={setSpecialtyFilter}
                    specialties={specialties}
                    showSpecialtyDrop={showSpecialtyDrop}
                    setShowSpecialtyDrop={setShowSpecialtyDrop}
                    sortBy={sortBy}
                    showSortDrop={showSortDrop}
                    setShowSortDrop={setShowSortDrop}
                    setSortBy={setSortBy}
                    total={filteredDoctors.length}
                  />

                  <DoctorsGrid
                    loading={loading}
                    doctors={filteredDoctors}
                    mode={mode}
                    onOpen={(d) => {
                      setSelectedDoctor(d)
                      setDrawerTab('about')
                      setSelectedTime(null)
                    }}
                    onChat={handleChat}
                    onEdit={(d) => {
                      setEditingDoctor(d)
                      setShowForm(true)
                    }}
                    onDelete={(d) => setShowDeleteConfirm(d)}
                    onBook={(d) => openBookModal(d)}
                    onCall={(d) => openCallModal(d, 'voice')}
                    onVideo={(d) => openCallModal(d, 'video')}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="appointments-tab"
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AppointmentsTimeline
                    appointments={appointments}
                    doctors={doctors}
                    onCancel={(id) => updateAppointment(id, { status: 'cancelled' })}
                    onVideo={(doctor) => openCallModal(doctor, 'video')}
                    onCall={(doctor) => openCallModal(doctor, 'voice')}
                    onReschedule={(apt, doctor) => openBookModal(doctor, apt)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeTab === 'doctors' && (
          <FAB
            visible={mode === 'manage'}
            onClick={() => {
              setEditingDoctor(null)
              setShowForm(true)
            }}
          />
        )}
      </div>

      <input
        ref={prescriptionInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handlePrescriptionUpload}
      />
      <input
        ref={reportInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleReportUpload}
      />

      <AnimatePresence>
        {selectedDoctor && (
          <DoctorDrawer
            doctor={selectedDoctor}
            onClose={() => {
              setSelectedDoctor(null)
              setSelectedTime(null)
            }}
            activeTab={drawerTab}
            setActiveTab={setDrawerTab}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onBook={handleBook}
            onChat={handleChat}
            onBookModal={() => openBookModal(selectedDoctor)}
            onCall={() => openCallModal(selectedDoctor, 'voice')}
            onVideo={() => openCallModal(selectedDoctor, 'video')}
            onUploadPrescription={() => prescriptionInputRef.current?.click()}
            onShareReport={() => reportInputRef.current?.click()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookModal && (
          <BookAppointmentModal
            state={bookModal}
            setState={setBookModal}
            onConfirm={confirmBookModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {callModal && (
          <CallModal
            state={callModal}
            setState={setCallModal}
            onEnd={endCall}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <DoctorFormModal
            initial={editingDoctor}
            onClose={() => {
              setShowForm(false)
              setEditingDoctor(null)
            }}
            onSave={handleSaveDoctor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirm
            doctor={showDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
            >
              <CheckCircle2 className="w-7 h-7" />
            </motion.div>
            <div>
              <p className="font-bold text-lg">{successMessage}</p>
              <p className="text-sm opacity-90">You will receive a confirmation shortly.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={clsx(
              'fixed top-6 right-6 z-[120] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/30 backdrop-blur-xl',
              toast.type === 'success'
                ? 'bg-gradient-to-r from-emerald-500/95 to-teal-500/95'
                : toast.type === 'error'
                ? 'bg-gradient-to-r from-rose-500/95 to-red-500/95'
                : 'bg-gradient-to-r from-blue-500/95 to-indigo-500/95'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <p className="font-semibold text-sm">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============== HERO HEADER ============== */
function HeroHeader({
  onBack,
  search,
  onSearch,
  totalDoctors,
  onlineCount,
}: {
  onBack: () => void
  search: string
  onSearch: (v: string) => void
  totalDoctors: number
  onlineCount: number
}) {
  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 pb-20 md:pb-24"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-400 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-gradient-to-tr from-teal-400 to-transparent rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 container mx-auto px-4 pt-6 md:pt-8">
        <div className="flex items-center justify-between mb-8">
          <BackToHomeButton />

          <div className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-semibold">Premium Care</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Consult with{' '}
            <span className="bg-gradient-to-r from-pink-200 via-yellow-200 to-teal-200 bg-clip-text text-transparent">
              Expert Doctors
            </span>
          </h1>
          <p className="mt-3 text-white/80 text-base md:text-lg max-w-2xl">
            Connect instantly with verified specialists. Get personalized care from the comfort of your home.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-3xl"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-fuchsia-400 to-teal-400 rounded-3xl blur opacity-50" />
          <div className="relative flex items-center gap-3 bg-white/95 backdrop-blur-xl rounded-3xl p-2 shadow-2xl">
            <div className="pl-4 text-purple-500">
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <input
              type="text"
              placeholder="Search by name, hospital, or specialty..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm md:text-base py-3 px-1 focus:outline-none"
            />
            {search && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSearch('')}
                className="p-2 mr-1 text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 md:px-7 py-3 md:py-3.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-2xl font-bold text-sm md:text-base shadow-lg hover:shadow-xl"
            >
              Search
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex flex-wrap items-center gap-4 md:gap-8 text-white/90"
        >
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold">{totalDoctors}</span>
            <span className="text-white/70 text-sm">Verified Doctors</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_12px_#34d399]" />
            </motion.div>
            <span className="font-semibold">{onlineCount}</span>
            <span className="text-white/70 text-sm">Online Now</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="font-semibold">4.8</span>
            <span className="text-white/70 text-sm">Avg. Rating</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ============== SPECIALTY FILTER CHIPS ============== */
function SpecialtyFilterChips({
  specialtyFilter,
  setSpecialtyFilter,
}: {
  specialtyFilter: string
  setSpecialtyFilter: (v: string) => void
}) {
  return (
    <motion.div variants={fadeUp} className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="p-1.5 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-xl">
          <BriefcaseMedical className="w-4 h-4 text-purple-600" />
        </div>
        <span className="text-sm font-black text-gray-700 uppercase tracking-wide">Filter by Specialty</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChipButton
          active={specialtyFilter === 'all'}
          onClick={() => setSpecialtyFilter('all')}
          label="All Specialties"
          gradient="from-gray-600 to-gray-700"
          icon={Filter}
        />
        {REQUIRED_SPECIALTIES.map((spec) => (
          <FilterChipButton
            key={spec}
            active={specialtyFilter === spec}
            onClick={() => setSpecialtyFilter(spec)}
            label={spec}
            gradient={
              spec === 'Gynecologist'
                ? 'from-pink-500 to-rose-600'
                : spec === 'Obstetrician'
                ? 'from-fuchsia-500 to-purple-600'
                : spec === 'Fertility Specialist'
                ? 'from-violet-500 to-indigo-600'
                : spec === 'Endocrinologist'
                ? 'from-blue-500 to-cyan-600'
                : spec === 'Nutritionist'
                ? 'from-emerald-500 to-teal-600'
                : spec === 'Mental Health Counselor'
                ? 'from-amber-500 to-orange-600'
                : 'from-rose-500 to-pink-600'
            }
          />
        ))}
      </div>
    </motion.div>
  )
}

function FilterChipButton({
  active,
  onClick,
  label,
  gradient,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  gradient: string
  icon?: any
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm border-2 transition-all shadow-sm',
        active
          ? `bg-gradient-to-r ${gradient} text-white border-transparent shadow-lg shadow-purple-200/50`
          : 'bg-white/80 backdrop-blur text-gray-600 border-white/60 hover:border-gray-200 hover:bg-white'
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </motion.button>
  )
}

/* ============== MODE TOGGLE ============== */
function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <motion.div
      variants={fadeUp}
      className="mb-6 flex items-center justify-between"
    >
      <div />
      <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode('browse')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all',
            mode === 'browse'
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100/80'
          )}
        >
          <Eye className="w-4 h-4" />
          Browse
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode('manage')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all',
            mode === 'manage'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100/80'
          )}
        >
          <Settings2 className="w-4 h-4" />
          Manage
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ============== TAB BAR ============== */
function TabBar({
  activeTab,
  setActiveTab,
  appointmentCount,
}: {
  activeTab: 'doctors' | 'appointments'
  setActiveTab: (t: 'doctors' | 'appointments') => void
  appointmentCount: number
}) {
  return (
    <motion.div variants={fadeUp} className="mb-6 bg-white/70 backdrop-blur-xl border border-white/60 p-2 rounded-3xl shadow-xl">
      <div className="grid grid-cols-2 gap-2">
        <TabButton
          active={activeTab === 'doctors'}
          onClick={() => setActiveTab('doctors')}
          icon={Stethoscope}
          label="Consult Doctors"
        />
        <TabButton
          active={activeTab === 'appointments'}
          onClick={() => setActiveTab('appointments')}
          icon={CalendarCheck2}
          label="My Appointments"
          badge={appointmentCount}
        />
      </div>
    </motion.div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
  badge?: number
}) {
  return (
    <motion.button
      whileHover={{ scale: active ? 1 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        'relative py-3 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2',
        active
          ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 text-white shadow-lg'
          : 'text-gray-600 hover:bg-white/80'
      )}
    >
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={clsx(
            'ml-1 min-w-[22px] h-[22px] px-2 rounded-full text-xs font-bold flex items-center justify-center',
            active ? 'bg-white/25 text-white' : 'bg-fuchsia-100 text-fuchsia-700'
          )}
        >
          {badge}
        </span>
      )}
    </motion.button>
  )
}

/* ============== FILTER BAR ============== */
function FilterBar({
  filter,
  setFilter,
  specialtyFilter,
  setSpecialtyFilter,
  specialties,
  showSpecialtyDrop,
  setShowSpecialtyDrop,
  sortBy,
  showSortDrop,
  setShowSortDrop,
  setSortBy,
  total,
}: {
  filter: FilterChip
  setFilter: (f: FilterChip) => void
  specialtyFilter: string
  setSpecialtyFilter: (v: string) => void
  specialties: string[]
  showSpecialtyDrop: boolean
  setShowSpecialtyDrop: (v: boolean) => void
  sortBy: SortOption
  showSortDrop: boolean
  setShowSortDrop: (v: boolean) => void
  setSortBy: (s: SortOption) => void
  total: number
}) {
  const chips: Array<{ id: FilterChip; label: string; icon: any; activeColor: string }> = [
    { id: 'all', label: 'All', icon: Filter, activeColor: 'from-gray-600 to-gray-700' },
    { id: 'online', label: 'Online Now', icon: ShieldCheck, activeColor: 'from-emerald-500 to-teal-600' },
    { id: 'toprated', label: 'Top Rated', icon: Award, activeColor: 'from-amber-500 to-orange-600' },
  ]
  return (
    <motion.div variants={fadeUp} className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {chips.map((c) => (
          <motion.button
            key={c.id}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter(c.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm border transition-all',
              filter === c.id
                ? `bg-gradient-to-r ${c.activeColor} text-white border-transparent shadow-lg`
                : 'bg-white/80 backdrop-blur text-gray-600 border-white/60 hover:border-gray-200 hover:bg-white'
            )}
          >
            <c.icon className="w-4 h-4" />
            {c.label}
          </motion.button>
        ))}

        <Dropdown
          label={specialtyFilter === 'all' ? 'All Specialties' : specialtyFilter}
          icon={BriefcaseMedical}
          open={showSpecialtyDrop}
          setOpen={setShowSpecialtyDrop}
          options={specialties.map((s) => ({ value: s, label: s === 'all' ? 'All Specialties' : s }))}
          onSelect={(v) => {
            setSpecialtyFilter(v as string)
            setShowSpecialtyDrop(false)
          }}
          gradient="from-purple-500 to-fuchsia-600"
        />

        <Dropdown
          label={
            sortBy === 'rating'
              ? 'Rating'
              : sortBy === 'experience'
              ? 'Experience'
              : sortBy === 'fee-asc'
              ? 'Fee: Low → High'
              : 'Fee: High → Low'
          }
          icon={SortAsc}
          open={showSortDrop}
          setOpen={setShowSortDrop}
          options={[
            { value: 'rating', label: 'Top Rated' },
            { value: 'experience', label: 'Most Experienced' },
            { value: 'fee-asc', label: 'Fee: Low to High' },
            { value: 'fee-desc', label: 'Fee: High to Low' },
          ]}
          onSelect={(v) => {
            setSortBy(v as SortOption)
            setShowSortDrop(false)
          }}
          gradient="from-teal-500 to-cyan-600"
        />

        <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-2 bg-white/70 backdrop-blur rounded-2xl text-sm text-gray-500 border border-white/50">
          <Info className="w-4 h-4 text-purple-500" />
          <span>
            <strong className="text-gray-800">{total}</strong> doctors found
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function Dropdown({
  label,
  icon: Icon,
  open,
  setOpen,
  options,
  onSelect,
  gradient,
}: {
  label: string
  icon: any
  open: boolean
  setOpen: (v: boolean) => void
  options: Array<{ value: string; label: string }>
  onSelect: (v: string) => void
  gradient: string
}) {
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-white/80 backdrop-blur text-gray-700 border border-white/60 hover:border-gray-200 hover:bg-white transition-all"
      >
        <Icon className="w-4 h-4" />
        <span className="max-w-[150px] truncate">{label}</span>
        <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="absolute z-50 mt-2 w-60 right-0 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl p-2 max-h-80 overflow-y-auto"
            >
              {options.map((opt, idx) => {
                const active = opt.label === label
                return (
                  <motion.button
                    key={opt.value}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={{ x: 4 }}
                    onClick={() => onSelect(opt.value)}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all',
                      active
                        ? `bg-gradient-to-r ${gradient} text-white`
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {opt.label}
                    {active && <CheckCircle2 className="w-4 h-4" />}
                  </motion.button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============== DOCTORS GRID ============== */
function DoctorsGrid({
  loading,
  doctors,
  mode,
  onOpen,
  onChat,
  onEdit,
  onDelete,
  onBook,
  onCall,
  onVideo,
}: {
  loading: boolean
  doctors: ExtendedDoctor[]
  mode: Mode
  onOpen: (d: ExtendedDoctor) => void
  onChat: (d: ExtendedDoctor) => void
  onEdit: (d: ExtendedDoctor) => void
  onDelete: (d: ExtendedDoctor) => void
  onBook: (d: ExtendedDoctor) => void
  onCall: (d: ExtendedDoctor) => void
  onVideo: (d: ExtendedDoctor) => void
}) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/70 backdrop-blur rounded-3xl p-6 border border-white/60 shadow-lg animate-pulse"
          >
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
                <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded-lg w-full mb-2" />
            <div className="h-10 bg-gray-200 rounded-xl w-full mt-4" />
          </motion.div>
        ))}
      </div>
    )
  }
  if (doctors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-12 md:p-16 text-center shadow-xl"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-fuchsia-200 to-purple-200 rounded-3xl flex items-center justify-center"
        >
          <Stethoscope className="w-10 h-10 text-purple-500" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Doctors Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try adjusting your search or filter criteria to find the right specialist.
        </p>
      </motion.div>
    )
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {doctors.map((doctor, index) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          index={index}
          mode={mode}
          onOpen={() => onOpen(doctor)}
          onChat={() => onChat(doctor)}
          onEdit={() => onEdit(doctor)}
          onDelete={() => onDelete(doctor)}
          onBook={() => onBook(doctor)}
          onCall={() => onCall(doctor)}
          onVideo={() => onVideo(doctor)}
        />
      ))}
    </div>
  )
}

/* ============== DOCTOR CARD ============== */
function DoctorCard({
  doctor,
  index,
  mode,
  onOpen,
  onChat,
  onEdit,
  onDelete,
  onBook,
  onCall,
  onVideo,
}: {
  doctor: ExtendedDoctor
  index: number
  mode: Mode
  onOpen: () => void
  onChat: () => void
  onEdit: () => void
  onDelete: () => void
  onBook: () => void
  onCall: () => void
  onVideo: () => void
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl p-5 md:p-6 shadow-xl hover:shadow-2xl transition-shadow"
    >
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-fuchsia-500/5 via-purple-500/5 to-teal-500/5" />

      {mode === 'manage' && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-md text-teal-600 hover:bg-teal-50 border border-gray-100"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-md text-rose-600 hover:bg-rose-50 border border-gray-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <motion.div
          whileHover={{ rotate: 2, scale: 1.05 }}
          className="relative shrink-0"
        >
          <div
            className={clsx(
              'w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg bg-gradient-to-br',
              avatarGradient(doctor.name)
            )}
          >
            {getInitials(doctor.name)}
          </div>
          {doctor.online && (
            <motion.div
              className="absolute -top-1 -left-1 p-1 bg-white rounded-full shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
            >
              <div className="relative">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
            </motion.div>
          )}
          <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-md border border-white">
            <Award className="w-3 h-3 text-white" />
            <span className="text-[10px] font-black text-white">{doctor.experience}+ yrs</span>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="font-bold text-gray-800 text-lg truncate cursor-pointer hover:text-purple-600 transition-colors"
                onClick={onOpen}
              >
                {doctor.name}
              </h3>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-gradient-to-r from-fuchsia-100 to-purple-100 text-fuchsia-700 rounded-full text-xs font-bold">
                <BriefcaseMedical className="w-3 h-3" />
                {doctor.specialty}
              </div>
            </div>
            {doctor.online && (
              <div className="flex items-center gap-1 shrink-0 mt-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-emerald-700">ONLINE</span>
              </div>
            )}
          </div>
          <div className="mt-2 mb-1">
            {renderStars(doctor.rating, 'sm')}
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate font-medium">{doctor.hospital}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 p-3 md:p-4 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 rounded-2xl shadow-lg">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-white/70">Consultation Fee</p>
          <p className="text-2xl md:text-3xl font-black text-white">₹{doctor.fees.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-white/60 font-semibold">per session</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span className="font-black text-white text-lg">{doctor.rating}</span>
          </div>
          <p className="text-[10px] text-white/70 font-semibold">{doctor.reviewCount || 50}+ reviews</p>
        </div>
      </div>

      {(doctor.languages?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {doctor.languages!.slice(0, 3).map((lang) => (
            <span
              key={lang}
              className="px-2.5 py-1 bg-gray-100/80 text-gray-600 rounded-xl text-xs font-bold border border-gray-200"
            >
              {lang}
            </span>
          ))}
          {(doctor.languages!.length ?? 0) > 3 && (
            <span className="px-2.5 py-1 bg-gray-100/80 text-gray-500 rounded-xl text-xs font-bold">
              +{doctor.languages!.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        <ActionButton
          icon={MessageCircle}
          label="Chat"
          gradient="from-purple-500 to-fuchsia-600"
          onClick={onChat}
        />
        <ActionButton
          icon={Phone}
          label="Call"
          gradient="from-blue-500 to-indigo-600"
          onClick={onCall}
        />
        <ActionButton
          icon={Video}
          label="Video"
          gradient="from-teal-500 to-cyan-600"
          onClick={onVideo}
        />
        <ActionButton
          icon={Calendar}
          label="Book"
          gradient="from-rose-500 to-pink-600"
          onClick={onBook}
          primary
        />
      </div>
    </motion.div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  gradient,
  onClick,
  primary,
}: {
  icon: any
  label: string
  gradient: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl font-semibold text-xs transition-all',
        primary
          ? `bg-gradient-to-br ${gradient} text-white shadow-md hover:shadow-lg`
          : `bg-white/80 border border-white/60 hover:bg-gradient-to-br hover:${gradient} group/btn`
      )}
    >
      <Icon
        className={clsx(
          'w-4 h-4',
          primary ? 'text-white' : `text-gray-600 group-hover/btn:text-white`
        )}
      />
      <span className={primary ? 'text-white' : 'text-gray-700 group-hover/btn:text-white'}>
        {label}
      </span>
    </motion.button>
  )
}

/* ============== BOOK APPOINTMENT MODAL ============== */
function BookAppointmentModal({
  state,
  setState,
  onConfirm,
}: {
  state: BookAppointmentState
  setState: (s: BookAppointmentState | null) => void
  onConfirm: () => void
}) {
  const { doctor, date, time, reason, mode, reschedulingId } = state
  const modeOptions: Array<{ id: ConsultationMode; label: string; icon: any; gradient: string }> = [
    { id: 'in-clinic', label: 'In-Clinic', icon: MapPin, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'video-call', label: 'Video Call', icon: Video, gradient: 'from-teal-500 to-cyan-600' },
    { id: 'voice-call', label: 'Voice Call', icon: Phone, gradient: 'from-purple-500 to-fuchsia-600' },
  ]
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setState(null)}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
      />
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6 pointer-events-none"
      >
        <div className="w-full max-w-2xl max-h-[92vh] bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 rounded-3xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/70">
          <div className="relative px-6 md:px-8 py-5 md:py-6 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-pink-300 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-teal-300 to-transparent rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl border-4 border-white/30 bg-gradient-to-br',
                    avatarGradient(doctor.name)
                  )}
                >
                  {getInitials(doctor.name)}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">
                    {reschedulingId ? 'Reschedule Appointment' : 'Book Appointment'}
                  </h2>
                  <p className="text-white/80 text-sm mt-0.5">
                    with <span className="font-bold">{doctor.name}</span> · {doctor.specialty}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setState(null)}
                className="p-2.5 bg-white/15 backdrop-blur rounded-2xl border border-white/20 hover:bg-white/25"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-5">
            <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
              <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                </div>
                Select Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setState({ ...state, date: e.target.value, time: null })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3.5 bg-gradient-to-br from-fuchsia-50 to-purple-50 border-2 border-fuchsia-100 rounded-2xl text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
              <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                  <Clock3 className="w-3.5 h-3.5 text-white" />
                </div>
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {doctor.availableTime.map((t, idx) => {
                  const selected = time === t
                  return (
                    <motion.button
                      key={t + idx}
                      whileHover={selected ? {} : { scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setState({ ...state, time: t })}
                      className={clsx(
                        'py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2',
                        selected
                          ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-700 border-gray-100 hover:border-fuchsia-200 hover:bg-fuchsia-50'
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {t}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
              <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg">
                  <Video className="w-3.5 h-3.5 text-white" />
                </div>
                Consultation Mode
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {modeOptions.map((opt) => {
                  const active = mode === opt.id
                  return (
                    <motion.button
                      key={opt.id}
                      whileHover={active ? {} : { scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setState({ ...state, mode: opt.id })}
                      className={clsx(
                        'py-3 rounded-2xl font-bold text-xs transition-all flex flex-col items-center gap-1.5 border-2',
                        active
                          ? `bg-gradient-to-br ${opt.gradient} text-white border-transparent shadow-lg`
                          : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <opt.icon className="w-5 h-5" />
                      {opt.label}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
              <label className="block text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                Reason for Visit
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setState({ ...state, reason: e.target.value })}
                placeholder="Describe your symptoms or reason for consultation..."
                className="w-full px-4 py-3 bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-100 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none"
              />
            </motion.div>
          </div>

          <div className="px-5 md:px-8 py-5 bg-white/80 backdrop-blur-xl border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white/70">Total Fee</p>
                <p className="text-3xl font-black">₹{doctor.fees.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs font-bold text-white/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Secure Payment
                </div>
                <p className="text-[10px] text-white/60 mt-1">Confirmation after booking</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState(null)}
                className="py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={!time}
                className={clsx(
                  'py-3.5 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2',
                  time
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                {reschedulingId ? 'Confirm Reschedule' : 'Confirm Booking'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

/* ============== CALL MODAL ============== */
function CallModal({
  state,
  setState,
  onEnd,
}: {
  state: CallModalState
  setState: React.Dispatch<React.SetStateAction<CallModalState | null>>
  onEnd: () => void
}) {
  const { doctor, type, status, muted, cameraOn, speakerOn, duration } = state
  const formatCallDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
  }
  const statusText =
    status === 'connecting'
      ? `Connecting to ${doctor.name}...`
      : status === 'connected'
      ? `Connected · ${formatCallDuration(duration)}`
      : 'Call ended'

  const bgGradient =
    type === 'video'
      ? 'from-slate-900 via-indigo-950 to-purple-950'
      : 'from-indigo-900 via-purple-900 to-fuchsia-900'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[110] bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center p-6 overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
              }}
              transition={{
                duration: 4 + (i % 4),
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full bg-gradient-to-br from-pink-400/30 to-purple-400/30"
              style={{
                width: `${20 + (i * 7) % 60}px`,
                height: `${20 + (i * 7) % 60}px`,
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
              }}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnd}
          className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white/80 hover:bg-white/20 hover:text-white"
        >
          <X className="w-5 h-5" />
        </motion.button>

        <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8 text-center"
          >
            <div
              className={clsx(
                'inline-flex items-center gap-2 px-5 py-2 rounded-full backdrop-blur-xl border',
                status === 'connecting'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                  : status === 'connected'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-100'
              )}
            >
              {status === 'connecting' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.div>
              )}
              {status === 'connected' && <CheckCircle2 className="w-4 h-4" />}
              {status === 'ended' && <XCircle className="w-4 h-4" />}
              <span className="font-bold text-sm">{statusText}</span>
            </div>
          </motion.div>

          {type === 'video' && status !== 'ended' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-8 space-y-4"
            >
              <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className={clsx(
                      'w-28 h-28 md:w-36 md:h-36 rounded-3xl flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl border-4 border-white/20 bg-gradient-to-br',
                      avatarGradient(doctor.name)
                    )}
                  >
                    {cameraOn ? getInitials(doctor.name) : <VideoOff className="w-12 h-12 md:w-14 md:h-14" />}
                  </div>
                  <p className="mt-4 text-white font-bold text-lg">{doctor.name}</p>
                  <p className="text-white/60 text-sm">{doctor.specialty}</p>
                </div>
                {status === 'connecting' && (
                  <>
                    <motion.div
                      className="absolute inset-0 border-4 border-cyan-400/30 rounded-3xl"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-4 border-2 border-fuchsia-400/30 rounded-2xl"
                      animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
              </div>

              <div className="relative w-36 h-24 md:w-44 md:h-28 ml-auto bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl overflow-hidden shadow-xl border-2 border-white/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
                    <UserCircle2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <p className="mt-1 text-white/80 text-[10px] md:text-xs font-bold">Your Camera</p>
                </div>
                {!cameraOn && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <VideoOff className="w-6 h-6 text-white/70" />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {type === 'voice' && (
            <div className="relative mb-10">
              {status !== 'ended' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-cyan-400/30"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ margin: '-20px' }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-fuchsia-400/30"
                    animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
                    style={{ margin: '-40px' }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border border-pink-400/20"
                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
                    style={{ margin: '-60px' }}
                  />
                </>
              )}
              <motion.div
                animate={status === 'connected' ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                className={clsx(
                  'relative w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl border-6 border-white/20 bg-gradient-to-br',
                  avatarGradient(doctor.name)
                )}
                style={{ borderWidth: '6px' }}
              >
                {getInitials(doctor.name)}
              </motion.div>
            </div>
          )}

          {type === 'voice' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-10 text-center"
            >
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1">{doctor.name}</h2>
              <p className="text-white/70 text-sm font-semibold">{doctor.specialty} · {doctor.hospital}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 md:gap-4 p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setState((prev) => (prev ? { ...prev, muted: !prev.muted } : null))}
              className={clsx(
                'relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all border-2',
                muted
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-white/30 shadow-lg shadow-rose-500/40'
                  : 'bg-white/15 text-white hover:bg-white/25 border-white/20'
              )}
            >
              {muted ? <MicOff className="w-6 h-6 md:w-7 md:h-7" /> : <Mic className="w-6 h-6 md:w-7 md:h-7" />}
              <span className="absolute -bottom-6 text-[10px] text-white/60 font-bold whitespace-nowrap">
                {muted ? 'Unmute' : 'Mute'}
              </span>
            </motion.button>

            {type === 'video' && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setState((prev) => (prev ? { ...prev, cameraOn: !prev.cameraOn } : null))}
                className={clsx(
                  'relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all border-2',
                  !cameraOn
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-white/30 shadow-lg shadow-rose-500/40'
                    : 'bg-white/15 text-white hover:bg-white/25 border-white/20'
                )}
              >
                {!cameraOn ? <VideoOff className="w-6 h-6 md:w-7 md:h-7" /> : <Video className="w-6 h-6 md:w-7 md:h-7" />}
                <span className="absolute -bottom-6 text-[10px] text-white/60 font-bold whitespace-nowrap">
                  {cameraOn ? 'Camera Off' : 'Camera On'}
                </span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setState((prev) => (prev ? { ...prev, speakerOn: !prev.speakerOn } : null))}
              className={clsx(
                'relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all border-2',
                !speakerOn
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-white/30 shadow-lg shadow-amber-500/40'
                  : 'bg-white/15 text-white hover:bg-white/25 border-white/20'
              )}
            >
              {speakerOn ? <Volume2 className="w-6 h-6 md:w-7 md:h-7" /> : <VolumeX className="w-6 h-6 md:w-7 md:h-7" />}
              <span className="absolute -bottom-6 text-[10px] text-white/60 font-bold whitespace-nowrap">
                {speakerOn ? 'Speaker' : 'Muted'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onEnd}
              className="relative w-16 h-14 md:w-20 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-rose-500 via-red-500 to-red-600 text-white shadow-xl shadow-red-500/50 border-2 border-white/30 hover:shadow-red-500/70 transition-all"
              style={{ marginRight: type === 'voice' ? 0 : undefined }}
            >
              <PhoneOff className="w-7 h-7 md:w-8 md:h-8 rotate-[135deg]" />
              <span className="absolute -bottom-6 text-[10px] text-white/60 font-bold whitespace-nowrap">
                End Call
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}

/* ============== DOCTOR DRAWER ============== */
function DoctorDrawer({
  doctor,
  onClose,
  activeTab,
  setActiveTab,
  selectedTime,
  setSelectedTime,
  selectedDate,
  setSelectedDate,
  onBook,
  onChat,
  onBookModal,
  onCall,
  onVideo,
  onUploadPrescription,
  onShareReport,
}: {
  doctor: ExtendedDoctor
  onClose: () => void
  activeTab: 'about' | 'schedule' | 'reviews' | 'book'
  setActiveTab: (t: 'about' | 'schedule' | 'reviews' | 'book') => void
  selectedTime: string | null
  setSelectedTime: (t: string | null) => void
  selectedDate: string
  setSelectedDate: (d: string) => void
  onBook: () => void
  onChat: (d: ExtendedDoctor) => void
  onBookModal: () => void
  onCall: () => void
  onVideo: () => void
  onUploadPrescription: () => void
  onShareReport: () => void
}) {
  const tabs: Array<{ id: typeof activeTab; label: string; icon: any }> = [
    { id: 'about', label: 'About', icon: UserCircle2 },
    { id: 'schedule', label: 'Schedule', icon: Clock3 },
    { id: 'reviews', label: 'Reviews', icon: Quote },
    { id: 'book', label: 'Book', icon: CalendarCheck2 },
  ]
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg md:max-w-xl bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="relative bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 px-6 pt-8 pb-10 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-bl from-pink-300 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-teal-300 to-transparent rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2.5 bg-white/15 backdrop-blur rounded-2xl text-white border border-white/20 hover:bg-white/25"
              >
                <X className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full border border-white/20">
                <BadgeCheck className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-semibold text-xs">Verified</span>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className={clsx(
                  'w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-2xl border-4 border-white/30 bg-gradient-to-br',
                  avatarGradient(doctor.name)
                )}
              >
                {getInitials(doctor.name)}
              </motion.div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{doctor.name}</h2>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm font-bold">
                  <BriefcaseMedical className="w-3.5 h-3.5" />
                  {doctor.specialty}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="font-bold">{doctor.rating}</span>
                    <span className="opacity-70">({doctor.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{doctor.experience} yrs exp</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {doctor.online ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/30 backdrop-blur rounded-full border border-emerald-400/40">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"
                  />
                  <span className="text-emerald-100 text-xs font-bold">Online Now</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/30 backdrop-blur rounded-full border border-gray-400/30">
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  <span className="text-gray-200 text-xs font-bold">Offline</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full border border-white/20">
                <Building2 className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/90 text-xs font-bold truncate max-w-[180px]">{doctor.hospital}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full border border-white/20">
                <span className="text-white text-xs font-black">₹{doctor.fees.toLocaleString('en-IN')} / visit</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 bg-white/70 backdrop-blur border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const active = activeTab === t.id
              return (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(t.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all',
                    active
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'about' && (
              <motion.div
                key="about"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <InfoCard
                  icon={Building2}
                  title="Hospital / Clinic"
                  value={doctor.hospital}
                  gradient="from-blue-500 to-indigo-600"
                />
                <InfoCard
                  icon={GraduationCap}
                  title="Qualifications"
                  value={doctor.qualification || 'MBBS, MD'}
                  gradient="from-purple-500 to-fuchsia-600"
                />
                <InfoCard
                  icon={BadgeCheck}
                  title="Registration ID"
                  value={doctor.registrationId || 'N/A'}
                  gradient="from-teal-500 to-cyan-600"
                />
                <InfoCard
                  icon={HeartHandshake}
                  title="Services Offered"
                  list={doctor.services}
                  gradient="from-rose-500 to-pink-600"
                />
                <InfoCard
                  icon={Languages}
                  title="Languages Spoken"
                  list={doctor.languages}
                  gradient="from-amber-500 to-orange-600"
                />
                <InfoCard
                  icon={Globe}
                  title="Contact"
                  contact={{ phone: doctor.phone, email: doctor.email }}
                  gradient="from-emerald-500 to-teal-600"
                />

                <motion.div
                  variants={fadeUp}
                  className="bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl shadow-md">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800">Quick Consultation</h4>
                      <p className="text-xs text-gray-500">Chat, share prescriptions or reports</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onChat(doctor)}
                      className="py-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Start Chat
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onUploadPrescription}
                      className="py-3 bg-white border-2 border-fuchsia-200 text-fuchsia-700 rounded-2xl font-bold text-sm hover:bg-fuchsia-50 flex items-center justify-center gap-2"
                    >
                      <Pill className="w-4 h-4" />
                      Upload Rx
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onShareReport}
                      className="py-3 bg-white border-2 border-teal-200 text-teal-700 rounded-2xl font-bold text-sm hover:bg-teal-50 flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Share Report
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onBookModal}
                      className="py-3 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Now
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800">About {doctor.name.split(' ')[0]}</h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{doctor.bio}</p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Available Days
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {WEEK_DAYS.map((day) => {
                      const available = doctor.availableDays?.includes(day)
                      return (
                        <motion.div
                          key={day}
                          whileHover={available ? { scale: 1.08 } : {}}
                          className={clsx(
                            'aspect-square rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all',
                            available
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-400 line-through'
                          )}
                        >
                          <span>{day}</span>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    Available Time Slots
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {doctor.availableTime.map((time, idx) => (
                      <motion.div
                        key={time + idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-fuchsia-50 to-purple-50 border border-fuchsia-100 rounded-2xl text-sm font-bold text-fuchsia-700"
                      >
                        <Clock3 className="w-3.5 h-3.5" />
                        {time}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 rounded-3xl p-5 text-white shadow-xl">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-white/70">Consultation Fee</p>
                      <p className="text-4xl font-black">₹{doctor.fees.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-white/70 mt-1">per consultation</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                        <span className="font-black text-xl">{doctor.rating}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">{doctor.reviewCount} reviews</p>
                    </div>
                  </div>
                  <div className="h-px bg-white/20 my-4" />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onBookModal}
                    className="w-full py-4 bg-white text-fuchsia-600 rounded-2xl font-black text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Book Appointment
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <motion.div
                  variants={fadeUp}
                  className="bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-5xl font-black">{doctor.rating}</p>
                      <div className="flex gap-0.5 mt-2">
                        {renderStars(doctor.rating, 'md')}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{doctor.reviewCount}</p>
                      <p className="text-white/70 text-sm">reviews</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 6 : star === 2 ? 1 : 1
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-3 text-white/80">{star}</span>
                          <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-yellow-300 rounded-full"
                            />
                          </div>
                          <span className="w-8 text-right text-white/80">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {(doctor.reviews || []).map((review, idx) => (
                  <motion.div
                    key={review.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={clsx(
                          'w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br',
                          avatarGradient(review.patient)
                        )}
                      >
                        {getInitials(review.patient)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-800 truncate">{review.patient}</p>
                          <span className="text-xs text-gray-400 shrink-0">{review.date}</span>
                        </div>
                        <div className="mt-0.5">{renderStars(review.rating, 'sm')}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm pl-14">"{review.comment}"</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'book' && (
              <motion.div
                key="book"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setSelectedTime(null)
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3.5 bg-gradient-to-br from-fuchsia-50 to-purple-50 border border-fuchsia-100 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent"
                  />
                </motion.div>

                <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-teal-500" />
                    Available Slots
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {doctor.availableTime.map((time, idx) => {
                      const selected = selectedTime === time
                      return (
                        <motion.button
                          key={time + idx}
                          whileHover={selected ? {} : { scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedTime(time)}
                          className={clsx(
                            'py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2',
                            selected
                              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border-transparent shadow-lg'
                              : 'bg-white text-gray-700 border-gray-100 hover:border-fuchsia-200 hover:bg-fuchsia-50'
                          )}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {time}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 rounded-3xl p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 font-semibold">Consultation Fee</span>
                    <span className="text-3xl font-black">₹{doctor.fees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-px bg-white/20 my-3" />
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-white/80 font-semibold text-sm">You Pay</span>
                    <span className="text-2xl font-black text-yellow-300">₹{doctor.fees.toLocaleString('en-IN')}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onBook}
                    disabled={!selectedTime}
                    className={clsx(
                      'w-full py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2',
                      selectedTime
                        ? 'bg-white text-fuchsia-600 hover:shadow-xl'
                        : 'bg-white/40 text-white/70 cursor-not-allowed'
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {selectedTime ? 'Confirm Booking' : 'Select a time slot'}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChat(doctor)}
            className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-2xl font-bold shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            Start Chat
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onVideo}
            className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-bold shadow-lg"
          >
            <Video className="w-4 h-4" />
            Video Call
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

function InfoCard({
  icon: Icon,
  title,
  value,
  list,
  contact,
  gradient,
}: {
  icon: any
  title: string
  value?: string
  list?: string[]
  contact?: { phone: string; email?: string }
  gradient: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-4 shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-md shrink-0`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">{title}</p>
          {value && <p className="font-bold text-gray-800 break-words">{value}</p>}
          {list && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {list.map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 bg-gradient-to-r from-fuchsia-50 to-purple-50 text-fuchsia-700 rounded-xl text-xs font-bold border border-fuchsia-100"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          {contact && (
            <div className="space-y-1.5 mt-1">
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-500" />
                {contact.phone}
              </a>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-500" />
                  {contact.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ============== FAB ============== */
function FAB({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 30 }}
          whileHover={{ scale: 1.08, rotate: 90 }}
          whileTap={{ scale: 0.92 }}
          onClick={onClick}
          className="fixed z-40 right-6 bottom-6 w-16 h-16 md:w-18 md:h-18 bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center text-white border-4 border-white/40"
          style={{ boxShadow: '0 20px 60px -15px rgba(236, 72, 153, 0.6)' }}
        >
          <Plus className="w-8 h-8 md:w-9 md:h-9" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

/* ============== FORM MODAL ============== */
function DoctorFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: ExtendedDoctor | null
  onClose: () => void
  onSave: (d: Omit<ExtendedDoctor, 'id' | 'reviews' | 'reviewCount'>) => void
}) {
  const [form, setForm] = useState<Omit<ExtendedDoctor, 'id' | 'reviews' | 'reviewCount'>>({
    name: initial?.name || '',
    specialty: initial?.specialty || 'Gynecologist',
    experience: initial?.experience ?? 5,
    hospital: initial?.hospital || '',
    rating: initial?.rating ?? 4.8,
    availableTime: initial?.availableTime?.length ? initial.availableTime : ['09:00 AM', '11:00 AM', '02:00 PM'],
    fees: initial?.fees ?? 100,
    online: initial?.online ?? true,
    phone: initial?.phone || '+1 555-000-0000',
    videoLink: initial?.videoLink || 'https://meet.google.com/new',
    email: initial?.email || '',
    qualification: initial?.qualification || 'MD, MBBS',
    registrationId: initial?.registrationId || '',
    bio: initial?.bio || '',
    languages: initial?.languages || ['English'],
    availableDays: initial?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    services: initial?.services || ['General Consultation'],
    photo: initial?.photo,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [newService, setNewService] = useState('')
  const [newTimeSlot, setNewTimeSlot] = useState('')

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) setErrors((p) => ({ ...p, [key as string]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.specialty.trim()) e.specialty = 'Specialty is required'
    if (!form.hospital.trim()) e.hospital = 'Hospital / Clinic is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (form.experience < 0) e.experience = 'Invalid experience'
    if (form.fees < 0) e.fees = 'Invalid fee'
    if (form.rating < 0 || form.rating > 5) e.rating = 'Rating must be 0-5'
    if (form.availableTime.length === 0) e.availableTime = 'Add at least one time slot'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setSaved(true)
    setTimeout(() => {
      onSave(form)
    }, 500)
  }

  const toggleLanguage = (lang: string) => {
    setField('languages', form.languages?.includes(lang)
      ? form.languages.filter((l) => l !== lang)
      : [...(form.languages || []), lang])
  }

  const toggleDay = (day: string) => {
    setField('availableDays', form.availableDays?.includes(day)
      ? form.availableDays.filter((d) => d !== day)
      : [...(form.availableDays || []), day])
  }

  const addService = () => {
    if (!newService.trim()) return
    setField('services', [...(form.services || []), newService.trim()])
    setNewService('')
  }

  const removeService = (s: string) => {
    setField('services', form.services?.filter((x) => x !== s) || [])
  }

  const addTimeSlot = () => {
    if (!newTimeSlot.trim()) return
    setField('availableTime', [...form.availableTime, newTimeSlot.trim()])
    setNewTimeSlot('')
  }

  const removeTimeSlot = (t: string) => {
    setField('availableTime', form.availableTime.filter((x) => x !== t))
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md"
      />
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6 pointer-events-none"
      >
        <div className="w-full max-w-3xl max-h-[92vh] bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 rounded-3xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden border border-white/70">
          <div className="relative px-6 md:px-8 py-5 md:py-6 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-pink-300 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-teal-300 to-transparent rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">
                  {initial ? 'Edit Doctor Profile' : 'Add New Doctor'}
                </h2>
                <p className="text-white/80 text-sm mt-0.5">
                  Fill in the details below to add a specialist to the platform.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2.5 bg-white/15 backdrop-blur rounded-2xl border border-white/20 hover:bg-white/25"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
            <Section title="Personal Information" icon={UserCircle2} gradient="from-fuchsia-500 to-purple-600">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full Name" error={errors.name} required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className={inputCls(!!errors.name)}
                  />
                </Field>
                <Field label="Specialty" error={errors.specialty} required>
                  <select
                    value={form.specialty}
                    onChange={(e) => setField('specialty', e.target.value)}
                    className={inputCls(!!errors.specialty)}
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Hospital / Clinic" error={errors.hospital} required>
                  <input
                    type="text"
                    value={form.hospital}
                    onChange={(e) => setField('hospital', e.target.value)}
                    placeholder="City Medical Center"
                    className={inputCls(!!errors.hospital)}
                  />
                </Field>
                <Field label="Qualification">
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) => setField('qualification', e.target.value)}
                    placeholder="MD, MBBS, FRCOG"
                    className={inputCls()}
                  />
                </Field>
                <Field label="Years of Experience" error={errors.experience}>
                  <input
                    type="number"
                    min={0}
                    value={form.experience}
                    onChange={(e) => setField('experience', Number(e.target.value))}
                    className={inputCls(!!errors.experience)}
                  />
                </Field>
                <Field label="Rating (0-5)" error={errors.rating}>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={5}
                    value={form.rating}
                    onChange={(e) => setField('rating', Number(e.target.value))}
                    className={inputCls(!!errors.rating)}
                  />
                </Field>
                <Field label="Consultation Fee (₹)" error={errors.fees}>
                  <input
                    type="number"
                    min={0}
                    value={form.fees}
                    onChange={(e) => setField('fees', Number(e.target.value))}
                    className={inputCls(!!errors.fees)}
                  />
                </Field>
                <Field label="Registration ID">
                  <input
                    type="text"
                    value={form.registrationId}
                    onChange={(e) => setField('registrationId', e.target.value)}
                    placeholder="REG-123456"
                    className={inputCls()}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Contact Information" icon={Smartphone} gradient="from-teal-500 to-cyan-600">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Phone Number" error={errors.phone} required>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="+1 555-123-4567"
                    className={inputCls(!!errors.phone)}
                  />
                </Field>
                <Field label="Email Address">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="doctor@femcare.com"
                    className={inputCls()}
                  />
                </Field>
                <Field label="Video Call Link" span={2}>
                  <input
                    type="url"
                    value={form.videoLink}
                    onChange={(e) => setField('videoLink', e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className={inputCls()}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Availability & Schedule"
              icon={Calendar}
              gradient="from-blue-500 to-indigo-600"
            >
              <Field label="Online Now">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setField('online', !form.online)}
                    className={clsx(
                      'relative w-16 h-9 rounded-full transition-colors',
                      form.online ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300'
                    )}
                  >
                    <motion.div
                      animate={{ x: form.online ? 28 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-7 h-7 bg-white rounded-full shadow-md"
                    />
                  </motion.button>
                  <span className="text-sm font-semibold text-gray-600">
                    {form.online ? 'Accepting patients online' : 'Currently offline'}
                  </span>
                </div>
              </Field>

              <Field label="Available Days">
                <div className="grid grid-cols-7 gap-2">
                  {WEEK_DAYS.map((day) => {
                    const active = form.availableDays?.includes(day)
                    return (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleDay(day)}
                        className={clsx(
                          'py-2.5 rounded-xl font-bold text-sm transition-all',
                          active
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                      >
                        {day}
                      </motion.button>
                    )
                  })}
                </div>
              </Field>

              <Field label="Available Time Slots" error={errors.availableTime}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {form.availableTime.map((t) => (
                      <div
                        key={t}
                        className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl"
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-sm font-bold text-blue-700">{t}</span>
                        </div>
                        <button
                          onClick={() => removeTimeSlot(t)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTimeSlot()}
                      placeholder="e.g. 10:30 AM"
                      className={clsx(inputCls(), 'flex-1')}
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={addTimeSlot}
                      className="px-4 py-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </Field>
            </Section>

            <Section title="Languages" icon={Languages} gradient="from-amber-500 to-orange-600">
              <div className="flex flex-wrap gap-2">
                {DEFAULT_LANGUAGES.map((lang) => {
                  const active = form.languages?.includes(lang)
                  return (
                    <motion.button
                      key={lang}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleLanguage(lang)}
                      className={clsx(
                        'px-4 py-2 rounded-2xl font-bold text-sm transition-all border-2',
                        active
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-amber-200 hover:bg-amber-50'
                      )}
                    >
                      {lang}
                    </motion.button>
                  )
                })}
              </div>
            </Section>

            <Section title="Services Offered" icon={HeartHandshake} gradient="from-rose-500 to-pink-600">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(form.services || []).map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-1.5 pl-4 pr-2 py-1.5 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-full"
                    >
                      <span className="text-sm font-bold text-rose-700">{s}</span>
                      <button
                        onClick={() => removeService(s)}
                        className="p-1 text-rose-500 hover:bg-rose-100 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addService()}
                    placeholder="e.g. Prenatal Checkup"
                    className={clsx(inputCls(), 'flex-1')}
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={addService}
                    className="px-4 py-3 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-xl font-bold shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </Section>

            <Section title="Short Biography" icon={Info} gradient="from-violet-500 to-purple-600">
              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Write a brief professional biography for the doctor profile..."
                className={clsx(inputCls(), 'resize-none')}
              />
            </Section>
          </div>

          <div className="px-5 md:px-8 py-5 bg-white/80 backdrop-blur-xl border-t border-gray-100 grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={saved}
              className={clsx(
                'py-3.5 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2',
                saved
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 text-white hover:shadow-xl'
              )}
            >
              {saved ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Saved!
                </motion.span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {initial ? 'Save Changes' : 'Add Doctor'}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

function inputCls(error = false) {
  return clsx(
    'w-full px-4 py-3 bg-white border-2 rounded-2xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all',
    error ? 'border-rose-300 bg-rose-50/50' : 'border-gray-100 focus:bg-fuchsia-50/30'
  )
}

function Section({
  icon: Icon,
  title,
  children,
  gradient,
}: {
  icon: any
  title: string
  children: React.ReactNode
  gradient: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white/80 backdrop-blur border border-white/60 rounded-3xl p-5 shadow-md"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 bg-gradient-to-br ${gradient} rounded-xl shadow-md`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <h3 className="font-black text-gray-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  )
}

function Field({
  label,
  error,
  required,
  span,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  span?: 1 | 2
  children: React.ReactNode
}) {
  return (
    <div className={clsx(span === 2 && 'md:col-span-2')}>
      <label className="block text-xs font-black uppercase tracking-wide text-gray-500 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  )
}

/* ============== DELETE CONFIRM ============== */
function DeleteConfirm({
  doctor,
  onCancel,
  onConfirm,
}: {
  doctor: ExtendedDoctor
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
      />
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-gradient-to-br from-rose-50 via-white to-red-50 rounded-3xl shadow-2xl pointer-events-auto border border-white/70 overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center shadow-inner"
            >
              <Trash2 className="w-10 h-10 text-rose-600" />
            </motion.div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Delete Doctor Profile?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to remove{' '}
              <span className="font-bold text-gray-800">{doctor.name}</span>,{' '}
              <span className="font-medium">{doctor.specialty}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 p-4 bg-white/70 backdrop-blur rounded-2xl border border-white/60">
              <div
                className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md bg-gradient-to-br',
                  avatarGradient(doctor.name)
                )}
              >
                {getInitials(doctor.name)}
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">{doctor.name}</p>
                <p className="text-sm text-gray-500">{doctor.hospital}</p>
              </div>
            </div>
          </div>
          <div className="px-8 pb-8 grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              className="py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Keep Profile
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              className="py-3.5 rounded-2xl font-black bg-gradient-to-r from-rose-500 via-red-500 to-red-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> Delete
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

/* ============== APPOINTMENTS TIMELINE ============== */
function AppointmentsTimeline({
  appointments,
  doctors,
  onCancel,
  onVideo,
  onCall,
  onReschedule,
}: {
  appointments: Appointment[]
  doctors: ExtendedDoctor[]
  onCancel: (id: string) => void
  onVideo: (doctor: ExtendedDoctor) => void
  onCall: (doctor: ExtendedDoctor) => void
  onReschedule: (apt: Appointment, doctor: ExtendedDoctor) => void
}) {
  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const da = new Date(a.date + ' ' + a.time).getTime()
      const db = new Date(b.date + ' ' + b.time).getTime()
      return db - da
    })
  }, [appointments])

  const grouped = useMemo(() => {
    const groups: Record<string, Appointment[]> = {}
    sorted.forEach((a) => {
      if (!groups[a.status]) groups[a.status] = []
      groups[a.status].push(a)
    })
    return groups
  }, [sorted])

  const getDoctor = (id: string) => doctors.find((d) => d.id === id)

  if (appointments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-12 md:p-16 text-center shadow-xl"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fuchsia-200 via-purple-200 to-indigo-200 rounded-3xl flex items-center justify-center"
        >
          <CalendarClock className="w-12 h-12 text-purple-600" />
        </motion.div>
        <h3 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">No Appointments Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Book your first consultation with a verified specialist and take the first step towards better health.
        </p>
      </motion.div>
    )
  }

  const statusSections: Array<{
    key: Appointment['status']
    title: string
    icon: any
    gradient: string
    emptyText: string
  }> = [
    {
      key: 'upcoming',
      title: 'Upcoming Appointments',
      icon: CalendarCheck2,
      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-600',
      emptyText: 'No upcoming appointments.',
    },
    {
      key: 'completed',
      title: 'Past Visits',
      icon: CheckCircle2,
      gradient: 'from-teal-500 to-emerald-600',
      emptyText: 'No completed appointments yet.',
    },
    {
      key: 'cancelled',
      title: 'Cancelled',
      icon: CalendarX2,
      gradient: 'from-rose-500 to-red-600',
      emptyText: 'No cancelled appointments.',
    },
  ]

  return (
    <div className="space-y-8">
      {statusSections.map((section, sIdx) => {
        const items = grouped[section.key] || []
        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 bg-gradient-to-br ${section.gradient} rounded-xl shadow-md`}>
                <section.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-800">{section.title}</h3>
                <p className="text-xs text-gray-500 font-semibold">
                  {items.length} appointment{items.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="bg-white/60 backdrop-blur border border-white/50 border-dashed rounded-3xl p-8 text-center">
                <p className="text-gray-400 font-medium">{section.emptyText}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((apt, idx) => {
                  const doc = getDoctor(apt.doctorId)
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 md:p-6 shadow-lg overflow-hidden"
                    >
                      <div
                        className={clsx(
                          'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
                          apt.status === 'upcoming'
                            ? 'from-fuchsia-500 to-indigo-500'
                            : apt.status === 'completed'
                            ? 'from-teal-500 to-emerald-500'
                            : 'from-rose-500 to-red-500'
                        )}
                      />

                      <div className="flex items-start gap-4 md:gap-5">
                        <div className="relative shrink-0">
                          <div
                            className={clsx(
                              'w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-lg bg-gradient-to-br',
                              doc ? avatarGradient(doc.name) : 'from-gray-400 to-gray-500'
                            )}
                          >
                            {doc ? getInitials(doc.name) : 'DR'}
                          </div>
                          {apt.status === 'upcoming' && doc?.online && (
                            <div className="absolute -top-1 -left-1 p-1 bg-white rounded-full shadow">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="font-black text-gray-800 text-lg">
                                {doc?.name || apt.doctorName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <TimelineChip
                                  icon={BriefcaseMedical}
                                  text={doc?.specialty || apt.specialty}
                                  bg="from-fuchsia-50 to-purple-50"
                                  textColor="text-fuchsia-700"
                                />
                                <StatusBadge status={apt.status} />
                              </div>
                            </div>
                            {doc && apt.status === 'upcoming' && (
                              <TimelineChip
                                icon={Stethoscope}
                                text={`₹${(doc.fees || 1700).toLocaleString('en-IN')}`}
                                bg="from-emerald-50 to-teal-50"
                                textColor="text-emerald-700"
                              />
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-3 text-sm">
                            <TimelineChip
                              icon={Calendar}
                              text={new Date(apt.date + 'T00:00:00').toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                              bg="from-blue-50 to-indigo-50"
                              textColor="text-blue-700"
                            />
                            <TimelineChip
                              icon={Clock3}
                              text={apt.time}
                              bg="from-violet-50 to-purple-50"
                              textColor="text-violet-700"
                            />
                            <TimelineChip
                              icon={Building2}
                              text={doc?.hospital || apt.hospital}
                              bg="from-amber-50 to-orange-50"
                              textColor="text-amber-700"
                            />
                          </div>

                          {apt.notes && (
                            <div className="mt-4 p-3 bg-gradient-to-br from-fuchsia-50/80 to-purple-50/80 rounded-2xl border border-fuchsia-100">
                              <div className="flex items-center gap-2 mb-1.5">
                                <FileText className="w-3.5 h-3.5 text-fuchsia-600" />
                                <p className="text-[11px] font-black uppercase tracking-wider text-fuchsia-600">
                                  Reason for Visit
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{apt.notes}</p>
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-2.5">
                            {apt.status === 'upcoming' && doc && (
                              <>
                                <TimelineAction
                                  onClick={() => onVideo(doc)}
                                  icon={Video}
                                  label="Video Call"
                                  gradient="from-teal-500 to-cyan-600"
                                />
                                <TimelineAction
                                  onClick={() => onCall(doc)}
                                  icon={Phone}
                                  label="Voice Call"
                                  gradient="from-blue-500 to-indigo-600"
                                />
                                <TimelineAction
                                  onClick={() => onReschedule(apt, doc)}
                                  icon={RotateCcw}
                                  label="Reschedule"
                                  gradient="from-violet-500 to-purple-600"
                                />
                                <TimelineAction
                                  onClick={() => onCancel(apt.id)}
                                  icon={XCircle}
                                  label="Cancel"
                                  gradient="from-rose-500 to-red-600"
                                  ghost
                                />
                              </>
                            )}
                            {apt.status === 'completed' && doc && (
                              <TimelineAction
                                onClick={() => onVideo(doc)}
                                icon={MessageCircle}
                                label="Follow-up Chat"
                                gradient="from-fuchsia-500 to-purple-600"
                              />
                            )}
                            {apt.status === 'cancelled' && doc && (
                              <TimelineAction
                                onClick={() => onReschedule(apt, doc)}
                                icon={CalendarCheck2}
                                label="Book New"
                                gradient="from-emerald-500 to-teal-600"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const cfg = {
    upcoming: {
      gradient: 'from-fuchsia-500/15 to-purple-500/15',
      border: 'border-fuchsia-200',
      text: 'text-fuchsia-700',
      dot: 'bg-fuchsia-500',
      label: 'Upcoming',
    },
    completed: {
      gradient: 'from-emerald-500/15 to-teal-500/15',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Completed',
    },
    cancelled: {
      gradient: 'from-rose-500/15 to-red-500/15',
      border: 'border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      label: 'Cancelled',
    },
  }[status]
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border bg-gradient-to-r',
        cfg.gradient,
        cfg.border,
        cfg.text
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </div>
  )
}

function TimelineChip({
  icon: Icon,
  text,
  bg,
  textColor,
}: {
  icon: any
  text: string
  bg: string
  textColor: string
}) {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border bg-gradient-to-br font-bold text-xs',
        bg,
        'border-white/60',
        textColor
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="truncate max-w-[160px]">{text}</span>
    </div>
  )
}

function TimelineAction({
  icon: Icon,
  label,
  gradient,
  onClick,
  ghost,
}: {
  icon: any
  label: string
  gradient: string
  onClick: () => void
  ghost?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm shadow-md transition-all border-2',
        ghost
          ? `bg-white border-rose-200 text-rose-600 hover:bg-rose-50`
          : `bg-gradient-to-br ${gradient} text-white border-transparent hover:shadow-lg`
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  )
}