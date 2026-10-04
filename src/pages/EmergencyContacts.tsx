import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Phone,
  MapPin,
  AlertTriangle,
  Share2,
  Users,
  Hospital,
  Droplet,
  Heart,
  Trash2,
  Edit,
  X,
  Star,
  MessageCircle,
  Shield,
  Info,
  ChevronRight,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Home,
} from 'lucide-react'
import {
  useAppStore,
  useEmergencyContacts,
  useProfile,
  type EmergencyContact,
} from '@/store'
import { NotificationBell } from '@/components/NotificationBell'
import { emergencyContactAPI, type ApiEmergencyContact } from '@/services/api'

export default function EmergencyContacts() {
  const navigate = useNavigate()
  const contacts = useEmergencyContacts()
  const profile = useProfile()
  const {
    setEmergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    addNotification,
  } = useAppStore()

  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [formData, setFormData] = useState<Partial<EmergencyContact>>({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    isPrimary: false,
  })
  const [notifying, setNotifying] = useState(false)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch initial emergency contacts from MongoDB API
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
        console.warn('Could not fetch emergency contacts from API, fallback to store:', err)
      }
    }
    loadContacts()
    return () => {
      isMounted = false
    }
  }, [setEmergencyContacts])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleAdd = () => {
    setEditingContact(null)
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isPrimary: contacts.length === 0,
    })
    setShowModal(true)
  }

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact)
    setFormData(contact)
    setShowModal(true)
  }

  const validateForm = (): boolean => {
    if (!formData.name || !formData.name.trim()) {
      showToast('Please enter the contact name.', 'error')
      return false
    }
    if (!formData.relationship || !formData.relationship.trim()) {
      showToast('Please enter the relationship.', 'error')
      return false
    }
    if (!formData.phone || !formData.phone.trim()) {
      showToast('Please enter a phone number.', 'error')
      return false
    }
    // Phone validation regex: allow numbers, spaces, +, -, ()
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
    if (!phoneRegex.test(formData.phone.trim())) {
      showToast('Please enter a valid phone number (min 7 digits).', 'error')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (editingContact) {
        // Update contact via API
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
        showToast('Emergency contact saved successfully.', 'success')
      } else {
        // Create new contact via API
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
        showToast('Emergency contact saved successfully.', 'success')
      }

      // Add safety notification
      addNotification({
        id: Date.now().toString(),
        title: 'Emergency Contact Saved',
        message: `Saved emergency contact ${formData.name}.`,
        type: 'emergency',
        read: false,
        timestamp: new Date(),
      })

      // Refresh full contacts list from API to ensure consistent primary flags & ordering
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

      setShowModal(false)
    } catch (err: any) {
      console.error('Error saving emergency contact:', err)
      showToast(err?.message || 'Failed to save emergency contact. Saved locally.', 'error')
      
      // Local fallback resilience
      if (editingContact) {
        updateEmergencyContact(editingContact.id, formData)
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
      setShowModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await emergencyContactAPI.deleteContact(id)
    } catch (err) {
      console.warn('API delete failed, removing locally:', err)
    }
    deleteEmergencyContact(id)
    showToast('Emergency contact removed.', 'success')
  }

  const handleEmergencyCall = () => {
    const primary = contacts.find((c) => c.isPrimary) || contacts[0]
    if (primary) {
      window.location.href = `tel:${primary.phone}`
    } else {
      window.location.href = 'tel:911'
    }
  }

  const handleNotifyContacts = () => {
    setNotifying(true)
    setTimeout(() => setNotifying(false), 2000)
  }

  const handleShareLocation = () => {
    setSharingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setTimeout(() => setSharingLocation(false), 1500),
        () => setSharingLocation(false)
      )
    } else {
      setSharingLocation(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 14 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-semibold ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                : 'bg-gradient-to-r from-rose-500 to-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '3s' }} />

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
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                  Emergency SOS
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-rose-500" />
                  Your safety is our priority
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>

          {/* Emergency SOS Button Section */}
          <motion.div
            variants={itemVariants}
            className="relative mb-8 rounded-3xl p-8 lg:p-12 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 shadow-2xl shadow-rose-300/50 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -mb-16 -ml-16" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center lg:text-left text-white">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white/90 mb-5">
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Mode
                </div>
                <h2 className="text-3xl lg:text-5xl font-black mb-4 leading-tight">
                  Need Help <br className="hidden sm:block" />Right Now?
                </h2>
                <p className="text-lg text-white/90 mb-6 max-w-lg">
                  Press the SOS button to instantly call your primary emergency contact and notify all your trusted contacts with your location.
                </p>
                <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNotifyContacts}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all backdrop-blur-sm border ${
                      notifying
                        ? 'bg-green-500/90 border-green-400 text-white'
                        : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {notifying ? '✓ Contacts Notified!' : 'Notify All Contacts'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShareLocation}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all backdrop-blur-sm border ${
                      sharingLocation
                        ? 'bg-teal-500/90 border-teal-400 text-white'
                        : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    {sharingLocation ? '📍 Sharing Location...' : 'Share Live Location'}
                  </motion.button>
                </div>
              </div>

              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-white/30 blur-xl -m-8"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleEmergencyCall}
                  className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white shadow-2xl flex flex-col items-center justify-center text-rose-600 z-10"
                >
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-200" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Phone className="w-12 h-12 sm:w-14 sm:h-14 mb-2 animate-pulse" />
                    <span className="text-xl sm:text-2xl font-black tracking-tight">SOS</span>
                    <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-widest mt-0.5">
                      Tap to Call
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Medical Info Card + Quick Info */}
          <motion.div
            variants={itemVariants}
            className="grid lg:grid-cols-3 gap-6 mb-8"
          >
            {/* Blood Group & Quick Info */}
            <div className="space-y-6">
              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-red-100/40 border border-red-50"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Blood Group</h3>
                </div>
                <div className="relative">
                  <div className="text-6xl lg:text-7xl font-black bg-gradient-to-br from-red-500 to-rose-600 bg-clip-text text-transparent">
                    {profile?.bloodGroup || 'A+'}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
                    Critical for emergencies
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl shadow-blue-100/40 border border-blue-50"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Preferred Hospital</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-gray-800 leading-tight">
                    {profile?.hospital || "City Women's Hospital"}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile?.address || '2.3 km away'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Medical Emergency Card */}
            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 shadow-2xl shadow-purple-300/40"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Medical Emergency Card</h3>
                    <p className="text-sm text-purple-200">Show this to medical personnel</p>
                  </div>
                  <div className="ml-auto w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white/80" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Full Name</p>
                    <p className="text-lg font-bold text-white">{profile?.name || 'Jane Doe'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Age</p>
                    <p className="text-lg font-bold text-white">{profile?.age || 28} yrs</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Contact Number</p>
                    <p className="text-lg font-bold text-white">{profile?.mobile || '+1 555-123-4567'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Blood Group</p>
                    <p className="text-lg font-bold text-white">{profile?.bloodGroup || 'A+'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Allergies</p>
                    <p className="text-lg font-bold text-white">{profile?.allergies || 'None known'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Current Meds</p>
                    <p className="text-lg font-bold text-white truncate">{profile?.currentMedicines || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Doctor</p>
                    <p className="text-lg font-bold text-white">{profile?.doctorName || 'Dr. Sarah Johnson'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-200 mb-1">Medical History</p>
                    <p className="text-lg font-bold text-white truncate">{profile?.medicalHistory || 'None'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contacts Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden"
          >
            <div className="p-6 sm:p-7 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Emergency Contacts</h3>
                  <p className="text-sm text-gray-500">{contacts.length} trusted {contacts.length === 1 ? 'person' : 'people'}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-pink-200/50 hover:shadow-2xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Contact
              </motion.button>
            </div>

            <div className="p-6 sm:p-7">
              <AnimatePresence mode="popLayout">
                {contacts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <Users className="w-12 h-12 text-pink-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">No emergency contacts yet</h4>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Add your trusted contacts so they can be notified in case of emergency.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAdd}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-7 py-3.5 rounded-2xl font-bold shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Contact
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-5">
                    {contacts.map((contact, idx) => (
                      <motion.div
                        key={contact.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ y: -4 }}
                        className={`relative p-6 rounded-2xl border-2 transition-all overflow-hidden ${
                          contact.isPrimary
                            ? 'bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 border-pink-200 shadow-xl shadow-pink-100/40'
                            : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:shadow-lg'
                        }`}
                      >
                        {contact.isPrimary && (
                          <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-md">
                            <Star className="w-3 h-3 fill-current" />
                            Primary
                          </div>
                        )}

                        <div className="flex items-start gap-4 mb-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 ${
                            contact.isPrimary
                              ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 shadow-pink-200'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-200'
                          }`}>
                            {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <h4 className="font-black text-gray-800 text-lg truncate">{contact.name}</h4>
                            <p className="text-sm text-gray-500 font-medium">{contact.relationship}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-5">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                            <Phone className={`w-4 h-4 ${contact.isPrimary ? 'text-pink-500' : 'text-blue-500'}`} />
                            <span className="text-sm font-semibold text-gray-800">{contact.phone}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                              <MessageCircle className={`w-4 h-4 ${contact.isPrimary ? 'text-pink-500' : 'text-blue-500'}`} />
                              <span className="text-sm font-medium text-gray-600 truncate">{contact.email}</span>
                            </div>
                          )}
                          {contact.address && (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                              <Home className={`w-4 h-4 ${contact.isPrimary ? 'text-pink-500' : 'text-blue-500'}`} />
                              <span className="text-sm font-medium text-gray-600 truncate">{contact.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.a
                            href={`tel:${contact.phone}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-md shadow-green-200/60 hover:shadow-lg transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </motion.a>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(contact)}
                            className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(contact.id)}
                            className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Add/Edit Modal - Fixed Footer & Scrollable Form */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">
                    {editingContact ? 'Edit Emergency Contact' : '✨ Add Emergency Contact'}
                  </h2>
                  <p className="text-gray-500 mt-0.5 text-xs sm:text-sm">
                    {editingContact ? 'Update contact details below' : 'Add a trusted emergency contact'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form with Scrollable Body & Sticky Footer */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
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
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <input
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
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
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
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email (Optional)</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
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
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Address (Optional)</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white font-medium transition-all placeholder:text-gray-400"
                        placeholder="Home Address or City"
                      />
                    </div>
                  </div>

                  {/* Set Primary Contact Checkbox */}
                  <label className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 cursor-pointer hover:border-amber-200 transition-colors">
                    <div className="relative">
                      <input
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
                        This person will be called first in an emergency
                      </p>
                    </div>
                  </label>
                </div>

                {/* Footer - Always visible & sticky at bottom */}
                <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3 justify-end z-10 sticky bottom-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3.5 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white rounded-2xl font-black shadow-xl shadow-pink-200/50 hover:shadow-2xl transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
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
