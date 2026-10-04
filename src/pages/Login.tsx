
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Sparkles, Heart, Shield, Zap, ArrowRight, Stethoscope, User, ShieldCheck } from 'lucide-react'
import { useAppStore } from '../store'
import { authAPI } from '../services/api'

export default function Login() {
  const [loginRole, setLoginRole] = useState<'patient' | 'doctor' | 'admin'>('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAppStore((state) => state.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError('')
    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)

    try {
      if (loginRole === 'admin') {
        const adminData = await authAPI.adminLogin(cleanEmail, password)
        setUser({
          id: adminData._id,
          name: adminData.name,
          email: adminData.email,
          role: 'admin',
          token: adminData.token,
        })
        navigate('/admin')
      } else if (loginRole === 'doctor') {
        const docData = await authAPI.doctorLogin(cleanEmail, password)
        setUser({
          id: docData._id,
          name: docData.name,
          email: docData.email,
          role: 'doctor',
          specialty: docData.specialty,
          token: docData.token,
        })
        navigate('/doctor-dashboard')
      } else {
        const userData = await authAPI.login(cleanEmail, password)
        setUser({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role || 'patient',
          token: userData.token,
        })
        if (userData.role === 'admin') {
          navigate('/admin')
        } else if (userData.role === 'doctor') {
          navigate('/doctor-dashboard')
        } else {
          navigate('/home')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: <Heart className="w-5 h-5" />, text: 'Personalized AI Care', color: 'from-pink-500 to-rose-500', light: 'from-pink-100 to-rose-100' },
    { icon: <Shield className="w-5 h-5" />, text: '100% Private & Secure', color: 'from-violet-500 to-purple-500', light: 'from-violet-100 to-purple-100' },
    { icon: <Zap className="w-5 h-5" />, text: 'Instant Health Answers', color: 'from-sky-500 to-blue-500', light: 'from-sky-100 to-blue-100' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Decorative background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute top-0 right-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-pink-200/40 rounded-full blur-3xl -z-10"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        className="absolute bottom-0 left-0 w-[450px] lg:w-[650px] h-[450px] lg:h-[650px] bg-purple-200/30 rounded-full blur-3xl -z-10"
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
          className="hidden lg:flex flex-col justify-between p-10 rounded-[2.5rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white relative overflow-hidden shadow-2xl"
        >
          {/* Animated orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-32 -left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
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
                <div className="text-sm text-white/70 font-medium">Your health companion</div>
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
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-7xl mb-6"
            >
              ✨
            </motion.div>
            <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-5">
              Welcome back to your{' '}
              <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                health journey
              </span>
            </h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Continue your personalized care with AI-powered health insights, expert doctor consultations, and smart reminders tailored for you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="relative z-10 space-y-3"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                  {f.icon}
                </div>
                <div>
                  <div className="font-bold text-lg">{f.text}</div>
                  <div className="text-sm text-white/60">Premium feature</div>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto text-white/40" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Login form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 80, delay: 0.3 }}
          className="w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 xl:p-12 border border-white/50 relative overflow-hidden"
        >
          {/* Inner decorative */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-pink-100/50 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-52 h-52 bg-purple-100/50 rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Mobile-only logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex lg:hidden items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌸</span>
              </div>
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  FemCare AI
                </div>
                <div className="text-xs text-gray-500 font-medium">Your health companion</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 mb-6">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                  Sign in to continue
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                Welcome back! <span className="text-pink-500">👋</span>
              </h1>
              <p className="text-gray-700 mb-6 text-base sm:text-lg leading-relaxed font-medium">
                Select your role and enter credentials to access your <span className="font-bold text-gray-900">dashboard</span>.
              </p>

              {/* 3-Role Selector Tabs */}
              <div className="flex p-1.5 bg-gray-100/90 rounded-2xl mb-6 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLoginRole('patient')}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'patient'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('doctor')}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'doctor'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('admin')}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    loginRole === 'admin'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </button>
              </div>
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

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-500" />
                  Email Address
                </label>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 rounded-2xl blur-[2px] opacity-0 group-focus-within:opacity-60 transition-opacity" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center text-gray-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-16 pr-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all text-gray-900 placeholder-gray-400 font-medium text-base"
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
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-pink-500" />
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 rounded-2xl blur-[2px] opacity-0 group-focus-within:opacity-60 transition-opacity" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center text-gray-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-16 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all text-gray-900 placeholder-gray-400 font-medium text-base"
                      placeholder="••••••••"
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
              </motion.div>

              {/* Remember me */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative w-5 h-5">
                    <input
                      type="checkbox"
                      className="peer absolute w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 rounded-lg border-2 border-gray-200 peer-checked:border-pink-500 peer-checked:bg-gradient-to-br peer-checked:from-pink-500 peer-checked:to-purple-500 transition-all flex items-center justify-center">
                      <svg viewBox="0 0 12 10" className="w-3 h-3 fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round opacity-0 peer-checked:opacity-100 transition-opacity">
                        <polyline points="1 5 4.5 8.5 11 1.5" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                    Remember me for 30 days
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
                className="relative w-full group overflow-hidden py-4.5 rounded-2xl font-black text-white text-lg shadow-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:shadow-2xl hover:shadow-pink-300/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
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
                      Signing you in...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
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
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-purple-700 transition-all inline-flex items-center gap-1.5 group"
                >
                  Create an account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-pink-600" />
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
