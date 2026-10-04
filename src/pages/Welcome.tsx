
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Users, ArrowRight, Sparkles, Activity, Dumbbell, Droplets, ChevronRight } from 'lucide-react'

const slides = [
  {
    icon: <Heart className="w-10 h-10" />,
    title: 'Personalized Health Care',
    description: 'Get tailored healthcare recommendations based on your unique health profile, goals, and lifestyle.',
    features: [
      { icon: <Activity className="w-4 h-4" />, text: 'Smart health tracking' },
      { icon: <Droplets className="w-4 h-4" />, text: 'Daily reminders' },
      { icon: <Dumbbell className="w-4 h-4" />, text: 'Fitness & nutrition plans' },
    ],
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    lightBg: 'from-pink-50 to-rose-50',
  },
  {
    icon: <MessageCircle className="w-10 h-10" />,
    title: 'Your AI Health Assistant',
    description: 'Chat with our intelligent FemCare AI assistant for instant health advice, 24/7 support, and personalized guidance.',
    features: [
      { icon: <Sparkles className="w-4 h-4" />, text: '24/7 instant answers' },
      { icon: <Heart className="w-4 h-4" />, text: 'Women\'s health expert' },
      { icon: <MessageCircle className="w-4 h-4" />, text: 'Remembers your history' },
    ],
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    lightBg: 'from-violet-50 to-purple-50',
  },
  {
    icon: <Users className="w-10 h-10" />,
    title: 'Connect With Doctors',
    description: 'Book appointments and consult with certified specialist doctors from the comfort of your home.',
    features: [
      { icon: <Users className="w-4 h-4" />, text: 'Certified specialists' },
      { icon: <ArrowRight className="w-4 h-4" />, text: 'Video consultations' },
      { icon: <Activity className="w-4 h-4" />, text: 'Easy appointment booking' },
    ],
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    lightBg: 'from-sky-50 to-blue-50',
  },
]

export default function Welcome() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()
  const slide = slides[currentSlide]

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      navigate('/login')
    }
  }
  const goToSlide = (i: number) => setCurrentSlide(i)
  const skip = () => navigate('/login')

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      {/* Decorative blobs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-0 right-0 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl -z-10"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -z-10"
      />

      {/* Top bar */}
      <div className="relative z-10 px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-xl">🌸</span>
          </div>
          <span className="font-black text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            FemCare
          </span>
        </div>
        <button
          onClick={skip}
          className="px-4 py-2 rounded-xl font-semibold text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-lg w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Icon showcase */}
              <div className={`relative mx-auto w-full aspect-square max-w-sm mb-8 rounded-[3rem] bg-gradient-to-br ${slide.gradient} p-1 shadow-2xl`}>
                <div className={`w-full h-full rounded-[2.8rem] bg-gradient-to-br ${slide.lightBg} flex items-center justify-center relative overflow-hidden`}>
                  {/* Decorative rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-4/5 h-4/5 rounded-full border-2 border-dashed border-white/50"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-3/5 h-3/5 rounded-full border border-white/70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                      className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${slide.gradient} text-white flex items-center justify-center shadow-2xl`}
                      style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="scale-125"
                      >
                        {slide.icon}
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Floating badges */}
                  {slide.features.map((f, i) => {
                    const positions = [
                      { top: '8%', left: '8%' },
                      { top: '15%', right: '6%' },
                      { bottom: '12%', left: '20%' },
                    ]
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
                        className="absolute bg-white backdrop-blur-sm rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2"
                        style={positions[i]}
                      >
                        <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center text-white`}>
                          {f.icon}
                        </div>
                        <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{f.text}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Text */}
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-md border border-gray-100 mb-5"
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center text-white`}>
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">
                    Step {currentSlide + 1} of {slides.length}
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-md mx-auto"
                >
                  {slide.description}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 px-6 sm:px-8 pb-10">
        <div className="max-w-lg mx-auto">
          {/* Dots */}
          <div className="flex justify-center gap-2.5 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="focus:outline-none"
                aria-label={`Go to slide ${index + 1}`}
              >
                <motion.div
                  animate={{
                    width: index === currentSlide ? 44 : 10,
                    backgroundColor: index === currentSlide ? 'transparent' : undefined,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className={`h-2.5 rounded-full overflow-hidden ${
                    index === currentSlide ? 'p-[1px]' : 'bg-gray-200'
                  }`}
                >
                  {index === currentSlide && (
                    <motion.div
                      animate={{ x: ['-100%', '0%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className={`w-full h-full rounded-full bg-gradient-to-r ${slide.gradient}`}
                    />
                  )}
                </motion.div>
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(currentSlide - 1)}
                className="sm:flex-1 py-4 px-6 rounded-2xl font-bold text-gray-700 bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={nextSlide}
              className={`flex-1 py-4 px-8 rounded-2xl font-black text-white shadow-xl bg-gradient-to-r ${slide.gradient} hover:shadow-2xl transition-all flex items-center justify-center gap-2`}
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  Start Your Journey
                  <Sparkles className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>

          {/* Already have account */}
          <p className="text-center mt-6 text-sm text-gray-500 font-medium">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2 decoration-primary-200"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
