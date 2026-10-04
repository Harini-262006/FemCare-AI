import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, LogOut, Moon, Sun, Bell,
  Calendar, Shield, Palette, Database,
  ChevronRight, Edit3, FileText, Activity, Heart,
  Smartphone, Mail, Volume2, Clock,
  Sparkles, Stethoscope, Video, AudioLines,
  MapPinHouse, Lock, SmartphoneCharging, Monitor,
  Eye, EyeOff, Trash2, Download, RefreshCw,
  AlertTriangle, X, Check, Settings2, Zap, Cookie, FileOutput,
  Clock3, Languages, Info,
  ChevronDown, Star, Brain, MessageCircle,
  Send, AlignJustify,
  AlertOctagon, ShieldCheck, Fingerprint, ShieldAlert,
  Music, Camera, Users, Share2,
  Save
} from 'lucide-react';
import { useAppStore, useProfile, type ThemeType } from '../store';
import { useTheme } from '../hooks/useTheme';

type AccordionKey = 'profile' | 'notifications' | 'reminders' | 'ai' | 'doctor' | 'privacy' | 'security' | 'appearance' | 'data' | 'about';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 220, damping: 22 },
  },
};

function AnimatedToggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
        enabled
          ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500'
          : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center ${
          enabled ? 'left-7' : 'left-0.5'
        }`}
      >
        {enabled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500"
          />
        )}
      </motion.div>
    </motion.button>
  );
}

function SettingRow({
  icon,
  label,
  description,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0 text-pink-600 dark:text-pink-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
  if (onClick) {
    return (
      <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="w-full text-left">
        {content}
      </motion.button>
    );
  }
  return content;
}

function SectionCard({
  title,
  subtitle,
  icon,
  gradient,
  accordionKey,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  accordionKey: AccordionKey;
  isOpen: boolean;
  onToggle: (k: AccordionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="backdrop-blur-2xl bg-white/60 dark:bg-gray-900/40 border border-white/40 dark:border-gray-700/40 rounded-3xl shadow-xl shadow-pink-100/50 dark:shadow-black/20 overflow-hidden"
    >
      <motion.button
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        onClick={() => onToggle(accordionKey)}
        className="w-full flex items-center gap-3 p-5 text-left"
      >
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 bg-gradient-to-r from-pink-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: ((v: T) => void) | React.Dispatch<React.SetStateAction<T>>;
}) {
  const handleChange = (v: T) => {
    (onChange as (v: T) => void)(v);
  };
  return (
    <div className="relative inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 w-full">
      <div className="absolute inset-y-1 left-1 w-[calc(100%-0.5rem)]">
        <motion.div
          layoutId={`segmented-bg-${options.map(o => o.value).join('-')}`}
          className="absolute h-full rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 shadow-lg"
          style={{
            width: `calc(${(100 / options.length).toFixed(4)}% - 0.25rem)`,
            left: `${(options.findIndex(o => o.value === value) * (100 / options.length)).toFixed(4)}%`,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      </div>
      <div className="relative flex w-full">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value as T)}
            className="flex-1 relative z-10 py-2 text-sm font-semibold transition-colors"
          >
            <span className={value === opt.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  danger,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md backdrop-blur-2xl rounded-3xl shadow-2xl p-6 border ${
            danger
              ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/40'
              : 'bg-white/90 dark:bg-gray-900/80 border-white/40 dark:border-gray-700/40'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${danger ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-100'}`}>
              {title}
            </h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const themes: { id: ThemeType; name: string; gradient: string; emoji: string; colors: string[] }[] = [
  { id: 'cherry-blossom', name: 'Cherry Blossom', gradient: 'from-pink-400 to-rose-500', emoji: '🌸', colors: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#ec4899'] },
  { id: 'fairy-forest', name: 'Fairy Forest', gradient: 'from-emerald-400 to-green-600', emoji: '🌿', colors: ['#d1fae5', '#6ee7b7', '#34d399', '#059669'] },
  { id: 'moonlight-garden', name: 'Moonlight Garden', gradient: 'from-sky-400 to-blue-600', emoji: '🌙', colors: ['#e0f2fe', '#7dd3fc', '#38bdf8', '#2563eb'] },
  { id: 'galaxy-fairy', name: 'Galaxy Fairy', gradient: 'from-purple-500 to-violet-700', emoji: '✨', colors: ['#ede9fe', '#c4b5fd', '#a78bfa', '#7c3aed'] },
  { id: 'crystal-palace', name: 'Crystal Palace', gradient: 'from-slate-400 to-slate-700', emoji: '💎', colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#475569'] },
  { id: 'nature-bloom', name: 'Nature Bloom', gradient: 'from-teal-400 to-cyan-600', emoji: '🌺', colors: ['#ccfbf1', '#5eead4', '#2dd4bf', '#0d9488'] },
];

const accentColors = [
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Emerald', value: '#10b981' },
];

const languages = ['English', 'Español', 'Français', 'Deutsch', 'हिन्दी', '日本語', '中文', 'العربية'];
const hospitals = ['City Women\'s Hospital', 'Healthcare Plus', 'Wellness Center', 'Sunrise Medical', 'Grace Hospital'];
const ringtones = ['Chime', 'Bubble', 'Gentle Bell', 'Nature', 'Soft Ding', 'Fairy Whisper', 'Healing Tone', 'Ocean Breeze'];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logoutUser, theme, setTheme, setProfile, doctors } = useAppStore();
  const profile = useProfile();
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState<Record<AccordionKey, boolean>>({
    profile: true,
    notifications: false,
    reminders: false,
    ai: false,
    doctor: false,
    privacy: false,
    security: false,
    appearance: false,
    data: false,
    about: false,
  });

  const toggleSection = (k: AccordionKey) =>
    setOpenSections(prev => ({ ...prev, [k]: !prev[k] }));

  // 1. PROFILE
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // 2. NOTIFICATION SETTINGS
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [reminderNotif, setReminderNotif] = useState(true);
  const [apptNotif, setApptNotif] = useState(true);
  const [cycleNotif, setCycleNotif] = useState(true);
  const [aiTipsNotif, setAiTipsNotif] = useState(true);

  // 3. REMINDER SETTINGS
  const [defaultReminderTime, setDefaultReminderTime] = useState('08:00');
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [vibrateOn, setVibrateOn] = useState(true);
  const [customRingtone, setCustomRingtone] = useState('Chime');

  // 4. AI SETTINGS
  const [aiPersona, setAiPersona] = useState<'Friendly' | 'Professional' | 'Caring'>('Friendly');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [clearChatConfirm, setClearChatConfirm] = useState(false);

  // 5. DOCTOR SETTINGS
  const [preferredDoctor, setPreferredDoctor] = useState(doctors[0]?.id || '1');
  const [preferredHospital, setPreferredHospital] = useState(hospitals[0]);
  const [consultationReminder, setConsultationReminder] = useState(true);

  // 6. PRIVACY
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  // 7. SECURITY
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // 8. APPEARANCE
  const [fontSize, setFontSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [accentColor, setAccentColor] = useState(accentColors[0].value);

  // 9. DATA
  const [backupOn, setBackupOn] = useState(true);
  const [lastBackup, setLastBackup] = useState('2026-07-28 03:42 AM');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [showExportModal, setShowExportModal] = useState(false);

  // 10. ABOUT + AUTH
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const profileCompletion = (() => {
    if (!profile) return 20;
    const fields = [profile.name, profile.email, profile.mobile, profile.age, profile.bloodGroup, profile.address, profile.height, profile.weight];
    const filled = fields.filter(f => f && String(f) !== '0').length;
    return Math.round((filled / fields.length) * 100);
  })();

  const pwdStrength = (() => {
    let s = 0;
    if (newPwd.length >= 8) s++;
    if (/[A-Z]/.test(newPwd)) s++;
    if (/[a-z]/.test(newPwd)) s++;
    if (/\d/.test(newPwd)) s++;
    if (/[^A-Za-z0-9]/.test(newPwd)) s++;
    return s;
  })();
  const pwdColors = ['bg-gray-300', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-emerald-500'];
  const pwdLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  const handleLogout = () => {
    logoutUser();
    navigate('/welcome');
  };

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const now = new Date();
      setLastBackup(now.toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }));
      setIsBackingUp(false);
    }, 2000);
  };

  const fontSizeValue = fontSize === 'Small' ? 0 : fontSize === 'Medium' ? 1 : 2;
  const setFontSizeFromSlider = (val: number) => {
    setFontSize(val === 0 ? 'Small' : val === 1 ? 'Medium' : 'Large');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-pink-200 via-purple-100 to-teal-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 -z-10" />
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed top-10 -left-32 w-96 h-96 rounded-full bg-pink-400/30 blur-3xl -z-10"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="fixed bottom-10 -right-32 w-[28rem] h-[28rem] rounded-full bg-purple-400/30 blur-3xl -z-10"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="fixed top-1/3 right-1/4 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl -z-10"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <BackToHomeButton />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize your FemCare AI experience</p>
          </div>
          <Settings2 className="w-6 h-6 text-purple-500" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* PROFILE HEADER CARD */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/60 dark:bg-gray-900/40 border border-white/40 dark:border-gray-700/40 shadow-2xl shadow-pink-200/50 dark:shadow-black/30"
          >
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400 opacity-70" />
            <div className="relative p-6 pt-8">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-extrabold bg-gradient-to-br from-pink-500 to-purple-600 bg-clip-text text-transparent">
                          {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAvatarUpload}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-lg"
                  >
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </motion.button>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white dark:border-gray-900 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </motion.div>
                </div>
                <div className="flex-1 pt-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{user?.name || 'Guest User'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {user?.email || 'no-email@example.com'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Profile Completion</span>
                  <span className="text-sm font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{profileCompletion}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/profile')}
                className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 text-white font-bold shadow-lg shadow-purple-300/50 dark:shadow-purple-900/50 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4.5 h-4.5" />
                Go to Profile
              </motion.button>
            </div>
          </motion.div>

          {/* 1. PROFILE SETTINGS */}
          <SectionCard
            title="Profile Settings"
            subtitle="Personal info & preferences"
            icon={<User className="w-5 h-5" />}
            gradient="from-pink-400 to-rose-500"
            accordionKey="profile"
            isOpen={openSections.profile}
            onToggle={toggleSection}
          >
            <SettingRow
              icon={<User className="w-5 h-5" />}
              label="Edit Name & Email"
              description={user ? `${user.name} • ${user.email}` : 'Update your details'}
              onClick={() => navigate('/profile')}
              right={<ChevronRight className="w-5 h-5 text-gray-400" />}
            />
            <SettingRow
              icon={<Camera className="w-5 h-5" />}
              label="Upload Photo"
              description="Set or change your profile picture"
              onClick={handleAvatarUpload}
              right={<ChevronRight className="w-5 h-5 text-gray-400" />}
            />
            <SettingRow
              icon={<Activity className="w-5 h-5" />}
              label="Medical History"
              description="Conditions, surgeries, allergies"
              onClick={() => navigate('/profile')}
              right={
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); navigate('/health-reports'); }}
                    className="px-3 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Records
                  </motion.button>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              }
            />
            <SettingRow
              icon={<Heart className="w-5 h-5" />}
              label="Women's Health"
              description="Cycle tracking, pregnancy, PCOS"
              onClick={() => navigate('/cycle-tracker')}
              right={<ChevronRight className="w-5 h-5 text-gray-400" />}
            />
          </SectionCard>

          {/* 2. NOTIFICATION SETTINGS */}
          <SectionCard
            title="Notification Settings"
            subtitle="Alerts & delivery channels"
            icon={<Bell className="w-5 h-5" />}
            gradient="from-orange-400 to-pink-500"
            accordionKey="notifications"
            isOpen={openSections.notifications}
            onToggle={toggleSection}
          >
            <div className="space-y-1 mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 pt-2 pb-1">Channels</p>
              <SettingRow icon={<Smartphone className="w-5 h-5" />} label="Push Notifications" description="Alerts on your device" right={<AnimatedToggle enabled={pushNotif} onChange={setPushNotif} />} />
              <SettingRow icon={<Mail className="w-5 h-5" />} label="Email Notifications" description="Updates to your inbox" right={<AnimatedToggle enabled={emailNotif} onChange={setEmailNotif} />} />
              <SettingRow icon={<Volume2 className="w-5 h-5" />} label="Chat Sounds" description="Sound for incoming messages" right={<AnimatedToggle enabled={chatSounds} onChange={setChatSounds} />} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 pt-2 pb-1">Alert Types</p>
              <SettingRow icon={<Clock className="w-5 h-5" />} label="Reminder Alerts" description="Medicine, water, sleep" right={<AnimatedToggle enabled={reminderNotif} onChange={setReminderNotif} />} />
              <SettingRow icon={<Calendar className="w-5 h-5" />} label="Appointment Alerts" description="Booking & confirmations" right={<AnimatedToggle enabled={apptNotif} onChange={setApptNotif} />} />
              <SettingRow icon={<Heart className="w-5 h-5" />} label="Cycle Alerts" description="Period & fertility tracking" right={<AnimatedToggle enabled={cycleNotif} onChange={setCycleNotif} />} />
              <SettingRow icon={<Sparkles className="w-5 h-5" />} label="AI Health Tips" description="Daily wellness suggestions" right={<AnimatedToggle enabled={aiTipsNotif} onChange={setAiTipsNotif} />} />
            </div>
          </SectionCard>

          {/* 3. REMINDER SETTINGS */}
          <SectionCard
            title="Reminder Settings"
            subtitle="Timing & behavior"
            icon={<Clock3 className="w-5 h-5" />}
            gradient="from-amber-400 to-orange-500"
            accordionKey="reminders"
            isOpen={openSections.reminders}
            onToggle={toggleSection}
          >
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Default Reminder Time
              </label>
              <input
                type="time"
                value={defaultReminderTime}
                onChange={e => setDefaultReminderTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center text-pink-600 dark:text-pink-300">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">Snooze Duration</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Time before reminder repeats</p>
                  </div>
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{snoozeDuration} min</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={snoozeDuration}
                onChange={e => setSnoozeDuration(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 accent-pink-500"
              />
            </div>
            <SettingRow
              icon={<SmartphoneCharging className="w-5 h-5" />}
              label="Vibrate"
              description="Haptic feedback for alerts"
              right={<AnimatedToggle enabled={vibrateOn} onChange={setVibrateOn} />}
            />
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Music className="w-4 h-4" /> Custom Ringtone
              </label>
              <select
                value={customRingtone}
                onChange={e => setCustomRingtone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {ringtones.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </SectionCard>

          {/* 4. AI SETTINGS */}
          <SectionCard
            title="AI Settings"
            subtitle="Your FemCare AI companion"
            icon={<Brain className="w-5 h-5" />}
            gradient="from-purple-500 to-violet-600"
            accordionKey="ai"
            isOpen={openSections.ai}
            onToggle={toggleSection}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-700/30 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Your AI Companion</p>
                  <p className="text-xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                    FemCare AI
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">AI Persona Tone</p>
              <SegmentedControl
                value={aiPersona}
                onChange={setAiPersona}
                options={[
                  { value: 'Friendly', label: '😊 Friendly' },
                  { value: 'Professional', label: '💼 Pro' },
                  { value: 'Caring', label: '💗 Caring' },
                ] as const}
              />
            </div>

            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-4 h-4" /> AI Language
              </label>
              <select
                value={aiLanguage}
                onChange={e => setAiLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {languages.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <SettingRow
              icon={<Zap className="w-5 h-5" />}
              label="AI Suggestions"
              description="Proactive smart suggestions"
              right={<AnimatedToggle enabled={aiSuggestions} onChange={setAiSuggestions} />}
            />

            <div className="p-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setClearChatConfirm(true)}
                className="w-full py-3 rounded-2xl border-2 border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 font-semibold flex items-center justify-center gap-2 hover:bg-orange-100/70"
              >
                <Trash2 className="w-4.5 h-4.5" />
                Clear AI Chat History
              </motion.button>
            </div>
          </SectionCard>

          {/* 5. DOCTOR SETTINGS */}
          <SectionCard
            title="Doctor Settings"
            subtitle="Preferred care providers"
            icon={<Stethoscope className="w-5 h-5" />}
            gradient="from-teal-400 to-cyan-500"
            accordionKey="doctor"
            isOpen={openSections.doctor}
            onToggle={toggleSection}
          >
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Preferred Doctor
              </label>
              <select
                value={preferredDoctor}
                onChange={e => setPreferredDoctor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                ))}
              </select>
            </div>
            <div className="p-3 pt-1">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <MapPinHouse className="w-4 h-4" /> Preferred Hospital
              </label>
              <select
                value={preferredHospital}
                onChange={e => setPreferredHospital(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {hospitals.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <SettingRow
              icon={<Calendar className="w-5 h-5" />}
              label="Consultation Reminders"
              description="Alerts before appointments"
              right={<AnimatedToggle enabled={consultationReminder} onChange={setConsultationReminder} />}
            />
            <div className="p-3 pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Consultation Type</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'In-clinic', icon: <MapPinHouse className="w-5 h-5" />, label: 'In-Clinic' },
                  { v: 'Video', icon: <Video className="w-5 h-5" />, label: 'Video' },
                  { v: 'Audio', icon: <AudioLines className="w-5 h-5" />, label: 'Audio' },
                ] as const).map((opt, i) => (
                  <motion.button
                    key={opt.v}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {}}
                    className={`py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
                      i === 1
                        ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* 6. PRIVACY */}
          <SectionCard
            title="Privacy"
            subtitle="Data & visibility control"
            icon={<EyeOff className="w-5 h-5" />}
            gradient="from-sky-400 to-indigo-500"
            accordionKey="privacy"
            isOpen={openSections.privacy}
            onToggle={toggleSection}
          >
            <SettingRow
              icon={<Users className="w-5 h-5" />}
              label="Profile Visibility"
              description="Others can see your profile"
              right={<AnimatedToggle enabled={profileVisibility} onChange={setProfileVisibility} />}
            />
            <SettingRow
              icon={<MessageCircle className="w-5 h-5" />}
              label="Read Receipts"
              description="Show when you've read messages"
              right={<AnimatedToggle enabled={readReceipts} onChange={setReadReceipts} />}
            />
            <SettingRow
              icon={<Activity className="w-5 h-5" />}
              label="Activity Status"
              description="Show when you're online"
              right={<AnimatedToggle enabled={activityStatus} onChange={setActivityStatus} />}
            />
            <SettingRow
              icon={<Share2 className="w-5 h-5" />}
              label="Data Sharing (Medical Research)"
              description="Anonymized data for research"
              right={<AnimatedToggle enabled={dataSharing} onChange={setDataSharing} />}
            />
          </SectionCard>

          {/* 7. SECURITY */}
          <SectionCard
            title="Security"
            subtitle="Password & account protection"
            icon={<ShieldCheck className="w-5 h-5" />}
            gradient="from-emerald-400 to-teal-500"
            accordionKey="security"
            isOpen={openSections.security}
            onToggle={toggleSection}
          >
            <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 space-y-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Change Password</p>
              <div>
                <div className="relative">
                  <input
                    type={showOldPwd ? 'text' : 'password'}
                    value={oldPwd}
                    onChange={e => setOldPwd(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button onClick={() => setShowOldPwd(s => !s)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button onClick={() => setShowNewPwd(s => !s)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              {newPwd && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`h-2 flex-1 rounded-full transition-colors ${i <= pwdStrength ? pwdColors[pwdStrength] : 'bg-gray-200 dark:bg-gray-700'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${pwdStrength <= 2 ? 'text-orange-500' : pwdStrength <= 3 ? 'text-yellow-600' : 'text-emerald-500'}`}>
                    {pwdLabels[pwdStrength]}
                  </p>
                </motion.div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Update Password
              </motion.button>
            </div>

            <SettingRow
              icon={<Lock className="w-5 h-5" />}
              label="Two-Factor Authentication"
              description="Extra layer of security"
              right={
                twoFA ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> On
                  </span>
                ) : (
                  <AnimatedToggle enabled={twoFA} onChange={(v) => { if (v) setShow2FAModal(true); else setTwoFA(false); }} />
                )
              }
            />
            <SettingRow
              icon={<Fingerprint className="w-5 h-5" />}
              label="Biometric Login"
              description="Fingerprint / Face ID"
              right={<AnimatedToggle enabled={false} onChange={() => {}} disabled />}
            />

            <div className="p-3 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Login Sessions</p>
              <div className="space-y-2">
                {[
                  { device: 'Chrome on Windows 11', location: 'New York, US', current: true, date: 'Now' },
                  { device: 'Safari on iPhone 15', location: 'New York, US', current: false, date: '2 hours ago' },
                  { device: 'Edge on MacBook Pro', location: 'Boston, US', current: false, date: 'Yesterday' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30"
                  >
                    <Monitor className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.device}</p>
                        {s.current && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.location} • {s.date}</p>
                    </div>
                    {!s.current && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* 8. APPEARANCE */}
          <SectionCard
            title="Appearance"
            subtitle="Themes & visual style"
            icon={<Palette className="w-5 h-5" />}
            gradient="from-fuchsia-500 to-pink-600"
            accordionKey="appearance"
            isOpen={openSections.appearance}
            onToggle={toggleSection}
          >
            <div className="flex items-center justify-between p-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isDark ? 'moon' : 'sun'}
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.4, type: 'spring' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {isDark ? (
                        <Moon className="w-6 h-6 text-indigo-500" />
                      ) : (
                        <Sun className="w-6 h-6 text-amber-500" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{isDark ? 'Good for your eyes at night 🌙' : 'Bright and vibrant ☀️'}</p>
                </div>
              </div>
              <AnimatedToggle enabled={isDark} onChange={toggleTheme} />
            </div>

            <div className="p-3 pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Theme Selection</p>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => (
                  <motion.button
                    key={t.id}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setTheme(t.id)}
                    className={`relative rounded-2xl overflow-hidden p-4 border-2 transition-all ${
                      theme === t.id
                        ? 'border-transparent shadow-2xl ring-4 ring-pink-300/50 dark:ring-pink-500/30'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient}`} />
                    <div className="absolute bottom-1 left-1 right-1 h-1.5 flex gap-0.5 z-10">
                      {t.colors.map((c, i) => (
                        <div key={i} className="flex-1 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="relative z-10 flex flex-col items-center pb-3">
                      <span className="text-2xl mb-1">{t.emoji}</span>
                      <span className="text-[10px] font-bold text-white text-center drop-shadow-md leading-tight">
                        {t.name}
                      </span>
                    </div>
                    {theme === t.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-md z-10"
                      >
                        <Check className="w-3 h-3 text-pink-600" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center text-pink-600 dark:text-pink-300">
                    <AlignJustify className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">Font Size</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Text scale for readability</p>
                  </div>
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{fontSize}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={fontSizeValue}
                onChange={e => setFontSizeFromSlider(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 accent-purple-500"
              />
              <div className="flex justify-between mt-1 px-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                <span>Small</span>
                <span>Medium</span>
                <span>Large</span>
              </div>
            </div>

            <div className="p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Accent Color</p>
              <div className="grid grid-cols-8 gap-2">
                {accentColors.map(c => (
                  <motion.button
                    key={c.value}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAccentColor(c.value)}
                    className={`relative aspect-square rounded-xl shadow-md transition-all ${
                      accentColor === c.value ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''
                    }`}
                    style={{
                      backgroundColor: c.value,
                      boxShadow: accentColor === c.value ? `0 0 0 2px ${c.value}` : 'none',
                    }}
                    title={c.name}
                  >
                    {accentColor === c.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* 9. DATA */}
          <SectionCard
            title="Data"
            subtitle="Backup, export & storage"
            icon={<Database className="w-5 h-5" />}
            gradient="from-cyan-400 to-sky-500"
            accordionKey="data"
            isOpen={openSections.data}
            onToggle={toggleSection}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-950/30 dark:to-sky-950/30 border border-teal-200/50 dark:border-teal-800/30 mb-3 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">Cloud Backup</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last: {lastBackup}</p>
                </div>
                <AnimatedToggle enabled={backupOn} onChange={setBackupOn} />
              </div>
              <motion.button
                whileHover={{ scale: backupOn ? 1.02 : 1 }}
                whileTap={{ scale: backupOn ? 0.98 : 1 }}
                onClick={handleBackupNow}
                disabled={isBackingUp || !backupOn}
                className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  backupOn
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md disabled:opacity-70'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
                {isBackingUp ? 'Backing Up...' : 'Backup Now'}
              </motion.button>
            </div>

            <SettingRow
              icon={<FileOutput className="w-5 h-5" />}
              label="Export Health Data"
              description="CSV or JSON format"
              onClick={() => setShowExportModal(true)}
              right={<Download className="w-5 h-5 text-teal-500" />}
            />

            <SettingRow
              icon={<Cookie className="w-5 h-5" />}
              label="Storage"
              description="245 MB / 1024 MB used"
              right={
                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-[24%] bg-gradient-to-r from-pink-500 to-teal-500 rounded-full" />
                </div>
              }
            />

            <div className="p-3 pt-4">
              <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border-2 border-red-200/60 dark:border-red-800/40">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-red-700 dark:text-red-300">Delete Account</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                      7-day grace period before permanent deletion.
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm1(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-red-300/50 dark:shadow-red-900/50 flex items-center justify-center gap-2"
                >
                  <AlertOctagon className="w-4 h-4" />
                  Delete My Account
                </motion.button>
              </div>
            </div>
          </SectionCard>

          {/* 10. ABOUT */}
          <SectionCard
            title="About"
            subtitle="App info & support"
            icon={<Info className="w-5 h-5" />}
            gradient="from-violet-500 to-purple-600"
            accordionKey="about"
            isOpen={openSections.about}
            onToggle={toggleSection}
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/30 text-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <p className="font-extrabold text-lg bg-gradient-to-r from-pink-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                FemCare AI
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">Version 2.4.1 • Premium Edition</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-1">4.9 (12.4k)</span>
              </div>
            </div>

            <SettingRow
              icon={<FileText className="w-5 h-5" />}
              label="Terms of Service"
              description="Usage agreement"
              right={<ChevronRight className="w-5 h-5 text-gray-400" />}
            />
            <SettingRow
              icon={<Shield className="w-5 h-5" />}
              label="Privacy Policy"
              description="Data protection"
              right={<ChevronRight className="w-5 h-5 text-gray-400" />}
            />
            <SettingRow
              icon={<Send className="w-5 h-5" />}
              label="Contact Support"
              description="24/7 care team"
              right={<ChevronRight className="w-5 h-5 text-gray-400" />}
            />
            <SettingRow
              icon={<Star className="w-5 h-5" />}
              label="Rate Us"
              description="Share your feedback"
              right={
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-0.5"
                    >
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </motion.button>
                  ))}
                </div>
              }
            />

            <div className="p-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 text-white font-bold text-lg shadow-xl shadow-red-300/50 dark:shadow-red-900/50 flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="relative z-10 p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="relative z-10">Log Out</span>
              </motion.button>
            </div>
          </SectionCard>

        </motion.div>
      </div>

      {/* MODALS */}
      <Modal open={clearChatConfirm} onClose={() => setClearChatConfirm(false)} title="Clear Chat History?">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mb-3">
            <Trash2 className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will permanently delete all your AI and doctor chat conversations. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setClearChatConfirm(false)}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setClearChatConfirm(false)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
          >
            Clear All
          </motion.button>
        </div>
      </Modal>

      <Modal open={show2FAModal} onClose={() => setShow2FAModal(false)} title="Set Up 2FA">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Scan the QR code with your authenticator app and enter the 6-digit code below.
          </p>
        </div>
        <div className="w-36 h-36 mx-auto mb-4 rounded-2xl bg-white border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center p-3">
          <div className="grid grid-cols-8 gap-0.5 w-full h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${[0,1,3,5,7,8,11,13,16,18,20,22,25,27,30,32,34,36,39,41,44,46,48,50,53,55,58,60,62].includes(i) ? 'bg-gray-900 dark:bg-gray-100' : 'bg-transparent'}`}
              />
            ))}
          </div>
        </div>
        <input
          placeholder="Enter 6-digit code"
          className="w-full px-4 py-3 mb-4 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
          maxLength={6}
        />
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShow2FAModal(false)}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
          >
            Later
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setTwoFA(true); setShow2FAModal(false); }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold"
          >
            Enable 2FA
          </motion.button>
        </div>
      </Modal>

      <Modal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Log Out?" danger>
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to log out? You'll need to sign in again to access your account.
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 py-3 rounded-xl bg-white/70 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700"
          >
            Stay Logged In
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold"
          >
            Log Out
          </motion.button>
        </div>
      </Modal>

      <Modal open={showDeleteConfirm1} onClose={() => setShowDeleteConfirm1(false)} title="Delete Account?" danger>
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-3">
            <AlertOctagon className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2 text-left w-full">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You are about to <span className="font-bold text-red-600 dark:text-red-400">permanently delete</span> your FemCare AI account. This will:
            </p>
            <ul className="text-xs space-y-1.5 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Delete all your health records and data
              </li>
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> Remove all appointments and chats
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">7-day grace period</span> — cancel within 7 days
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteConfirm1(false)}
            className="flex-1 py-3 rounded-xl bg-white/70 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowDeleteConfirm1(false); setShowDeleteConfirm2(true); }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold"
          >
            Continue
          </motion.button>
        </div>
      </Modal>

      <Modal open={showDeleteConfirm2} onClose={() => { setShowDeleteConfirm2(false); setDeleteText(''); }} title="Confirm Deletion" danger>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          To confirm, type <span className="font-mono font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">DELETE</span> below.
        </p>
        <input
          value={deleteText}
          onChange={e => setDeleteText(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="w-full px-4 py-3 mb-4 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowDeleteConfirm2(false); setDeleteText(''); }}
            className="flex-1 py-3 rounded-xl bg-white/70 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-gray-200 dark:border-gray-700"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={deleteText !== 'DELETE'}
            onClick={() => { setShowDeleteConfirm2(false); setDeleteText(''); handleLogout(); }}
            className={`flex-1 py-3 rounded-xl text-white font-bold ${
              deleteText === 'DELETE'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-300/50'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60'
            }`}
          >
            Delete Permanently
          </motion.button>
        </div>
      </Modal>

      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} title="Export Health Data">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Choose a format for your health data export.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { v: 'CSV' as const, icon: <FileText className="w-8 h-8" />, desc: 'Spreadsheet', color: 'from-emerald-400 to-teal-500' },
            { v: 'JSON' as const, icon: <FileOutput className="w-8 h-8" />, desc: 'Machine-readable', color: 'from-violet-400 to-purple-500' },
          ]).map(opt => (
            <motion.button
              key={opt.v}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExportFormat(opt.v)}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                exportFormat === opt.v
                  ? 'border-transparent shadow-xl'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {exportFormat === opt.v && (
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${opt.color} opacity-10`} />
              )}
              <div className={`w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center text-white shadow-md`}>
                {opt.icon}
              </div>
              <p className="font-extrabold text-gray-800 dark:text-gray-100">{opt.v}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              {exportFormat === opt.v && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md"
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExportModal(false)}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold"
          >
            Cancel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExportModal(false)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export {exportFormat}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
