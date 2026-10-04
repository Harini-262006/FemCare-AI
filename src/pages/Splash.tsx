
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Flower2 } from 'lucide-react'
import { useAppStore } from '@/store'

export default function Splash() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate('/home')
      } else {
        navigate('/welcome')
      }
    }, 2800)
    return () => clearTimeout(timer)
  }, [navigate, user])

  const iconVariants = {
    initial: { scale: 0, rotate: -30, opacity: 0 },
    animate: (i: number) => ({
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        delay: 0.2 + i * 0.15,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      },
    }),
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex items-center justify-center">
      {/* Animated decorative blobs */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-300/30 rounded-full blur-3xl -z-0 animate-float"
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        className="absolute bottom-0 -left-20 w-[450px] h-[450px] bg-purple-300/30 rounded-full blur-3xl -z-0 animate-float"
        style={{ animationDelay: '2s' }}
      />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.6 }}
        className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl -z-0"
      />

      {/* Sparkles */}
      {[
        { top: '15%', left: '15%', delay: 0.5 },
        { top: '25%', right: '20%', delay: 0.9 },
        { bottom: '30%', left: '25%', delay: 1.3 },
        { bottom: '20%', right: '15%', delay: 1.7 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: pos.delay, duration: 0.5 }}
          className="absolute animate-sparkle"
          style={{ top: pos.top, left: pos.left, right: (pos as any).right, bottom: (pos as any).bottom }}
        >
          <Sparkles className="w-6 h-6 text-pink-400" />
        </motion.div>
      ))}

      <div className="relative z-10 text-center px-8">
        {/* Orbiting icons */}
        <div className="relative w-52 h-52 sm:w-64 sm:h-64 mx-auto mb-10">
          {/* Orbiting ring */}
          <motion.div
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-pink-300/40"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-6 rounded-full border border-purple-300/30"
          />

          {/* Floating icons */}
          <motion.div
            custom={0}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-pink-200/50"
          >
            <Heart className="w-7 h-7 fill-current" />
          </motion.div>

          <motion.div
            custom={1}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            className="absolute top-6 -right-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-purple-200/50 rotate-12"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>

          <motion.div
            custom={2}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            className="absolute bottom-4 -right-2 w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-200/50 -rotate-12"
            style={{ width: '3rem', height: '3rem' }}
          >
            <Flower2 className="w-6 h-6" />
          </motion.div>

          {/* Center logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.4,
              type: 'spring',
              stiffness: 220,
              damping: 18,
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-pink-400 via-rose-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-rose-300/40"
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    className="text-6xl sm:text-7xl mb-1"
                  >
                    🌸
                  </motion.span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Text */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
        >
          <motion.h1
            className="text-5xl sm:text-7xl font-black tracking-tight mb-3 bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent pb-1"
            animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
            style={{ backgroundSize: '200%' }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            FemCare AI
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 100 }}
            className="text-lg sm:text-xl text-gray-600 font-medium tracking-wide"
          >
            Your Personal Healthcare Assistant
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, type: 'spring', stiffness: 100 }}
            className="mt-4 flex items-center justify-center gap-2 text-sm text-pink-500 font-semibold"
          >
            <Sparkles className="w-4 h-4 animate-sparkle" />
            Powered by Women's Health Intelligence
            <Sparkles className="w-4 h-4 animate-sparkle" style={{ animationDelay: '0.5s' }} />
          </motion.div>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-12 flex items-center justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className={`w-3 h-3 rounded-full ${
                ['bg-pink-400', 'bg-rose-500', 'bg-purple-500'][i]
              } shadow-md`}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
