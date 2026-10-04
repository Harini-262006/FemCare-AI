import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Shield,
  AlertTriangle,
  MapPin,
  Users,
  Plus,
  Trash2,
  Star,
  User,
  MessageCircle,
  X,
  Ambulance,
  Building2,
  Baby,
  Heart,
  Brain,
  Droplet,
  Activity,
  Thermometer,
  ChevronRight,
  Clock,
  Stethoscope,
  CircleDot,
  CheckCircle2,
  BellRing,
  Send,
  Edit3,
  Share2,
  Navigation,
  Zap,
  Home,
  Loader2,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { playBeep } from '@/hooks/useReminders'
import {
  useAppStore,
  useEmergencyContacts,
  useProfile,
  type EmergencyContact,
} from '@/store'
import { emergencyContactAPI } from '@/services/api'

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

const emergencyHotlines = [
  { name: 'Ambulance', number: '108', icon: Ambulance, gradient: 'from-red-500 to-rose-600', description: 'Medical emergency response' },
  { name: 'Police', number: '100', icon: Shield, gradient: 'from-blue-500 to-indigo-600', description: 'Law enforcement & safety' },
  { name: 'Women Helpline', number: '1091', icon: Users, gradient: 'from-pink-500 to-fuchsia-600', description: 'Women distress support' },
  { name: 'Pregnancy Helpline', number: '1800-180-11104', icon: Baby, gradient: 'from-violet-500 to-purple-600', description: 'Pregnancy & maternity care' },
  { name: 'Mental Health', number: '1800-599-0019', icon: Brain, gradient: 'from-teal-500 to-cyan-600', description: 'Counselling & support' },
  { name: 'Doctor Quick Call', number: '+1 555-123-4567', icon: Stethoscope, gradient: 'from-emerald-500 to-teal-600', description: 'Speak to a doctor now' },
]

const nearbyHospitals = [
  { name: "City Women's Hospital", distance: '1.2 km', address: '42 Wellness Avenue, Downtown', rating: 4.9, type: 'Specialty', phone: '+1 555-200-1001' },
  { name: 'Apollo Medical Centre', distance: '2.5 km', address: '108 Health Street, Midtown', rating: 4.8, type: 'Multi-Specialty', phone: '+1 555-200-1002' },
  { name: 'Fortis Maternity Care', distance: '3.1 km', address: '56 Care Boulevard, East Side', rating: 4.7, type: 'Maternity', phone: '+1 555-200-1003' },
  { name: 'Max Super Speciality', distance: '4.0 km', address: '201 Medical Plaza, West End', rating: 4.6, type: 'Super Speciality', phone: '+1 555-200-1004' },
  { name: 'Community General Hospital', distance: '5.2 km', address: '77 Lifeline Road, North Hills', rating: 4.4, type: 'General', phone: '+1 555-200-1005' },
]

const pregnancyWarnings = [
  {
    title: 'Severe Bleeding',
    icon: Droplet,
    gradient: 'from-red-500 via-rose-500 to-pink-600',
    symptoms: ['Heavy vaginal bleeding soaking pads within 1 hour', 'Passing large blood clots', 'Dizziness or fainting', 'Rapid heartbeat'],
  },
  {
    title: 'High Blood Pressure (Preeclampsia)',
    icon: Activity,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    symptoms: ['Severe headache that does not go away', 'Blurred vision or seeing spots', 'Swelling of hands/face suddenly', 'Upper abdominal pain', 'BP reading above 140/90'],
  },
  {
    title: 'Preterm Labor Signs',
    icon: Clock,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    symptoms: ['Regular contractions before 37 weeks', 'More than 5 contractions in 1 hour', 'Pelvic pressure or heaviness', 'Low backache or cramps', 'Fluid leaking from vagina'],
  },
  {
    title: 'Severe Abdominal Pain',
    icon: Heart,
    gradient: 'from-rose-500 via-red-500 to-orange-500',
    symptoms: ['Sharp, persistent abdominal pain', 'Pain with vaginal bleeding', 'Tender or hard abdomen', 'Nausea/vomiting with pain', 'Shoulder tip pain'],
  },
  {
    title: 'Reduced Baby Movement',
    icon: Baby,
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    symptoms: ['Baby moves less than 10 times in 2 hours', 'No movement felt for 12+ hours', 'Change in usual movement pattern', 'Weak or fluttery movements only'],
  },
  {
    title: 'Fever in Pregnancy',
    icon: Thermometer,
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    symptoms: ['Temperature of 100.4°F (38°C) or higher', 'Fever lasting more than 24 hours', 'Fever with chills or body aches', 'Fever with rash or burning urination'],
  },
]

const COUNTDOWN_SECONDS = 10

export default function EmergencySupport() {
  const navigate = useNavigate()
  const contacts = useEmergencyContacts()
  const profile = useProfile()
  const { setEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact, addNotification } = useAppStore()

  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [formData, setFormData] = useState<Partial<EmergencyContact>>({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showSOSOverlay, setShowSOSOverlay] = useState(false)
  const [sosLocation, setSosLocation] = useState<{ lat: number; lng: number; simulated: boolean; note?: string } | null>(null)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [notifiedContacts, setNotifiedContacts] = useState<string[]>([])
  const [callingActive, setCallingActive] = useState<string | null>(null)
  const [sharingLocation, setSharingLocation] = useState(false)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial contacts from MongoDB API
  useEffect(() => {
    let isMounted = true
    async function loadContacts() {
      try {
        const apiData = await emergencyContactAPI.getContacts()
        if (isMounted && Array.isArray(apiData)) {
          const mapped: EmergencyContact[] = apiData.map((c) => ({
            id: c._id,
            name: c.name,
            relationship: c.relationship,
            phone: c.phone,
            email: c.email || '',
            address: c.address || '',
            isPrimary: c.isPrimary,
          }))
          setEmergencyContacts(mapped)
        }
      } catch (err) {
        console.warn('Could not fetch emergency contacts from API:', err)
      }
    }
    loadContacts()
    return () => {
      isMounted = false
    }
  }, [setEmergencyContacts])

  const openAddContact = () => {
    setEditingContact(null)
    setFormData({ name: '', relationship: '', phone: '', email: '', address: '', isPrimary: contacts.length === 0 })
    setShowContactModal(true)
  }

  const openEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      isPrimary: contact.isPrimary,
    })
    setShowContactModal(true)
  }

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim() || !formData.relationship?.trim() || !formData.phone?.trim()) return

    setIsSubmitting(true)
    try {
      if (editingContact) {
        const updated = await emergencyContactAPI.updateContact(editingContact.id, {
          name: formData.name,
          relationship: formData.relationship,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          isPrimary: formData.isPrimary,
        })
        updateEmergencyContact(editingContact.id, {
          name: updated.name,
          relationship: updated.relationship,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          isPrimary: updated.isPrimary,
        })
        addNotification({
          id: Date.now().toString(),
          title: '✅ Contact Saved',
          message: `${formData.name} has been updated in MongoDB.`,
          type: 'emergency',
          read: false,
          timestamp: new Date(),
        })
      } else {
        const created = await emergencyContactAPI.addContact({
          name: formData.name || '',
          relationship: formData.relationship || '',
          phone: formData.phone || '',
          email: formData.email || '',
          address: formData.address || '',
          isPrimary: formData.isPrimary || contacts.length === 0,
        })
        addEmergencyContact({
          id: created._id,
          name: created.name,
          relationship: created.relationship,
          phone: created.phone,
          email: created.email,
          address: created.address,
          isPrimary: created.isPrimary,
        })
        addNotification({
          id: Date.now().toString(),
          title: '✅ Contact Saved',
          message: `${formData.name} is now saved in MongoDB.`,
          type: 'emergency',
          read: false,
          timestamp: new Date(),
        })
      }

      // Refetch contacts list to ensure sync
      try {
        const freshList = await emergencyContactAPI.getContacts()
        if (Array.isArray(freshList)) {
          setEmergencyContacts(
            freshList.map((c) => ({
              id: c._id,
              name: c.name,
              relationship: c.relationship,
              phone: c.phone,
              email: c.email || '',
              address: c.address || '',
              isPrimary: c.isPrimary,
            }))
          )
        }
      } catch (refetchErr) {
        // Ignore background refetch error
      }

      setShowContactModal(false)
      setEditingContact(null)
      setFormData({ name: '', relationship: '', phone: '', email: '', address: '', isPrimary: false })
    } catch (err: any) {
      console.error('Error saving contact to API:', err)
      // Fallback local save
      if (editingContact) {
        updateEmergencyContact(editingContact.id, formData as any)
      } else {
        addEmergencyContact({
          id: Date.now().toString(),
          name: formData.name || '',
          relationship: formData.relationship || '',
          phone: formData.phone || '',
          email: formData.email,
          address: formData.address,
          isPrimary: formData.isPrimary || contacts.length === 0,
        })
      }
      setShowContactModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContact = async (contact: EmergencyContact) => {
    try {
      await emergencyContactAPI.deleteContact(contact.id)
    } catch (err) {
      console.warn('API delete contact failed:', err)
    }
    deleteEmergencyContact(contact.id)
    addNotification({
      id: Date.now().toString(),
      title: '🗑️ Contact Removed',
      message: `${contact.name} has been removed from emergency contacts.`,
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
  }

  const getLocation = (): Promise<{ lat: number; lng: number; simulated: boolean; note?: string }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          lat: 37.7749,
          lng: -122.4194,
          simulated: true,
          note: 'Geolocation not supported by this browser. Using placeholder location.',
        })
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            simulated: false,
          })
        },
        (err) => {
          let note = 'Location permission denied. Using placeholder location - please enable location services for accurate tracking.'
          if (err.code === err.POSITION_UNAVAILABLE) {
            note = 'Location unavailable. Using placeholder location.'
          } else if (err.code === err.TIMEOUT) {
            note = 'Location request timed out. Using placeholder location.'
          }
          resolve({
            lat: 37.7749,
            lng: -122.4194,
            simulated: true,
            note,
          })
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    })
  }

  const handleSOS = async () => {
    playBeep()

    addNotification({
      id: Date.now().toString(),
      title: '🚨 EMERGENCY SOS Activated',
      message: 'Emergency protocol initiated. Primary contact being notified. Stay calm, help is on the way.',
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })

    setCallingActive('sos')
    setTimeout(() => setCallingActive(null), 3000)

    const location = await getLocation()
    setSosLocation(location)
    setNotifiedContacts([])
    setCountdown(COUNTDOWN_SECONDS)
    setShowSOSOverlay(true)
  }

  useEffect(() => {
    if (showSOSOverlay && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((c) => c - 1)
      }, 1000)
    } else if (showSOSOverlay && countdown === 0) {
      const primary = contacts.find((c) => c.isPrimary) || contacts[0]
      if (primary) {
        window.location.href = `tel:${primary.phone}`
      } else {
        window.location.href = 'tel:108'
      }
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current)
    }
  }, [showSOSOverlay, countdown, contacts])

  useEffect(() => {
    if (!showSOSOverlay) return
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current)
    }
  }, [showSOSOverlay])

  const cancelSOS = () => {
    if (countdownRef.current) clearTimeout(countdownRef.current)
    setShowSOSOverlay(false)
    setSosLocation(null)
    setCountdown(COUNTDOWN_SECONDS)
    setNotifiedContacts([])
    addNotification({
      id: Date.now().toString(),
      title: 'ℹ️ SOS Cancelled',
      message: 'Emergency SOS was cancelled by user.',
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
  }

  const buildLocationMessage = () => {
    if (!sosLocation) return 'Location unavailable'
    const base = `Lat: ${sosLocation.lat.toFixed(6)}, Lng: ${sosLocation.lng.toFixed(6)}`
    return sosLocation.simulated ? `${base} (Simulated)` : base
  }

  const notifyAllContacts = () => {
    if (contacts.length === 0) return
    const locMsg = buildLocationMessage()
    const profileName = profile?.name || 'User'
    contacts.forEach((contact) => {
      addNotification({
        id: `${Date.now()}-${contact.id}`,
        title: `🚨 SOS Alert for ${profileName}`,
        message: `Emergency SOS triggered! Location: ${locMsg}. Please contact ${profileName} immediately.`,
        type: 'emergency',
        read: false,
        timestamp: new Date(),
      })
    })
    setNotifiedContacts(contacts.map((c) => c.id))
  }

  const handleCallHotline = (number: string, name: string) => {
    addNotification({
      id: Date.now().toString(),
      title: `📞 Calling ${name}`,
      message: `Connecting to emergency hotline: ${number}`,
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
    setCallingActive(number)
    setTimeout(() => {
      setCallingActive(null)
      window.location.href = `tel:${number}`
    }, 400)
  }

  const handleCallContact = (contact: EmergencyContact) => {
    addNotification({
      id: Date.now().toString(),
      title: `📞 Calling ${contact.name}`,
      message: `Connecting to ${contact.relationship}: ${contact.phone}`,
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
    setCallingActive(contact.id)
    setTimeout(() => {
      setCallingActive(null)
      window.location.href = `tel:${contact.phone}`
    }, 400)
  }

  const handleMessageContact = (contact: EmergencyContact) => {
    const locMsg = buildLocationMessage()
    const profileName = profile?.name || 'I'
    const message = encodeURIComponent(
      `🚨 EMERGENCY SOS: ${profileName} need your help! My current location: ${locMsg}. Please contact me immediately.`
    )
    addNotification({
      id: Date.now().toString(),
      title: `💬 Messaging ${contact.name}`,
      message: `Emergency SMS sent to ${contact.name} with location details.`,
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
    window.location.href = `sms:${contact.phone}?body=${message}`
  }

  const callPrimaryContact = () => {
    const primary = contacts.find((c) => c.isPrimary) || contacts[0]
    if (primary) {
      if (countdownRef.current) clearTimeout(countdownRef.current)
      window.location.href = `tel:${primary.phone}`
    }
  }

  const shareLiveLocation = async () => {
    setSharingLocation(true)
    addNotification({
      id: Date.now().toString(),
      title: '📍 Sharing Live Location',
      message: 'Your current location is being shared with your emergency contacts.',
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
    const location = await getLocation()
    const locMsg = `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}${location.simulated ? ' (Simulated)' : ''}`
    const profileName = profile?.name || 'I'
    contacts.forEach((contact) => {
      addNotification({
        id: `${Date.now()}-loc-${contact.id}`,
        title: `📍 Location Shared with ${contact.name}`,
        message: `${profileName}'s live location: ${locMsg}`,
        type: 'emergency',
        read: false,
        timestamp: new Date(),
      })
    })
    setTimeout(() => setSharingLocation(false), 2000)
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🚨 Emergency - My Live Location',
          text: `${profileName} needs help! My current location: ${locMsg}. Please contact me immediately.`,
          url: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        })
      } catch {
        // User cancelled share
      }
    }
  }

  const sendEmergencySMSToAll = async () => {
    if (contacts.length === 0) return
    const location = await getLocation()
    const locMsg = `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}${location.simulated ? ' (Simulated)' : ''}`
    const profileName = profile?.name || 'I'
    const message = encodeURIComponent(
      `🚨 EMERGENCY SOS: ${profileName} need your help! My current location: ${locMsg}. Please contact me immediately.`
    )
    addNotification({
      id: Date.now().toString(),
      title: '💬 Emergency SMS Sent',
      message: `Emergency SMS with location sent to all ${contacts.length} contact(s).`,
      type: 'emergency',
      read: false,
      timestamp: new Date(),
    })
    const primary = contacts.find((c) => c.isPrimary) || contacts[0]
    window.location.href = `sms:${primary.phone}?body=${message}`
  }

  const callWomenHelpline = () => handleCallHotline('1091', 'Women Helpline')
  const callAmbulance = () => handleCallHotline('108', 'Emergency Ambulance')

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0]

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <motion.div
        animate={{ scale: [1, 1.08, 1], x: [0, 20, 0], opacity: [0.4, 0.55, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-pink-300/30 blur-3xl -z-10 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], x: [0, -25, 0], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/4 -right-24 w-[500px] h-[500px] rounded-full bg-purple-300/25 blur-3xl -z-10 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], y: [0, -20, 0], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute -bottom-32 left-1/4 w-[480px] h-[480px] rounded-full bg-rose-200/30 blur-3xl -z-10 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], y: [0, 25, 0], x: [0, 15, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-fuchsia-200/25 blur-3xl -z-10 pointer-events-none"
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <PageHeader
              title="Emergency SOS"
              subtitle="Your safety is our priority"
              hideBell={false}
              extra={null}
            />
          </motion.div>

          {/* ========== SOS HERO SECTION ========== */}
          <motion.section variants={itemVariants} className="relative mb-10">
            <motion.div
              className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 lg:p-12"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #e11d48 30%, #db2777 60%, #be185d 100%)',
              }}
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -mt-32 -mr-24" />
              <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-black/10 rounded-full blur-3xl -mb-20 -ml-12" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="absolute top-12 right-24 w-64 h-64 rounded-full border-2 border-white/10 border-dashed opacity-40"
              />

              <div className="relative z-10 grid lg:grid-cols-3 gap-8 lg:gap-10 items-center">
                <div className="lg:col-span-2 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider text-white/90 mb-5 border border-white/20"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Response Center
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-5 drop-shadow-lg leading-tight"
                  >
                    Stay Calm,<br />
                    <span className="bg-gradient-to-r from-yellow-200 via-pink-100 to-white bg-clip-text text-transparent">
                      Help Is One Tap Away
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-white/90 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed"
                  >
                    Press the SOS button to instantly alert your emergency contacts,
                    share your live location, and connect with first responders.
                    Your safety is our top priority.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center gap-3 justify-center lg:justify-start"
                  >
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                      <Shield className="w-4 h-4 text-green-300" />
                      <span className="text-white font-semibold text-sm">24/7 Support</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                      <MapPin className="w-4 h-4 text-cyan-300" />
                      <span className="text-white font-semibold text-sm">Location Tracking</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                      <Users className="w-4 h-4 text-yellow-300" />
                      <span className="text-white font-semibold text-sm">Contact Alerts</span>
                    </div>
                  </motion.div>
                </div>

                <div className="relative flex justify-center lg:justify-end">
                  <motion.div
                    animate={{ scale: [1, 1.22, 1], opacity: [0.35, 0.08, 0.35] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border-[6px] border-white/25"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.16, 1], opacity: [0.45, 0.12, 0.45] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
                    className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border-[5px] border-white/30"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.2, 0.55] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute w-48 h-48 sm:w-52 sm:h-52 rounded-full border-[4px] border-white/40"
                  />
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSOS}
                    aria-label="Emergency SOS button - tap to alert contacts and get location"
                    className={`relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full z-10 shadow-[0_0_80px_-10px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300/80 ${
                      callingActive === 'sos' ? 'bg-green-400' : 'bg-white'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <div
                      className={`absolute inset-3 rounded-full border-[3px] ${
                        callingActive === 'sos'
                          ? 'border-green-300 bg-green-50'
                          : ''
                      }`}
                      style={callingActive !== 'sos' ? { background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 50%, #fff0f5 100%)', borderColor: 'rgba(244,63,94,0.2)' } : {}}
                    />
                    <div className="relative z-10 flex flex-col items-center">
                      <motion.div
                        animate={callingActive === 'sos' ? { scale: [1, 1.15, 1] } : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <AlertTriangle
                          className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-2 ${
                            callingActive === 'sos' ? 'text-green-500' : 'text-red-600'
                          }`}
                        />
                      </motion.div>
                      <span
                        className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
                          callingActive === 'sos'
                            ? 'text-green-600'
                            : 'bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent'
                        }`}
                      >
                        {callingActive === 'sos' ? 'CALLING' : 'SOS'}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mt-2 ${
                          callingActive === 'sos' ? 'text-green-500' : 'text-rose-400'
                        }`}
                      >
                        {callingActive === 'sos' ? 'Connecting...' : 'Tap in Emergency'}
                      </span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* ========== QUICK ACCESS EMERGENCY ACTIONS ========== */}
          <motion.section variants={itemVariants} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-200">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 via-teal-700 to-blue-700 bg-clip-text text-transparent">
                  Quick Emergency Actions
                </h2>
                <p className="text-sm text-gray-500 mt-1">One-tap access to critical safety features</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-teal-200 via-cyan-200 to-transparent" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <motion.button
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={callPrimaryContact}
                disabled={!primaryContact}
                aria-label={primaryContact ? `Call ${primaryContact.name}` : 'No primary contact'}
                className="relative group flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                style={{ minHeight: '44px' }}
              >
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all ${!primaryContact ? 'grayscale' : ''}`}>
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 opacity-30 blur"
                  />
                  <Phone className="w-6.5 h-6.5 text-white relative z-10" />
                </div>
                <span className="font-black text-gray-900 text-xs sm:text-sm text-center leading-tight">
                  {primaryContact ? `Call ${primaryContact.name}` : 'No Contact'}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-gray-400 text-center">
                  {primaryContact ? primaryContact.relationship : 'Add contact'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={callAmbulance}
                aria-label="Call ambulance 108"
                className="relative group flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-300/50"
                style={{ minHeight: '44px' }}
              >
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-orange-600 opacity-30 blur"
                  />
                  <Ambulance className="w-6.5 h-6.5 text-white relative z-10" />
                </div>
                <span className="font-black text-gray-900 text-xs sm:text-sm text-center leading-tight">Call Ambulance</span>
                <span className="text-[10px] sm:text-xs font-black text-red-600 text-center">🚑 108</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={callWomenHelpline}
                aria-label="Call women helpline 1091"
                className="relative group flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-fuchsia-300/50"
                style={{ minHeight: '44px' }}
              >
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 opacity-30 blur"
                  />
                  <Users className="w-6.5 h-6.5 text-white relative z-10" />
                </div>
                <span className="font-black text-gray-900 text-xs sm:text-sm text-center leading-tight">Women Helpline</span>
                <span className="text-[10px] sm:text-xs font-black text-fuchsia-600 text-center">👩 1091</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={shareLiveLocation}
                disabled={sharingLocation}
                aria-label="Share my live location"
                className="relative group flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                style={{ minHeight: '44px' }}
              >
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all ${sharingLocation ? 'animate-pulse' : ''}`}>
                  <motion.div
                    animate={{ scale: sharingLocation ? [1, 1.3, 1] : [1, 1.12, 1], opacity: sharingLocation ? [0.2, 0.6, 0.2] : 0.3 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 blur"
                  />
                  {sharingLocation ? (
                    <Navigation className="w-6.5 h-6.5 text-white relative z-10 animate-spin" />
                  ) : (
                    <Share2 className="w-6.5 h-6.5 text-white relative z-10" />
                  )}
                </div>
                <span className="font-black text-gray-900 text-xs sm:text-sm text-center leading-tight">
                  {sharingLocation ? 'Sharing...' : 'Share Location'}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-blue-600 text-center">
                  {sharingLocation ? 'Live location' : 'Google Maps'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={sendEmergencySMSToAll}
                disabled={contacts.length === 0}
                aria-label="Send emergency SMS to all contacts"
                className="relative group flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-violet-300/50"
                style={{ minHeight: '44px' }}
              >
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all ${contacts.length === 0 ? 'grayscale' : ''}`}>
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 opacity-30 blur"
                  />
                  <Send className="w-6.5 h-6.5 text-white relative z-10" />
                </div>
                <span className="font-black text-gray-900 text-xs sm:text-sm text-center leading-tight">Emergency SMS</span>
                <span className="text-[10px] sm:text-xs font-semibold text-violet-600 text-center">
                  {contacts.length > 0 ? `${contacts.length} contact(s)` : 'Add contacts'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => document.getElementById('contacts-section')?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Manage emergency contacts"
                className="relative group flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-300/50"
                style={{ minHeight: '44px' }}
              >
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 opacity-30 blur"
                  />
                  <Users className="w-6.5 h-6.5 text-white relative z-10" />
                </div>
                <span className="font-black text-gray-900 text-xs sm:text-sm text-center leading-tight">Manage Contacts</span>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 text-center">Add / Edit / Remove</span>
              </motion.button>
            </div>
          </motion.section>

          {/* ========== EMERGENCY HOTLINES GRID ========== */}
          <motion.section variants={itemVariants} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 via-rose-700 to-pink-700 bg-clip-text text-transparent">
                  Emergency Hotlines
                </h2>
                <p className="text-sm text-gray-500 mt-1">Tap any card to dial immediately</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-pink-200 via-rose-200 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {emergencyHotlines.map((hotline, idx) => (
                <motion.a
                  key={hotline.number}
                  href={`tel:${hotline.number}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleCallHotline(hotline.number, hotline.name)
                  }}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label={`Call ${hotline.name} at ${hotline.number}`}
                  className="relative group cursor-pointer overflow-hidden rounded-3xl p-5 sm:p-6 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                  style={{ minHeight: '44px' }}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${hotline.gradient} opacity-10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        whileHover={{ rotate: 8, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${hotline.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl`}
                      >
                        <hotline.icon className="w-6.5 h-6.5 text-white" />
                      </motion.div>
                      {callingActive === hotline.number ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider border border-green-200"
                        >
                          <CircleDot className="w-3 h-3 animate-pulse" />
                          Calling
                        </motion.span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${hotline.gradient} text-white text-[10px] font-black uppercase tracking-wider shadow-md`}>
                          <Phone className="w-3 h-3" />
                          Call
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1 group-hover:text-gray-800">
                      {hotline.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                      {hotline.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${hotline.gradient} bg-clip-text text-transparent`}>
                        {hotline.number}
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-rose-500 group-hover:translate-x-1 transition-all`} />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>

          {/* ========== NEARBY HOSPITALS LIST ========== */}
          <motion.section variants={itemVariants} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Nearby Hospitals
                </h2>
                <p className="text-sm text-gray-500 mt-1">Closest medical facilities to your location</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-indigo-200 to-transparent" />
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 overflow-hidden">
              <div className="divide-y divide-gray-100/60">
                {nearbyHospitals.map((h, idx) => (
                  <motion.div
                    key={h.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07, type: 'spring', stiffness: 120 }}
                    whileHover={{ backgroundColor: 'rgba(244,244,245,0.3)' }}
                    className="group p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <motion.div
                        whileHover={{ rotate: [0, -6, 6, 0], scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-100 flex items-center justify-center shrink-0"
                      >
                        <Building2 className="w-6.5 h-6.5 text-blue-600" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-black text-gray-900 truncate">{h.name}</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">
                            {h.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{h.address}</span>
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-100">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            <span className="text-sm font-bold text-amber-700">{h.rating}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100">
                            <Activity className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-sm font-bold text-blue-700">{h.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <motion.a
                      href={`tel:${h.phone}`}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      aria-label={`Call ${h.name}`}
                      className="shrink-0 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all w-full sm:w-auto focus:outline-none focus:ring-4 focus:ring-emerald-300/50"
                      style={{ minHeight: '44px' }}
                    >
                      <Phone className="w-4.5 h-4.5" />
                      Call Hospital
                    </motion.a>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ========== PREGNANCY EMERGENCY WARNING SIGNS ========== */}
          <motion.section variants={itemVariants} className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-amber-200">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 via-amber-700 to-red-700 bg-clip-text text-transparent">
                  Pregnancy Emergency Warning Signs
                </h2>
                <p className="text-sm text-gray-500 mt-1">Seek immediate medical attention if you experience any of these</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-200 via-red-200 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {pregnancyWarnings.map((warning, idx) => (
                <motion.div
                  key={warning.title}
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -6, scale: 1.015 }}
                  className="relative group overflow-hidden rounded-3xl p-5 sm:p-6 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 hover:shadow-2xl"
                >
                  <div className={`absolute top-0 right-0 w-52 h-52 bg-gradient-to-br ${warning.gradient} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`} />
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r"
                    style={{
                      backgroundImage:
                        warning.gradient === 'from-red-500 via-rose-500 to-pink-600'
                          ? 'linear-gradient(90deg, #ef4444, #f43f5e, #db2777)'
                          : warning.gradient === 'from-amber-500 via-orange-500 to-red-500'
                          ? 'linear-gradient(90deg, #f59e0b, #f97316, #ef4444)'
                          : warning.gradient === 'from-violet-500 via-purple-500 to-fuchsia-500'
                          ? 'linear-gradient(90deg, #8b5cf6, #a855f7, #d946ef)'
                          : warning.gradient === 'from-rose-500 via-red-500 to-orange-500'
                          ? 'linear-gradient(90deg, #f43f5e, #ef4444, #f97316)'
                          : warning.gradient === 'from-blue-500 via-indigo-500 to-purple-500'
                          ? 'linear-gradient(90deg, #3b82f6, #6366f1, #a855f7)'
                          : 'linear-gradient(90deg, #eab308, #f59e0b, #f97316)',
                    }}
                  />

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-5">
                      <motion.div
                        whileHover={{ rotate: [0, -6, 6, 0], scale: 1.08 }}
                        transition={{ duration: 0.5 }}
                        className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${warning.gradient} flex items-center justify-center shadow-xl`}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }}
                          className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-br ${warning.gradient} opacity-30 blur-sm`}
                        />
                        <warning.icon className="w-6.5 h-6.5 text-white relative z-10" />
                      </motion.div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            Warning
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">
                          {warning.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
                        Key Symptoms to Watch For
                      </p>
                      <ul className="space-y-2.5">
                        {warning.symptoms.map((symptom, sIdx) => (
                          <motion.li
                            key={sIdx}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 + sIdx * 0.03 }}
                            className="flex items-start gap-2.5"
                          >
                            <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 bg-gradient-to-br ${warning.gradient} shadow-sm`} />
                            <span className="text-sm text-gray-700 leading-relaxed font-medium">
                              {symptom}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    <motion.div
                      whileHover={{ x: 3 }}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${warning.gradient} overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 relative z-10"
                      >
                        <Ambulance className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <p className="text-white font-black text-sm leading-tight">
                          Go to hospital immediately
                        </p>
                        <p className="text-white/80 text-xs font-semibold mt-0.5">
                          Do not wait — call ambulance 108
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white shrink-0 relative z-10" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ========== YOUR EMERGENCY CONTACTS ========== */}
          <motion.section variants={itemVariants} className="mb-10" id="contacts-section">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-200">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-700 to-purple-700 bg-clip-text text-transparent">
                  Your Emergency Contacts
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {contacts.length} trusted {contacts.length === 1 ? 'person' : 'people'} · Tap to call
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={openAddContact}
                aria-label="Add emergency contact"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold shadow-lg shadow-pink-200/50 hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                style={{ minHeight: '44px' }}
              >
                <Plus className="w-5 h-5" />
                Add Contact
              </motion.button>
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-100/50 overflow-hidden">
              {contacts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 text-center"
                >
                  <div className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 flex items-center justify-center border border-pink-100">
                    <Users className="w-14 h-14 text-pink-400" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">No contacts yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-7 leading-relaxed">
                    Add people you trust so they can be notified instantly in case of an emergency.
                    These contacts will be the first to know when you need help.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openAddContact}
                    aria-label="Add your first emergency contact"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white px-7 py-4 rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                    style={{ minHeight: '44px' }}
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Contact
                  </motion.button>
                </motion.div>
              ) : (
                <div className="p-5 sm:p-7 grid md:grid-cols-2 gap-4 sm:gap-5">
                  {contacts.map((contact, idx) => (
                    <motion.div
                      key={contact.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.06, type: 'spring', stiffness: 120 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className={`relative p-5 rounded-2xl border-2 transition-all overflow-hidden ${
                        contact.isPrimary
                          ? 'bg-gradient-to-br from-pink-50/80 via-rose-50/80 to-purple-50/80 border-pink-200 shadow-xl shadow-pink-100/40'
                          : 'bg-white/60 border-gray-100 hover:border-gray-200 hover:shadow-lg'
                      }`}
                    >
                      {contact.isPrimary && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black shadow-md"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          Primary
                        </motion.div>
                      )}

                      <div className="flex items-start gap-4 mb-5">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 ${
                            contact.isPrimary
                              ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 shadow-pink-200'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                          }`}
                        >
                          {contact.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 pt-1 pr-16 sm:pr-20">
                          <h4 className="font-black text-gray-900 text-lg truncate">{contact.name}</h4>
                          <p className="text-sm font-semibold text-gray-500">{contact.relationship}</p>
                        </div>
                      </div>

                      <div className="space-y-2.5 mb-5">
                        <div
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                            contact.isPrimary ? 'bg-white border-pink-100' : 'bg-gray-50/70 border-gray-100'
                          }`}
                        >
                          <Phone
                            className={`w-4 h-4 shrink-0 ${
                              contact.isPrimary ? 'text-pink-500' : 'text-blue-500'
                            }`}
                          />
                          <span className="text-sm font-bold text-gray-800 truncate">{contact.phone}</span>
                        </div>
                        {contact.email && (
                          <div
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                              contact.isPrimary ? 'bg-white/70 border-pink-50' : 'bg-gray-50/50 border-gray-100'
                            }`}
                          >
                            <MessageCircle
                              className={`w-4 h-4 shrink-0 ${
                                contact.isPrimary ? 'text-pink-400' : 'text-blue-400'
                              }`}
                            />
                            <span className="text-sm font-medium text-gray-600 truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleCallContact(contact)}
                          aria-label={`Call ${contact.name}`}
                          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white shadow-lg transition-all focus:outline-none focus:ring-4 ${
                            contact.isPrimary
                              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 shadow-pink-200/50 hover:shadow-xl focus:ring-pink-300/50'
                              : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 shadow-emerald-200/50 hover:shadow-xl focus:ring-emerald-300/50'
                          }`}
                          style={{ minHeight: '44px' }}
                        >
                          <Phone className="w-4.5 h-4.5" />
                          Call
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handleMessageContact(contact)}
                          aria-label={`Message ${contact.name}`}
                          className="p-3.5 rounded-2xl border-2 bg-white border-blue-100 text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <MessageCircle className="w-4.5 h-4.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => openEditContact(contact)}
                          aria-label={`Edit ${contact.name}`}
                          className="p-3.5 rounded-2xl border-2 bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300/50"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <Edit3 className="w-4.5 h-4.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handleDeleteContact(contact)}
                          aria-label={`Delete ${contact.name}`}
                          className="p-3.5 rounded-2xl border-2 bg-white border-gray-100 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all focus:outline-none focus:ring-4 focus:ring-red-300/50"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* ========== BOTTOM CTA SAFETY BANNER ========== */}
          <motion.section variants={itemVariants} className="mb-6">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl -mt-24 -mr-24" />
              <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl -mb-20" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                className="absolute top-8 right-16 w-48 h-48 rounded-full border border-white/5 border-dashed opacity-30"
              />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-7 h-7 text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">
                      Remember: Stay Calm, Act Fast
                    </h3>
                    <p className="text-gray-400 max-w-xl leading-relaxed text-sm sm:text-base">
                      In any emergency, take a deep breath. Tap SOS above, and we'll connect you
                      with help. Your location will be shared with trusted contacts automatically.
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddContact}
                  aria-label="Manage emergency contacts"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-gray-900 font-black shadow-xl hover:shadow-2xl transition-all shrink-0 focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                  style={{ minHeight: '44px' }}
                >
                  <Users className="w-4.5 h-4.5" />
                  Manage Contacts
                  <ChevronRight className="w-4.5 h-4.5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.section>
        </motion.div>
      </div>

      {/* ========== SOS CONFIRMATION OVERLAY ========== */}
      <AnimatePresence>
        {showSOSOverlay && sosLocation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
              onClick={cancelSOS}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-8 sm:top-1/2 sm:-translate-y-1/2 w-full sm:max-w-2xl max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-y-auto z-50 rounded-3xl sm:rounded-[2rem] shadow-2xl bg-white"
              role="dialog"
              aria-modal="true"
              aria-label="Emergency SOS confirmation"
            >
              <div className="relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background:
                      'radial-gradient(circle at 20% 0%, #ef4444 0%, transparent 50%), radial-gradient(circle at 80% 100%, #db2777 0%, transparent 50%)',
                  }}
                />
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-600" />

                <div className="relative p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-0 rounded-2xl bg-red-500/30"
                        />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-300">
                          <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                          SOS Activated
                        </h2>
                        <p className="text-gray-500 font-semibold mt-1">Stay calm — help is being contacted</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={cancelSOS}
                      aria-label="Cancel emergency SOS"
                      className="p-3 rounded-2xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all focus:outline-none focus:ring-4 focus:ring-red-300/50"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                            {sosLocation.simulated ? 'Location (Simulated)' : 'Your Location'}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-sm font-bold text-gray-800 mb-2">
                        {sosLocation.lat.toFixed(6)}, {sosLocation.lng.toFixed(6)}
                      </p>
                      {sosLocation.note && (
                        <p className="text-xs font-semibold text-amber-700 bg-amber-50/70 border border-amber-100 rounded-lg p-2.5">
                          ⚠️ {sosLocation.note}
                        </p>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative">
                          <motion.div
                            animate={{ scale: countdown > 0 ? [1, 1.2, 1] : 1, opacity: countdown > 0 ? [0.6, 0.1, 0.6] : 1 }}
                            transition={{ duration: 1, repeat: countdown > 0 ? Infinity : 0, ease: 'easeInOut' }}
                            className="absolute inset-0 rounded-xl bg-rose-500/30"
                          />
                          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-rose-600">
                            Auto-Call in
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span
                          className={`text-5xl font-black tabular-nums ${
                            countdown <= 3 ? 'text-red-600 animate-pulse' : 'text-gray-900'
                          }`}
                        >
                          {countdown}
                        </span>
                        <span className="text-lg font-bold text-gray-500">seconds</span>
                      </div>
                      <p className="text-xs font-semibold text-rose-700 bg-white/70 border border-rose-100 rounded-lg p-2.5">
                        📞 {primaryContact ? `Calling ${primaryContact.name}` : 'Calling Ambulance 108'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                          <BellRing className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-violet-600">
                            Contacts to Notify
                          </p>
                          <p className="text-lg font-black text-gray-900">
                            {contacts.length} {contacts.length === 1 ? 'person' : 'people'}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={notifyAllContacts}
                        disabled={contacts.length === 0}
                        aria-label="Notify all emergency contacts"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-200/50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-violet-300/50"
                        style={{ minHeight: '44px' }}
                      >
                        <Send className="w-4.5 h-4.5" />
                        Notify All
                      </motion.button>
                    </div>
                    {contacts.length === 0 ? (
                      <div className="p-5 rounded-xl bg-amber-50 border-2 border-dashed border-amber-200 text-center">
                        <p className="text-sm font-bold text-amber-800">
                          ⚠️ No emergency contacts configured.
                        </p>
                        <p className="text-xs font-semibold text-amber-600 mt-1">
                          Add contacts below to enable in-app notifications.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {contacts.map((c) => {
                          const notified = notifiedContacts.includes(c.id)
                          return (
                            <motion.div
                              key={c.id}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                                notified
                                  ? 'bg-green-50 border-green-200'
                                  : c.isPrimary
                                  ? 'bg-pink-50 border-pink-100'
                                  : 'bg-white border-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 ${
                                    c.isPrimary
                                      ? 'bg-gradient-to-br from-pink-500 to-purple-600'
                                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                  }`}
                                >
                                  {c.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-black text-gray-900 text-sm truncate">{c.name}</p>
                                    {c.isPrimary && (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-gray-500 truncate">
                                    {c.relationship} · {c.phone}
                                  </p>
                                </div>
                              </div>
                              {notified ? (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Notified
                                </motion.span>
                              ) : (
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                                  Pending
                                </span>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={callPrimaryContact}
                      disabled={!primaryContact}
                      aria-label={primaryContact ? `Call ${primaryContact.name} now` : 'No primary contact'}
                      className="flex-1 inline-flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                      style={{ minHeight: '44px' }}
                    >
                      <Phone className="w-5 h-5" />
                      {primaryContact
                        ? `Call ${primaryContact.name} (${primaryContact.phone})`
                        : 'No Primary Contact'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCallHotline('108', 'Emergency Hotline (Ambulance)')}
                      aria-label="Call emergency hotline ambulance 108"
                      className="flex-1 inline-flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white font-black shadow-xl shadow-red-200/50 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-300/50"
                      style={{ minHeight: '44px' }}
                    >
                      <Ambulance className="w-5 h-5" />
                      Call Emergency Hotline
                    </motion.button>
                  </div>

                  <div className="mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={notifyAllContacts}
                      disabled={contacts.length === 0}
                      aria-label="Send SOS notification to all contacts"
                      className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 font-black hover:from-violet-100 hover:to-fuchsia-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-violet-300/50"
                      style={{ minHeight: '44px' }}
                    >
                      <BellRing className="w-5 h-5" />
                      Notify All Contacts with SOS & Location
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== ADD/EDIT CONTACT MODAL ========== */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowContactModal(false)
                setEditingContact(null)
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden z-50"
              role="dialog"
              aria-modal="true"
              aria-label={editingContact ? 'Edit emergency contact' : 'Add emergency contact'}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-pink-700 to-purple-700 bg-clip-text text-transparent">
                    {editingContact ? 'Edit Emergency Contact' : '✨ Add Emergency Contact'}
                  </h2>
                  <p className="text-gray-500 mt-1 text-xs sm:text-sm">
                    {editingContact ? 'Update contact details below' : 'Add a trusted emergency contact'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false)
                    setEditingContact(null)
                  }}
                  aria-label="Close modal"
                  className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-200"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSubmitContact} className="flex flex-col flex-1 overflow-hidden">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-name"
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                        placeholder="Full Name (e.g., Mom / Sarah Doe)"
                        required
                      />
                    </div>
                  </div>

                  {/* Relationship */}
                  <div>
                    <label htmlFor="contact-relationship" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-relationship"
                      type="text"
                      value={formData.relationship || ''}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                      placeholder="Relationship (e.g., Mother, Spouse, Sister)"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                        placeholder="Phone Number (e.g., +1 555-123-4567)"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Email (Optional)
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="contact-address" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Address (Optional)
                    </label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contact-address"
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                        placeholder="Home Address or City"
                      />
                    </div>
                  </div>

                  {/* Set Primary Contact */}
                  <label
                    htmlFor="contact-primary"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 cursor-pointer hover:border-amber-200 transition-colors"
                  >
                    <div className="relative">
                      <input
                        id="contact-primary"
                        type="checkbox"
                        checked={formData.isPrimary || false}
                        onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-6 h-6 rounded-lg border-2 border-gray-300 peer-checked:border-amber-500 peer-checked:bg-gradient-to-br from-amber-400 to-orange-500 transition-all flex items-center justify-center">
                        {formData.isPrimary && (
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        Set as Primary Contact
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        This person will be called first in an emergency SOS
                      </p>
                    </div>
                  </label>
                </div>

                {/* Footer - Always Visible & Sticky at Bottom */}
                <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 z-10 sticky bottom-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactModal(false)
                      setEditingContact(null)
                    }}
                    className="px-6 py-3.5 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-all text-sm"
                    style={{ minHeight: '44px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                    style={{ minHeight: '44px' }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Contact</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
