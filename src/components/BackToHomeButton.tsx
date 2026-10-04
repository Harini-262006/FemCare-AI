import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

interface BackToHomeButtonProps {
  className?: string;
  showText?: boolean;
  alwaysShowTextOnMobile?: boolean;
  isFixedTopLeft?: boolean;
}

export default function BackToHomeButton({
  className = '',
  showText = true,
  alwaysShowTextOnMobile = true,
  isFixedTopLeft = false,
}: BackToHomeButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      navigate('/home');
    } catch {
      window.location.href = '/home';
    }
  };

  const fixedStyles = isFixedTopLeft
    ? 'fixed top-3 left-3 sm:top-4 sm:left-4 z-[50] shadow-2xl border-2'
    : 'relative z-30';

  return (
    <AnimatePresence mode="wait">
      <motion.button
        type="button"
        initial={{ opacity: 0, x: -10, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -10 }}
        whileHover={{ scale: 1.04, x: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleBack}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBack();
          }
        }}
        tabIndex={0}
        aria-label="Back to Home"
        className={`group inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-pink-500 dark:hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all duration-200 ${fixedStyles} ${className}`}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ x: [0, -2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors stroke-[2.5]" />
          </motion.div>
          
          {showText && (
            <span
              className={`text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors tracking-tight ${
                alwaysShowTextOnMobile ? '' : 'hidden sm:inline'
              }`}
            >
              Back to
            </span>
          )}

          <div className="flex items-center gap-1">
            <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-pink-500 dark:text-pink-400 group-hover:scale-110 transition-transform" />
            {showText && (
              <span
                className={`text-xs sm:text-sm font-black bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 dark:from-pink-400 dark:via-rose-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:opacity-90 transition-all ${
                  alwaysShowTextOnMobile ? '' : 'hidden sm:inline'
                }`}
              >
                Home
              </span>
            )}
          </div>
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
