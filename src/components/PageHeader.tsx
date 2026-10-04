import { motion } from 'framer-motion';
import BackToHomeButton from './BackToHomeButton';
import { NotificationBell } from './NotificationBell';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  subtitleIcon?: React.ReactNode;
  subtitleIconClassName?: string;
  className?: string;
  hideBack?: boolean;
  hideBell?: boolean;
  extra?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  subtitleIcon,
  subtitleIconClassName = 'text-primary-500',
  className = '',
  hideBack = false,
  hideBell = false,
  extra,
}: PageHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4 ${className}`}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        {!hideBack && <BackToHomeButton alwaysShowTextOnMobile={false} />}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-800 via-primary-700 to-orange-600 bg-clip-text text-transparent break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 mt-1 flex items-center gap-1 text-sm sm:text-base">
              {subtitleIcon && (
                <span className={`inline-flex ${subtitleIconClassName}`}>
                  {subtitleIcon}
                </span>
              )}
              <span className="break-words">{subtitle}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {extra && <motion.div layout>{extra}</motion.div>}
        {!hideBell && <NotificationBell />}
      </div>
    </div>
  );
}
