
import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Heart, Shield, Gift, Check, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store'
import { authAPI } from '../services/api'

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const setUser = useAppStore((state) => state.setUser)
  const navigate = useNavigate()

  const strength = useMemo(() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  }, [password])

  const strengthInfo = [
    { label: 'Very Weak', bar: 'w-1/4', color: 'from-red-400 to-red-500' },
    { label: 'Weak', bar: 'w-2/4', color: 'from-orange-400 to-orange-500' },
    { label: 'Good', bar: 'w-3/4', color: 'from-yellow-400 to-amber-500' },
    { label: 'Strong', bar: 'w-full', color: 'from-green-400 to-emerald-500' },
    { label: 'Excellent!', bar: 'w-full', color: 'from-green-500 to-teal-500' },
  ][Math.max(0, strength - 1)] ?? { label: 'Enter a password', bar: 'w-0', color: 'bg-gray-200' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError('')
    setSuccessMessage('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    // 1. Missing required fields
    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.')
      return
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    // 3. Password length check
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    // 4. Password confirmation check
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.')
      return
    }

    // 5. Terms check
    if (!termsAccepted) {
      setError('Please accept the terms and conditions to continue.')
      return
    }

    setLoading(true)

    try {
      const userData = await authAPI.register(cleanName, cleanEmail, password)
      setSuccessMessage('Account created successfully! Redirecting to your dashboard...')
      setUser({
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: 'patient',
        token: userData.token,
      })
      setTimeout(() => {
        navigate('/home')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    { icon: <Gift className="w-5 h-5" />, text: 'FREE AI health assistant', color: 'from-pink-500 to-rose-500' },
    { icon: <Heart className="w-5 h-5" />, text: 'Personalized health plans', color: 'from-violet-500 to-purple-500' },
    { icon: <Shield className="w-5 h-5" />, text: 'Bank-level encryption', color: 'from-sky-500 to-blue-500' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-10">
      {/* Decorative background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute top-0 left-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-purple-200/40 rounded-full blur-3xl -z-10"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        className="absolute bottom-0 right-0 w-[450px] lg:w-[650px] h-[450px] lg:h-[650px] bg-pink-200/30 rounded-full blur-3xl -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
        className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch"
      >
        {/* Left side - Brand showcase */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 80, delay: 0.3 }}
          className="hidden lg:flex flex-col justify-between p-10 rounded-[2.5rem] bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white relative overflow-hidden shadow-2xl order-2 lg:order-1"
        >
          {/* Animated orbs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-32 -right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 border-2 border-dashed border-white/15 rounded-[2.5rem]"
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                <span className="text-3xl">🌸</span>
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight">FemCare AI</div>
                <div className="text-sm text-white/70 font-medium">Join 50,000+ women</div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative z-10 my-12"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-7xl mb-6"
            >
              🎉
            </motion.div>
            <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-5">
              Begin your{' '}
              <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-pink-100 bg-clip-text text-transparent">
                health journey
              </span>{' '}
              today
            </h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Create your free account in under a minute and unlock personalized AI care, smart reminders, and access to certified women's health specialists.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="relative z-10 space-y-3"
          >
            {perks.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg`}>
                  {p.icon}
                </div>
                <div>
                  <div className="font-bold text-lg">{p.text}</div>
                  <div className="text-sm text-white/60">Limited-time included</div>
                </div>
                <Check className="w-5 h-5 ml-auto text-green-200" />
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="relative z-10 mt-8 p-5 rounded-2xl bg-black/10 border border-white/10 backdrop-blur-sm"
          >
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-yellow-300">★</span>
              ))}
            </div>
            <p className="text-sm text-white/90 leading-relaxed mb-3 italic">
              "FemCare AI helped me manage my PCOS symptoms naturally. The health insights are incredibly personalized!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-sm font-black">
                A
              </div>
              <div>
                <div className="text-sm font-bold">Ananya Sharma</div>
                <div className="text-xs text-white/60">Verified user · 6 months</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Signup form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 80, delay: 0.3 }}
          className="w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 xl:p-12 border border-white/50 relative overflow-hidden order-1 lg:order-2"
        >
          {/* Inner decorative */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-purple-100/50 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-0 w-52 h-52 bg-pink-100/50 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Mobile-only logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex lg:hidden items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌸</span>
              </div>
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  FemCare AI
                </div>
                <div className="text-xs text-gray-500 font-medium">Join today, it's free!</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 mb-6">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                  Create your free account
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                Let's get started! <span className="text-violet-500">✨</span>
              </h1>
              <p className="text-gray-600 mb-8 text-base sm:text-lg leading-relaxed">
                Enter a few details to begin your <span className="font-semibold text-gray-800">personalized healthcare journey</span>.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-black text-red-600">!</span>
                  </div>
                  <div className="pt-0.5">{error}</div>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm font-medium flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="pt-0.5">{successMessage}</div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-500" />
                  Full Name
                </label>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-pink-200 rounded-2xl blur-[2px] opacity-0 group-focus-within:opacity-60 transition-opacity" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-16 pr-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-gray-900 placeholder-gray-400 font-medium text-base"
                      placeholder="Sarah Johnson"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-violet-500" />
                  Email Address
                </label>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-pink-200 rounded-2xl blur-[2px] opacity-0 group-focus-within:opacity-60 transition-opacity" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center text-gray-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-16 pr-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-gray-900 placeholder-gray-400 font-medium text-base"
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-500" />
                  Password
                </label>
                <div className="group relative mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-pink-200 rounded-2xl blur-[2px] opacity-0 group-focus-within:opacity-60 transition-opacity" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center text-gray-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-16 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-gray-900 placeholder-gray-400 font-medium text-base"
                      placeholder="At least 8 characters"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {/* Strength indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600">Password strength</span>
                      <span className={`font-black ${strength >= 3 ? 'text-green-600' : strength >= 1 ? 'text-orange-500' : 'text-red-500'}`}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className={`h-full rounded-full bg-gradient-to-r ${strengthInfo.color} ${strengthInfo.bar}`}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {[
                        { label: 'At least 8 characters', ok: password.length >= 8 },
                        { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(password) },
                        { label: 'Number (0-9)', ok: /[0-9]/.test(password) },
                        { label: 'Special character (!@#)', ok: /[^A-Za-z0-9]/.test(password) },
                      ].map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${r.ok ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {r.ok ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                          </div>
                          <span className={`${r.ok ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-500" />
                  Confirm Password
                </label>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-pink-200 rounded-2xl blur-[2px] opacity-0 group-focus-within:opacity-60 transition-opacity" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center text-gray-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-16 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-gray-900 placeholder-gray-400 font-medium text-base"
                      placeholder="Re-enter your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Terms checkbox */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <div className="relative w-5 h-5 mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="peer absolute w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 rounded-lg border-2 border-gray-200 peer-checked:border-violet-500 peer-checked:bg-gradient-to-br peer-checked:from-violet-500 peer-checked:to-pink-500 transition-all flex items-center justify-center">
                      <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round opacity-0 peer-checked:opacity-100 transition-opacity">
                        <polyline points="1 5 4.5 8.5 11 1.5" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                    I agree to FemCare AI's{' '}
                    <button type="button" className="font-bold text-violet-600 hover:text-violet-700 underline decoration-violet-200 underline-offset-2">
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button type="button" className="font-bold text-pink-600 hover:text-pink-700 underline decoration-pink-200 underline-offset-2">
                      Privacy Policy
                    </button>
                    , and consent to receive health-related communications.
                  </span>
                </label>
              </motion.div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden py-4.5 rounded-2xl font-black text-white text-lg shadow-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:shadow-2xl hover:shadow-violet-300/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                style={{ paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Creating your account...
                    </>
                  ) : (
                    <>
                      Create Free Account
                      <Gift className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-center gap-4 py-2"
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or sign up with</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </motion.div>

              {/* Social buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { name: 'Google', emoji: '🔵' },
                  { name: 'Apple', emoji: '🍎' },
                ].map((p, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    className="py-3.5 rounded-2xl border-2 border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all flex items-center justify-center gap-2.5 font-bold text-gray-700"
                  >
                    <span className="text-xl">{p.emoji}</span>
                    {p.name}
                  </motion.button>
                ))}
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-8 sm:mt-10 pt-6 border-t border-gray-100 text-center"
            >
              <p className="text-gray-600 font-medium text-base">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent hover:from-violet-700 hover:to-pink-700 transition-all inline-flex items-center gap-1.5 group"
                >
                  Sign in instead
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-violet-600" />
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
