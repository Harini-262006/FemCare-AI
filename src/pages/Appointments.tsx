import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  XCircle,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Star,
  Download,
  MessageSquare,
  RefreshCw,
  X,
  AlertCircle,
  Bell,
  ChevronDown,
  Stethoscope,
  FileText,
  Sparkles,
  Heart
} from 'lucide-react';
import {
  useAppointments,
  useAppStore,
  useReminders,
  type Appointment,
  type Doctor
} from '../store';

type TabType = 'upcoming' | 'past' | 'cancelled';

export default function Appointments() {
  const navigate = useNavigate();
  const appointments = useAppointments();
  const reminders = useReminders();
  const { doctors, addAppointment, updateAppointment } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isVideoConsultation, setIsVideoConsultation] = useState(true);
  const [bookingNotes, setBookingNotes] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.status === activeTab);
  }, [appointments, activeTab]);

  const upcomingReminders = useMemo(() => {
    return reminders
      .filter((r) => r.type === 'appointment' && r.enabled)
      .slice(0, 3);
  }, [reminders]);

  const appointmentDates = useMemo(() => {
    return new Set(appointments.map((a) => a.date));
  }, [appointments]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
    );
  }, [doctors, doctorSearch]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    const bookedForDate = appointments
      .filter(
        (a) =>
          a.doctorId === selectedDoctor.id &&
          a.date === selectedDate &&
          a.status !== 'cancelled'
      )
      .map((a) => a.time);
    return selectedDoctor.availableTime.map((t) => ({
      time: t,
      available: !bookedForDate.includes(t)
    }));
  }, [selectedDoctor, selectedDate, appointments]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const resetBookingFlow = () => {
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
    setIsVideoConsultation(true);
    setBookingNotes('');
    setDoctorSearch('');
  };

  const handleConfirmBooking = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: selectedDate,
      time: selectedTime,
      hospital: selectedDoctor.hospital,
      notes: bookingNotes,
      status: 'upcoming'
    };
    addAppointment(newAppointment);
    setShowBookingFlow(false);
    setShowSuccessModal(true);
    resetBookingFlow();
    setTimeout(() => setShowSuccessModal(false), 2500);
  };

  const handleCancelAppointment = (id: string) => {
    updateAppointment(id, { status: 'cancelled' });
    setShowCancelModal(null);
  };

  const handleReschedule = (apt: Appointment) => {
    const doctor = doctors.find((d) => d.id === apt.doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setSelectedDate(apt.date);
      setShowBookingFlow(true);
    }
  };

  const handleRebook = (apt: Appointment) => {
    const doctor = doctors.find((d) => d.id === apt.doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setSelectedDate('');
      setSelectedTime('');
      setShowBookingFlow(true);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' }
    })
  };

  const bookingDays = getDaysInMonth(calendarMonth);
  const miniCalendarDays = getDaysInMonth(miniCalendarMonth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-teal-200/40 to-cyan-200/40 rounded-full blur-3xl translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-200/40 to-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-6 max-w-6xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-600 to-teal-600 bg-clip-text text-transparent">
                My Appointments
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your telemedicine bookings
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              resetBookingFlow();
              setShowBookingFlow(true);
            }}
            className="group relative px-5 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500 text-white rounded-2xl font-semibold shadow-lg overflow-hidden hidden sm:flex items-center gap-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Plus className="w-5 h-5 relative z-10" />
            <span className="relative z-10 whitespace-nowrap">Book New</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetBookingFlow();
              setShowBookingFlow(true);
            }}
            className="p-3 bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500 text-white rounded-2xl shadow-lg sm:hidden"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </motion.header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-2 shadow-xl border border-white/60"
            >
              <div className="grid grid-cols-3 gap-2 relative">
                {(['upcoming', 'past', 'cancelled'] as TabType[]).map((tab, i) => (
                  <motion.button
                    key={tab}
                    custom={i}
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab)}
                    className={`relative z-10 py-3 px-4 rounded-2xl font-semibold text-sm md:text-base capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        activeTab === tab
                          ? 'bg-white/25 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {appointments.filter((a) => a.status === tab).length}
                    </span>
                  </motion.button>
                ))}
                <AnimatePresence>
                  <motion.div
                    key={activeTab}
                    layoutId="tabIndicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="absolute top-2 bottom-2 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500 shadow-lg"
                    style={{
                      width: `calc(${(1 / 3) * 100}% - 0.25rem)`,
                      left: `calc(${(['upcoming', 'past', 'cancelled'].indexOf(activeTab) as number) * (100 / 3)}% + 0.125rem)`
                    }}
                  />
                </AnimatePresence>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {filteredAppointments.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-white/60 text-center"
                >
                  <motion.div
                    animate={{
                      y: [0, -12, 0],
                      rotate: [0, 3, -3, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="relative inline-block mb-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-purple-400/30 rounded-full blur-2xl scale-150" />
                    <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-pink-100 via-purple-100 to-teal-100 flex items-center justify-center shadow-inner">
                      <div className="text-5xl md:text-6xl">
                        {activeTab === 'upcoming' && '🌸'}
                        {activeTab === 'past' && '📚'}
                        {activeTab === 'cancelled' && '🌿'}
                      </div>
                    </div>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2"
                  >
                    No {activeTab} appointments
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-500 mb-8 max-w-md mx-auto"
                  >
                    {activeTab === 'upcoming'
                      ? "You don't have any upcoming consultations. Book your first appointment with a top specialist today."
                      : activeTab === 'past'
                      ? 'Your completed appointments will appear here once you have consultations.'
                      : 'Cancelled appointments will be shown in this section.'}
                  </motion.p>
                  {activeTab === 'upcoming' && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        resetBookingFlow();
                        setShowBookingFlow(true);
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500 text-white rounded-2xl font-semibold shadow-lg inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Book Appointment
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  {activeTab !== 'cancelled' && (
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-teal-300 rounded-full hidden md:block" />
                  )}
                  <div className="space-y-5">
                    {filteredAppointments.map((apt, i) => {
                      const doctor = doctors.find((d) => d.id === apt.doctorId);
                      return (
                        <motion.div
                          key={apt.id}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ y: -4 }}
                          className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-lg border border-white/60 hover:shadow-2xl transition-shadow"
                        >
                          <div className="absolute -left-2 top-8 w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg hidden md:block border-4 border-white" />

                          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
                            <div className="relative shrink-0">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-teal-400 flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-lg">
                                {getInitials(apt.doctorName)}
                              </div>
                              {activeTab === 'upcoming' && (
                                <motion.div
                                  animate={{ scale: [1, 1.15, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white"
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                <div>
                                  <h3 className="font-bold text-gray-800 text-lg">
                                    {apt.doctorName}
                                  </h3>
                                  <p className="text-purple-600 text-sm font-medium">
                                    {apt.specialty}
                                  </p>
                                  <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                                    <Stethoscope className="w-3 h-3" />
                                    {apt.hospital}
                                  </p>
                                </div>
                                <StatusBadge status={apt.status} />
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-gray-600 text-sm bg-purple-50/50 px-3 py-2 rounded-xl">
                                  <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                                  <span className="truncate">{formatDateDisplay(apt.date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 text-sm bg-pink-50/50 px-3 py-2 rounded-xl">
                                  <Clock className="w-4 h-4 text-pink-500 shrink-0" />
                                  <span>{apt.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 text-sm bg-teal-50/50 px-3 py-2 rounded-xl">
                                  <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
                                  <span className="truncate">{apt.hospital}</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm bg-emerald-50/60 px-3 py-2 rounded-xl">
                                  <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>₹{(apt.fees || doctor?.fees || 1700).toLocaleString('en-IN')}</span>
                                </div>
                              </div>

                              {apt.notes && apt.status === 'upcoming' && (
                                <div className="mb-4 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100/60">
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-600">{apt.notes}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {activeTab === 'upcoming' && doctor && (
                                  <>
                                    <motion.a
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      href={doctor.videoLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 min-w-[120px] py-2.5 px-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                      <Video className="w-4 h-4" />
                                      Join Video
                                    </motion.a>
                                    <motion.a
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      href={`tel:${doctor.phone}`}
                                      className="py-2.5 px-4 border-2 border-blue-200 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 flex items-center justify-center gap-2"
                                    >
                                      <Phone className="w-4 h-4" />
                                      <span className="hidden sm:inline">Call</span>
                                    </motion.a>
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => handleReschedule(apt)}
                                      className="py-2.5 px-4 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold text-sm hover:bg-purple-50 flex items-center justify-center gap-2"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                      <span className="hidden sm:inline">Reschedule</span>
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => setShowCancelModal(apt.id)}
                                      className="py-2.5 px-4 border-2 border-red-200 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-50 flex items-center justify-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      <span className="hidden sm:inline">Cancel</span>
                                    </motion.button>
                                  </>
                                )}
                                {activeTab === 'past' && (
                                  <>
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => handleRebook(apt)}
                                      className="flex-1 min-w-[120px] py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                      Book Again
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      className="py-2.5 px-4 border-2 border-amber-200 text-amber-600 rounded-xl font-semibold text-sm hover:bg-amber-50 flex items-center justify-center gap-2"
                                    >
                                      <Star className="w-4 h-4" />
                                      <span className="hidden sm:inline">Review</span>
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      className="py-2.5 px-4 border-2 border-teal-200 text-teal-600 rounded-xl font-semibold text-sm hover:bg-teal-50 flex items-center justify-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span className="hidden sm:inline">Rx</span>
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => navigate(`/doctor-chat/${apt.doctorId}`)}
                                      className="py-2.5 px-4 border-2 border-purple-200 text-purple-600 rounded-xl font-semibold text-sm hover:bg-purple-50 flex items-center justify-center gap-2"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      <span className="hidden sm:inline">Chat</span>
                                    </motion.button>
                                  </>
                                )}
                                {activeTab === 'cancelled' && (
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleRebook(apt)}
                                    className="flex-1 min-w-[120px] py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Book Again
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/60"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Overview
                </h3>
              </div>
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setMiniCalendarMonth(
                      new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() - 1)
                    )
                  }
                  className="p-1.5 rounded-xl hover:bg-purple-50 text-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <h4 className="font-semibold text-sm text-gray-700">
                  {miniCalendarMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </h4>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setMiniCalendarMonth(
                      new Date(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth() + 1)
                    )
                  }
                  className="p-1.5 rounded-xl hover:bg-purple-50 text-gray-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {miniCalendarDays.map((dateStr, i) => {
                  if (!dateStr) return <div key={`empty-${i}`} />;
                  const d = new Date(dateStr);
                  const hasAppointment = appointmentDates.has(dateStr);
                  const isToday = d.getTime() === today.getTime();
                  return (
                    <div
                      key={dateStr}
                      className={`relative aspect-square flex items-center justify-center text-xs rounded-lg transition-all ${
                        isToday
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-md'
                          : hasAppointment
                          ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {d.getDate()}
                      {hasAppointment && !isToday && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="text-gray-500">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200" />
                  <span className="text-gray-500">Appointment</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/60"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-pink-500" />
                  Reminders
                </h3>
                <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-semibold">
                  {upcomingReminders.length}
                </span>
              </div>
              {upcomingReminders.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-sm text-gray-500">No appointment reminders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingReminders.map((reminder, i) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-gradient-to-r from-pink-50/80 to-purple-50/80 rounded-2xl border border-pink-100/60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0 shadow">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {reminder.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{reminder.time}</span>
                          {reminder.date && (
                            <>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{formatDateDisplay(reminder.date)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-teal-500 rounded-3xl p-6 shadow-2xl text-white"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold">Quick Stats</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center bg-white/15 backdrop-blur rounded-2xl p-3">
                    <div className="text-2xl font-bold">
                      {appointments.filter((a) => a.status === 'upcoming').length}
                    </div>
                    <div className="text-xs opacity-90 mt-1">Upcoming</div>
                  </div>
                  <div className="text-center bg-white/15 backdrop-blur rounded-2xl p-3">
                    <div className="text-2xl font-bold">
                      {appointments.filter((a) => a.status === 'completed').length}
                    </div>
                    <div className="text-xs opacity-90 mt-1">Completed</div>
                  </div>
                  <div className="text-center bg-white/15 backdrop-blur rounded-2xl p-3">
                    <div className="text-2xl font-bold">
                      {doctors.length}
                    </div>
                    <div className="text-xs opacity-90 mt-1">Doctors</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBookingFlow && (
          <BookingDrawer
            doctors={filteredDoctors}
            allDoctors={doctors}
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            isVideoConsultation={isVideoConsultation}
            setIsVideoConsultation={setIsVideoConsultation}
            bookingNotes={bookingNotes}
            setBookingNotes={setBookingNotes}
            doctorSearch={doctorSearch}
            setDoctorSearch={setDoctorSearch}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            bookingDays={bookingDays}
            today={today}
            availableTimeSlots={availableTimeSlots}
            appointmentDates={appointmentDates}
            onClose={() => {
              setShowBookingFlow(false);
              resetBookingFlow();
            }}
            onConfirm={handleConfirmBooking}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCancelModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                Cancel Appointment?
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCancelModal(null)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50"
                >
                  Keep It
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCancelAppointment(showCancelModal)}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-2xl font-semibold shadow-lg"
                >
                  Yes, Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 300 }}
                className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                >
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" strokeWidth={2.5} />
                </motion.div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-2"
              >
                Appointment Booked!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500"
              >
                Your consultation has been scheduled successfully.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex justify-center gap-1.5"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.2,
                      repeat: Infinity
                    }}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const config = {
    upcoming: {
      bg: 'from-blue-100 to-indigo-100',
      text: 'text-blue-700',
      dot: 'from-blue-500 to-indigo-500',
      pulse: true
    },
    completed: {
      bg: 'from-green-100 to-emerald-100',
      text: 'text-green-700',
      dot: 'from-green-500 to-emerald-500',
      pulse: false
    },
    cancelled: {
      bg: 'from-red-100 to-rose-100',
      text: 'text-red-600',
      dot: 'from-red-500 to-rose-500',
      pulse: false
    }
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.bg} ${config.text} text-xs font-semibold shadow-sm`}
    >
      <span className="relative">
        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.dot} block`} />
        {config.pulse && (
          <motion.span
            animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 w-2 h-2 rounded-full bg-gradient-to-r ${config.dot} block`}
          />
        )}
      </span>
      <span className="capitalize">{status}</span>
    </span>
  );
}

interface BookingDrawerProps {
  doctors: Doctor[];
  allDoctors: Doctor[];
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (d: Doctor | null) => void;
  selectedDate: string;
  setSelectedDate: (s: string) => void;
  selectedTime: string;
  setSelectedTime: (s: string) => void;
  isVideoConsultation: boolean;
  setIsVideoConsultation: (b: boolean) => void;
  bookingNotes: string;
  setBookingNotes: (s: string) => void;
  doctorSearch: string;
  setDoctorSearch: (s: string) => void;
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  bookingDays: (string | null)[];
  today: Date;
  availableTimeSlots: { time: string; available: boolean }[];
  appointmentDates: Set<string>;
  onClose: () => void;
  onConfirm: () => void;
}

function BookingDrawer(props: BookingDrawerProps) {
  const {
    doctors,
    allDoctors,
    selectedDoctor,
    setSelectedDoctor,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    isVideoConsultation,
    setIsVideoConsultation,
    bookingNotes,
    setBookingNotes,
    doctorSearch,
    setDoctorSearch,
    calendarMonth,
    setCalendarMonth,
    bookingDays,
    today,
    availableTimeSlots,
    appointmentDates,
    onClose,
    onConfirm
  } = props;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const canConfirm = selectedDoctor && selectedDate && selectedTime;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="relative w-full md:max-w-2xl max-h-[92vh] md:h-auto md:max-h-[90vh] bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500" />
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              Book Appointment
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Schedule your consultation</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              Select Doctor
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search doctors by name or specialty..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all"
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDoctor ? 'selected' : 'list'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 max-h-60 overflow-y-auto pr-1"
              >
                {selectedDoctor ? (
                  <motion.div
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="relative p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-teal-50 border-2 border-purple-300 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                        {getInitials(selectedDoctor.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800">{selectedDoctor.name}</h4>
                        <p className="text-sm text-purple-600 font-medium">{selectedDoctor.specialty}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {selectedDoctor.rating}
                          </span>
                          <span>•</span>
                          <span>{selectedDoctor.experience} yrs exp</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedDoctor(null)}
                        className="p-2 rounded-xl bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <div className="text-3xl mb-2">🔍</div>
                    No doctors found
                  </div>
                ) : (
                  doctors.map((doc, i) => (
                    <motion.button
                      key={doc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedDoctor(doc)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all flex items-center gap-3"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {getInitials(doc.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm">{doc.name}</h4>
                        <p className="text-xs text-purple-600 font-medium">{doc.specialty}</p>
                        <p className="text-xs text-gray-400 truncate">{doc.hospital}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90 shrink-0" />
                    </motion.button>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {selectedDoctor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 overflow-hidden"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-500" />
                    Pick a Date
                  </label>
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 rounded-2xl p-4 border border-purple-100/60">
                    <div className="flex items-center justify-between mb-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
                        }
                        className="p-2 rounded-xl bg-white text-gray-600 hover:text-purple-600 shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.button>
                      <h4 className="font-bold text-gray-800">
                        {calendarMonth.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </h4>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
                        }
                        className="p-2 rounded-xl bg-white text-gray-600 hover:text-purple-600 shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {bookingDays.map((dateStr, i) => {
                        if (!dateStr) return <div key={`bd-empty-${i}`} />;
                        const d = new Date(dateStr);
                        const isPast = d < today;
                        const isSelected = selectedDate === dateStr;
                        const hasAppointment = appointmentDates.has(dateStr);
                        const isToday = d.getTime() === today.getTime();
                        return (
                          <motion.button
                            key={dateStr}
                            whileHover={!isPast ? { scale: 1.1 } : {}}
                            whileTap={!isPast ? { scale: 0.95 } : {}}
                            disabled={isPast}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`relative aspect-square flex items-center justify-center text-sm rounded-xl transition-all font-medium ${
                              isPast
                                ? 'text-gray-300 cursor-not-allowed'
                                : isSelected
                                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-teal-500 text-white shadow-lg font-bold'
                                : isToday
                                ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300'
                                : hasAppointment
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            {d.getDate()}
                            {isSelected && (
                              <motion.div
                                layoutId="selectedDateDot"
                                className="absolute inset-0 rounded-xl ring-2 ring-white/50"
                              />
                            )}
                            {hasAppointment && !isSelected && !isPast && (
                              <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-500" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-500" />
                        Select Time Slot
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {availableTimeSlots.map((slot, i) => (
                          <motion.button
                            key={slot.time}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={slot.available ? { scale: 1.04 } : {}}
                            whileTap={slot.available ? { scale: 0.96 } : {}}
                            disabled={!slot.available}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            className={`relative py-3 px-2 rounded-xl font-semibold text-sm transition-all ${
                              selectedTime === slot.time
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                                : slot.available
                                ? 'bg-white border-2 border-gray-100 text-gray-700 hover:border-purple-300 hover:bg-purple-50/60'
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                            }`}
                          >
                            {slot.time}
                            {!slot.available && (
                              <div className="absolute top-1 right-1">
                                <XCircle className="w-3 h-3 text-gray-300" />
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4 text-indigo-500" />
                        Consultation Type
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-2xl">
                        <motion.button
                          whileHover={{ scale: isVideoConsultation ? 1 : 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsVideoConsultation(true)}
                          className={`relative py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            isVideoConsultation
                              ? 'bg-white text-purple-600 shadow-md'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          Video Call
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: !isVideoConsultation ? 1 : 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsVideoConsultation(false)}
                          className={`relative py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            !isVideoConsultation
                              ? 'bg-white text-teal-600 shadow-md'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                          In-Person
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" />
                        Add Notes (Optional)
                      </label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        rows={3}
                        placeholder="Describe your symptoms or concerns before the consultation..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm resize-none transition-all placeholder-gray-400"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedTime && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-teal-50 border border-purple-100/60"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Consultation Fee</span>
                      <span className="font-bold text-lg bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                        ₹{(selectedDoctor?.fees || 1700).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-white transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={canConfirm ? { scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.35)' } : {}}
              whileTap={canConfirm ? { scale: 0.98 } : {}}
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`flex-[2] py-3.5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                canConfirm
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirm Booking
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
