import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import BackToHomeButton from '@/components/BackToHomeButton'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Trophy,
  Flame,
  Droplets,
  Dumbbell,
  Moon,
  Heart,
  Sparkles,
  Star,
  Plus,
  Check,
  X,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Gem,
  Medal,
  Rocket,
  Shield,
  Gift,
  PartyPopper,
  ChevronRight,
  Bell,
} from 'lucide-react'
import {
  useAppStore,
  useChallenges,
  useAchievements,
  type Challenge,
  type Achievement,
} from '@/store'
import { NotificationBell } from '@/components/NotificationBell'

type TabType = 'active' | 'completed'

export default function Challenges() {
  const navigate = useNavigate()
  const challenges = useChallenges()
  const achievements = useAchievements()
  const { addChallenge, updateChallenge, addAchievement } = useAppStore()

  const [tab, setTab] = useState<TabType>('active')
  const [celebrateChallenge, setCelebrateChallenge] = useState<Challenge | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newChallengeName, setNewChallengeName] = useState('')

  useEffect(() => {
    if (challenges.length === 0) {
      const seed: Challenge[] = [
        {
          id: 'seed-1',
          name: '7-Day Hydration',
          description: 'Drink 8+ glasses of water every day for a week',
          duration: 7,
          progress: 5,
          target: 7,
          status: 'active',
          startDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
          icon: 'droplets',
          color: 'from-cyan-400 via-blue-400 to-indigo-500',
          streak: 5,
        },
        {
          id: 'seed-2',
          name: '30-Day Workout',
          description: 'At least 20 minutes of movement daily',
          duration: 30,
          progress: 12,
          target: 30,
          status: 'active',
          startDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
          icon: 'dumbbell',
          color: 'from-emerald-400 via-teal-400 to-cyan-500',
          streak: 8,
        },
        {
          id: 'seed-3',
          name: 'Meditation Journey',
          description: '10 minutes of mindfulness meditation every day',
          duration: 21,
          progress: 21,
          target: 21,
          status: 'completed',
          startDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
          icon: 'heart',
          color: 'from-violet-400 via-purple-400 to-fuchsia-500',
          streak: 21,
        },
        {
          id: 'seed-4',
          name: 'Sleep Improvement',
          description: '7+ hours of quality sleep each night',
          duration: 14,
          progress: 6,
          target: 14,
          status: 'active',
          startDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
          icon: 'moon',
          color: 'from-indigo-400 via-purple-400 to-pink-500',
          streak: 3,
        },
      ]
      seed.forEach((c) => addChallenge(c))

      if (achievements.length === 0) {
        const seedAch: Achievement[] = [
          {
            id: 'ach-1',
            name: 'First Steps',
            icon: 'rocket',
            unlockedAt: new Date(Date.now() - 28 * 86400000),
            description: 'Completed your very first challenge',
          },
          {
            id: 'ach-2',
            name: 'Zen Master',
            icon: 'gem',
            unlockedAt: new Date(Date.now() - 7 * 86400000),
            description: 'Finished 21-day meditation challenge',
          },
          {
            id: 'ach-3',
            name: 'On Fire',
            icon: 'flame',
            unlockedAt: new Date(Date.now() - 2 * 86400000),
            description: 'Achieved a 7-day streak',
          },
        ]
        seedAch.forEach((a) => addAchievement(a))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeChallenges = challenges.filter((c) => c.status === 'active')
  const completedChallenges = challenges.filter((c) => c.status === 'completed')

  const totalProgress = useMemo(() => {
    if (activeChallenges.length === 0) return 0
    return Math.round(
      activeChallenges.reduce((s, c) => s + (c.progress / c.target) * 100, 0) /
        activeChallenges.length
    )
  }, [activeChallenges])

  const maxStreak = useMemo(
    () => Math.max(0, ...challenges.map((c) => c.streak)),
    [challenges]
  )

  const handleProgress = (challenge: Challenge) => {
    const newProgress = Math.min(challenge.progress + 1, challenge.target)
    const completed = newProgress >= challenge.target

    updateChallenge(challenge.id, {
      progress: newProgress,
      streak: challenge.streak + 1,
      status: completed ? 'completed' : 'active',
    })

    if (completed) {
      setCelebrateChallenge({ ...challenge, progress: newProgress, status: 'completed' })
      const newAch: Achievement = {
        id: Date.now().toString(),
        name: `${challenge.name} Champion`,
        icon: 'trophy',
        unlockedAt: new Date(),
        description: `Successfully completed the ${challenge.name} challenge!`,
      }
      setTimeout(() => addAchievement(newAch), 1500)
    }
  }

  const handleStartCustom = () => {
    if (!newChallengeName.trim()) return
    const newCh: Challenge = {
      id: Date.now().toString(),
      name: newChallengeName,
      description: 'Your custom wellness challenge',
      duration: 30,
      progress: 0,
      target: 30,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      icon: 'star',
      color: 'from-pink-400 via-rose-400 to-red-500',
      streak: 0,
    }
    addChallenge(newCh)
    setNewChallengeName('')
    setShowModal(false)
  }

  const iconMap: Record<string, React.ReactNode> = {
    droplets: <Droplets className="w-7 h-7" />,
    dumbbell: <Dumbbell className="w-7 h-7" />,
    heart: <Heart className="w-7 h-7" />,
    moon: <Moon className="w-7 h-7" />,
    star: <Star className="w-7 h-7" />,
  }

  const achIconMap: Record<string, React.ReactNode> = {
    trophy: <Trophy className="w-7 h-7" />,
    flame: <Flame className="w-7 h-7" />,
    gem: <Gem className="w-7 h-7" />,
    medal: <Medal className="w-7 h-7" />,
    award: <Award className="w-7 h-7" />,
    rocket: <Rocket className="w-7 h-7" />,
    crown: <Crown className="w-7 h-7" />,
    shield: <Shield className="w-7 h-7" />,
  }

  const tabClass = (active: boolean) =>
    `px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${
      active
        ? 'bg-white text-amber-600 shadow-lg shadow-amber-100'
        : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-rose-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-yellow-200/25 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '4s' }} />

      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebrateChallenge && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setCelebrateChallenge(null)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                animate={{
                  scale: [0.5, 1.1, 1],
                  opacity: 1,
                  rotate: [0, 5, -3, 0],
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-md w-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 rounded-3xl p-8 sm:p-10 text-center shadow-2xl overflow-hidden"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                      y: [-30, -200, -250],
                      x: Math.cos(i) * 120,
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1.2, 0.8],
                      transition: { duration: 1.8, repeat: Infinity, delay: i * 0.1 },
                    }}
                    className="absolute left-1/2 top-1/2 text-2xl pointer-events-none"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    {['⭐', '✨', '🎉', '🏆', '💫', '🌟'][i % 6]}
                  </motion.div>
                ))}

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-28 h-28 mx-auto mb-6 relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-white/30 blur-xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-amber-500">
                      <Trophy className="w-14 h-14" />
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-3 rounded-3xl border-2 border-dashed border-white/40"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider mb-4"
                  >
                    <PartyPopper className="w-4 h-4" />
                    Milestone Achieved
                  </motion.div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight"
                  >
                    You Did It!
                  </motion.h2>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-white/90 mb-6 text-lg"
                  >
                    Completed <span className="font-black">{celebrateChallenge.name}</span>
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-6 mb-7 p-4 rounded-2xl bg-white/20 backdrop-blur-sm"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{celebrateChallenge.target}</div>
                      <div className="text-xs text-white/80 uppercase">Days</div>
                    </div>
                    <div className="w-px h-10 bg-white/30" />
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">🔥 {celebrateChallenge.streak}</div>
                      <div className="text-xs text-white/80 uppercase">Streak</div>
                    </div>
                    <div className="w-px h-10 bg-white/30" />
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">+100</div>
                      <div className="text-xs text-white/80 uppercase">Points</div>
                    </div>
                  </motion.div>

                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCelebrateChallenge(null)}
                    className="w-full py-4 bg-white text-amber-600 rounded-2xl font-black text-lg shadow-2xl hover:shadow-3xl transition-shadow flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Awesome!
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.06 }}
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <BackToHomeButton />
              <div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-amber-600 to-rose-600 bg-clip-text text-transparent">
                  Wellness Challenges
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Level up your health one day at a time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-amber-200/50 hover:shadow-2xl transition-all"
              >
                <Plus className="w-5 h-5" />
                New Challenge
              </motion.button>
            </div>
          </div>

          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative mb-8 rounded-3xl p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-500 shadow-2xl shadow-amber-300/40 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mt-24 -mr-24" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl -mb-20 -ml-20" />
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-10, -30, -10],
                  x: [0, 5, 0],
                  rotate: [0, 10, -10, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: 'easeInOut',
                }}
                className="absolute text-3xl pointer-events-none"
                style={{
                  top: `${15 + i * 12}%`,
                  left: `${55 + i * 7}%`,
                }}
              >
                {['⭐', '✨', '🏆', '💫', '🌟'][i]}
              </motion.div>
            ))}

            <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white/90 mb-5">
                  <Flame className="w-4 h-4" />
                  Your Challenge Dashboard
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                  Unlock Your <br className="hidden sm:block" />Full Potential
                </h2>
                <p className="text-lg text-white/90 max-w-lg mb-6 leading-relaxed">
                  Build healthy habits, maintain streaks, and collect achievements as you crush every wellness goal you set!
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl">
                    <Flame className="w-6 h-6 text-orange-200" />
                    <div>
                      <div className="text-2xl font-black">{maxStreak}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/70">Best Streak</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl">
                    <Award className="w-6 h-6 text-yellow-200" />
                    <div>
                      <div className="text-2xl font-black">{achievements.length}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/70">Awards</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl">
                    <Target className="w-6 h-6 text-rose-200" />
                    <div>
                      <div className="text-2xl font-black">{challenges.length}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/70">Total</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-white" />
                      <span className="font-bold text-white/90">Overall Progress</span>
                    </div>
                    <span className="text-3xl font-black text-white">{totalProgress}%</span>
                  </div>
                  <div className="w-full h-5 bg-white/15 rounded-full overflow-hidden mb-6 border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalProgress}%` }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-white via-yellow-200 to-white rounded-full shadow-lg relative overflow-hidden"
                    >
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Hydration', value: Math.round((activeChallenges.find(c => c.icon === 'droplets')?.progress / (activeChallenges.find(c => c.icon === 'droplets')?.target || 1)) * 100) || 0, icon: <Droplets className="w-4 h-4" />, color: 'from-cyan-400 to-blue-500' },
                      { label: 'Fitness', value: Math.round((activeChallenges.find(c => c.icon === 'dumbbell')?.progress / (activeChallenges.find(c => c.icon === 'dumbbell')?.target || 1)) * 100) || 0, icon: <Dumbbell className="w-4 h-4" />, color: 'from-emerald-400 to-teal-500' },
                      { label: 'Sleep', value: Math.round((activeChallenges.find(c => c.icon === 'moon')?.progress / (activeChallenges.find(c => c.icon === 'moon')?.target || 1)) * 100) || 0, icon: <Moon className="w-4 h-4" />, color: 'from-indigo-400 to-purple-500' },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <div className={`w-10 h-10 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-md`}>
                          {m.icon}
                        </div>
                        <div className="text-xl font-black text-white">{m.value}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/70">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-2 shadow-xl shadow-gray-100/50 border border-white mb-8 inline-flex"
          >
            <button onClick={() => setTab('active')} className={tabClass(tab === 'active')}>
              <div className="flex items-center gap-2"><Target className="w-4 h-4" /> Active ({activeChallenges.length})</div>
            </button>
            <button onClick={() => setTab('completed')} className={tabClass(tab === 'completed')}>
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Completed ({completedChallenges.length})</div>
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            {tab === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeChallenges.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 p-16 text-center"
                  >
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-3xl border-2 border-dashed border-amber-200"
                      />
                      <div className="absolute inset-4 rounded-3xl bg-gradient-to-br from-amber-100 via-yellow-100 to-rose-100 flex items-center justify-center">
                        <Trophy className="w-14 h-14 text-amber-500" />
                      </div>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-800 mb-3">
                      No active challenges
                    </h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                      Start a new challenge and begin your journey towards better wellness habits today!
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-amber-200/50 hover:shadow-2xl"
                    >
                      <Plus className="w-6 h-6" />
                      Start Your First Challenge
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {activeChallenges.map((challenge, idx) => {
                      const pct = Math.round((challenge.progress / challenge.target) * 100)
                      const circumference = 2 * Math.PI * 52
                      const dashoffset = circumference - (pct / 100) * circumference
                      return (
                        <motion.div
                          key={challenge.id}
                          layout
                          initial={{ opacity: 0, y: 25 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          whileHover={{ y: -6, scale: 1.01 }}
                          className="relative bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden group"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${challenge.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />
                          <div className="relative p-6 sm:p-7">
                            <div className="flex items-start gap-5">
                              <div className="relative flex-shrink-0">
                                <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                                  <circle
                                    cx="60" cy="60" r="52"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-gray-100"
                                  />
                                  <motion.circle
                                    cx="60" cy="60" r="52"
                                    fill="none"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    className={`text-transparent bg-gradient-to-br ${challenge.color}`}
                                    style={{
                                      stroke: 'url(#grad-' + challenge.id + ')',
                                      strokeDasharray: circumference,
                                      strokeDashoffset: dashoffset,
                                    }}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: dashoffset }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                  />
                                  <defs>
                                    <linearGradient id={`grad-${challenge.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor={challenge.color.includes('cyan') ? '#22d3ee' : challenge.color.includes('emerald') ? '#34d399' : challenge.color.includes('violet') ? '#a78bfa' : challenge.color.includes('indigo') ? '#818cf8' : '#f472b6'} />
                                      <stop offset="100%" stopColor={challenge.color.includes('blue') ? '#6366f1' : challenge.color.includes('teal') ? '#14b8a6' : challenge.color.includes('fuchsia') ? '#d946ef' : challenge.color.includes('purple') ? '#ec4899' : '#fb923c'} />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${challenge.color} flex items-center justify-center text-white shadow-lg mb-1`}>
                                    {iconMap[challenge.icon] || <Star className="w-6 h-6" />}
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <h3 className="font-black text-gray-800 text-xl leading-tight">{challenge.name}</h3>
                                  {challenge.streak > 0 && (
                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                                      <Flame className="w-4 h-4 text-orange-500" />
                                      <span className="text-xs font-black text-orange-600">{challenge.streak}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{challenge.description}</p>

                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{challenge.progress}/{challenge.target} days</span>
                                  </div>
                                  <div className={`text-2xl font-black bg-gradient-to-r ${challenge.color} bg-clip-text text-transparent`}>
                                    {pct}%
                                  </div>
                                </div>

                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleProgress(challenge)}
                                  className={`w-full py-3.5 rounded-2xl font-black text-white shadow-lg bg-gradient-to-r ${challenge.color} hover:shadow-xl transition-all flex items-center justify-center gap-2`}
                                >
                                  <Check className="w-5 h-5" />
                                  Mark Today Complete
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {completedChallenges.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 p-16 text-center"
                  >
                    <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No completed challenges yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Finish an active challenge to see it here — and earn an achievement badge along with it!
                    </p>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-5 mb-8">
                    {completedChallenges.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-gray-50 via-white to-amber-50 border-2 border-amber-200/60 shadow-xl shadow-amber-100/30"
                      >
                        <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-black shadow-lg flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" /> Completed
                        </div>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-lg mb-4`}>
                          {iconMap[c.icon] || <Star className="w-8 h-8" />}
                        </div>
                        <h3 className="font-black text-gray-800 text-lg mb-1">{c.name}</h3>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{c.description}</p>
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                          <div className="text-center flex-1">
                            <div className="text-lg font-black text-gray-800">{c.target}</div>
                            <div className="text-[10px] uppercase text-gray-400 tracking-wider">Days</div>
                          </div>
                          <div className="text-center flex-1">
                            <div className="text-lg font-black text-orange-600 flex items-center justify-center gap-1">
                              <Flame className="w-4 h-4" />{c.streak}
                            </div>
                            <div className="text-[10px] uppercase text-gray-400 tracking-wider">Streak</div>
                          </div>
                          <div className="text-center flex-1">
                            <div className="text-lg font-black text-emerald-600 flex items-center justify-center gap-1">
                              <Medal className="w-4 h-4" /> 100
                            </div>
                            <div className="text-[10px] uppercase text-gray-400 tracking-wider">Points</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 overflow-hidden"
          >
            <div className="p-6 sm:p-7 border-b border-gray-50 bg-gradient-to-r from-amber-50/50 via-yellow-50/50 to-rose-50/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                      <Crown className="w-6 h-6" />
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-sparkle" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">Achievements Showcase</h3>
                    <p className="text-sm text-gray-500">{achievements.length} milestones unlocked</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-amber-200 shadow-sm">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{achievements.length * 50} XP earned</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {achievements.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                    <Award className="w-10 h-10 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-1">No achievements yet</h4>
                  <p className="text-sm text-gray-500">Complete challenges to unlock shiny badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {achievements.map((ach, i) => (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, scale: 0.8, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, type: 'spring', stiffness: 180 }}
                      whileHover={{ scale: 1.08, y: -4 }}
                      className="relative group"
                    >
                      <motion.div
                        animate={{ rotate: [0, 1, -1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
                        className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-amber-200 via-yellow-200 to-orange-200 opacity-40 blur opacity-0 group-hover:opacity-70 transition-opacity"
                      />
                      <div className="relative p-5 rounded-3xl bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/30 border-2 border-amber-200/50 text-center shadow-sm group-hover:shadow-lg transition-shadow">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          {achIconMap[ach.icon] || <Trophy className="w-8 h-8" />}
                        </div>
                        <h4 className="font-black text-gray-800 text-sm leading-tight mb-1.5 line-clamp-2 min-h-[2.5em]">{ach.name}</h4>
                        <p className="text-[10px] text-gray-500 leading-tight line-clamp-2 mb-2 min-h-[2em]">{ach.description}</p>
                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" />
                          +50 XP
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Locked slots */}
                  {Array.from({ length: Math.max(0, 6 - achievements.length) }).map((_, i) => (
                    <motion.div
                      key={`locked-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="relative p-5 rounded-3xl bg-gray-50/80 border-2 border-dashed border-gray-200 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <div className="h-3 w-20 mx-auto bg-gray-100 rounded-full mb-1.5" />
                      <div className="h-2 w-16 mx-auto bg-gray-100 rounded-full mb-2" />
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Locked</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* New Challenge Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', stiffness: 250, damping: 25 }}
              className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-full sm:max-w-md max-h-[100vh] sm:max-h-[90vh] overflow-y-auto z-50 bg-white sm:rounded-3xl sm:shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800">✨ Custom Challenge</h2>
                    <p className="text-gray-500 mt-1 text-sm">Create your own wellness goal</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-5 mb-7">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Challenge Name</label>
                    <input
                      type="text"
                      value={newChallengeName}
                      onChange={(e) => setNewChallengeName(e.target.value)}
                      placeholder="e.g., 10,000 Steps Daily"
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white font-medium transition-all"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Quick Templates</p>
                    <div className="space-y-2">
                      {[
                        { name: '💧 14-Day Hydration Boost', color: 'from-cyan-400 to-blue-500' },
                        { name: '🧘 30-Day Mindful Movement', color: 'from-emerald-400 to-teal-500' },
                        { name: '😴 7-Day Sleep Reset', color: 'from-indigo-400 to-purple-500' },
                      ].map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewChallengeName(t.name.replace(/^\p{Emoji}\s*/u, ''))}
                          className={`w-full p-4 rounded-2xl border-2 border-transparent hover:border-amber-200 bg-gradient-to-r bg-clip-padding flex items-center gap-3 transition-all ${
                            newChallengeName === t.name.replace(/^\p{Emoji}\s*/u, '') ? 'ring-2 ring-amber-400' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-gray-700 text-left">{t.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartCustom}
                    disabled={!newChallengeName.trim()}
                    className="flex-[2] py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-2xl font-black shadow-xl shadow-amber-200/50 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🚀 Start Challenge
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
