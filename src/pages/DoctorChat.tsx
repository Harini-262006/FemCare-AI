
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import {
  ArrowLeft, Send, User, Stethoscope, Paperclip, X,
  Search, Phone, Video, MoreVertical, Smile, Mic,
  MicOff, Image as ImageIcon, FileText, Pill, FileSpreadsheet,
  Upload, Check, CheckCheck, Clock, Circle, Heart, Star,
  Shield, ChevronDown, Camera, MapPin, Calendar, Users,
  Volume2, VolumeX, VideoOff, UserPlus, Pause, Grid3X3,
  Download, Printer, Share2, Sparkles, Bookmark, BookmarkCheck,
  Forward, Reply, SearchX, Settings, Palette, ImagePlus, Plus,
  MonitorPlay, PhoneCall, PhoneOff, RefreshCcw, MessageCircle,
  Eye, Filter, LogIn, LogOut, ChevronRight, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doctorAPI } from '../services/api';
import { Doctor, useAppStore } from '../store';
import { getSocket, registerSocketUser } from '../services/socket';
import { CallOverlay, CallType as WebRTCCallType, CallStatus as WebRTCCallStatus } from '../components/CallOverlay';

interface DoctorAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  kind?: 'prescription' | 'report' | 'xray' | 'strip' | 'document' | 'image';
}

interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

interface DoctorMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  content: string;
  attachments?: DoctorAttachment[];
  read: boolean;
  createdAt: Date;
  reactions?: MessageReaction[];
  replyTo?: { _id: string; content: string; senderName: string; senderType: 'patient' | 'doctor' };
  starred?: boolean;
  forwarded?: boolean;
}

type CallType = 'voice' | 'video';
type CallStatus = 'incoming' | 'outgoing' | 'active' | 'ended';
type CallDirection = 'incoming' | 'outgoing' | 'missed';

interface CallLogEntry {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  type: CallType;
  direction: CallDirection;
  date: Date;
  duration: number;
}

interface Wallpaper {
  id: string;
  name: string;
  style: React.CSSProperties;
}

const attachmentOptions = [
  { key: 'image', label: 'Image', icon: <ImageIcon className="w-5 h-5" />, gradient: 'from-pink-500 to-rose-500', accept: 'image/*', kind: 'image' as const },
  { key: 'document', label: 'Document', icon: <FileText className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-500', accept: 'application/pdf,.doc,.docx,.txt', kind: 'document' as const },
  { key: 'prescription', label: 'Prescription', icon: <Pill className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', accept: 'image/*,application/pdf', kind: 'prescription' as const },
  { key: 'report', label: 'Blood Report', icon: <FileSpreadsheet className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', accept: 'image/*,application/pdf', kind: 'report' as const },
  { key: 'xray', label: 'X-Ray / Scan', icon: <Upload className="w-5 h-5" />, gradient: 'from-orange-500 to-amber-500', accept: 'image/*,application/pdf', kind: 'xray' as const },
  { key: 'camera', label: 'Camera', icon: <Camera className="w-5 h-5" />, gradient: 'from-cyan-500 to-sky-500', accept: 'image/*', kind: 'image' as const },
];

const EMOJI_CATEGORIES = {
  Smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '🤯', '😎', '🥳'],
  Love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💌', '💐', '🌹', '🌸', '🌷', '🌺', '🌻', '🌼', '🥀', '💑', '💏', '👩‍❤️‍👨', '👩‍❤️‍👩', '👨‍❤️‍👨'],
  Health: ['🩺', '💊', '💉', '🩸', '🦠', '🧫', '🔬', '🧬', '👩‍⚕️', '👨‍⚕️', '🏥', '🚑', '🩹', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😷', '🤰', '🤱', '🍼', '🪥', '🦷', '👓', '🦯', '🧘', '💪', '🏃', '🚶', '🧠', '🦴', '❤️‍🩹'],
  Symbols: ['⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '⚠️', '❓', '❗', '💡', '📌', '📍', '🔔', '🎵', '🎶', '🎉', '🎊', '🏆', '🥇', '📝', '📋', '📎', '📂', '🗂️', '📅', '⏰', '⌚', '💬', '💭', '🗯️', '🔒', '🔐', '🛡️', '♾️', '☮️', '♻️'],
};

const QUICK_REACTIONS = ['👍', '❤️', '😮', '🙏', '😂'];

const GIF_PLACEHOLDERS = [
  { id: '1', emoji: '💕', label: 'Love', bg: 'from-pink-400 to-rose-500' },
  { id: '2', emoji: '🌸', label: 'Happy', bg: 'from-fuchsia-400 to-pink-500' },
  { id: '3', emoji: '💪', label: 'Strong', bg: 'from-violet-400 to-purple-500' },
  { id: '4', emoji: '🙏', label: 'Thanks', bg: 'from-amber-400 to-orange-500' },
  { id: '5', emoji: '🤗', label: 'Hugs', bg: 'from-sky-400 to-blue-500' },
  { id: '6', emoji: '🎉', label: 'Congrats', bg: 'from-emerald-400 to-teal-500' },
  { id: '7', emoji: '😴', label: 'Rest', bg: 'from-indigo-400 to-violet-500' },
  { id: '8', emoji: '💊', label: 'Meds', bg: 'from-cyan-400 to-sky-500' },
  { id: '9', emoji: '☕', label: 'Relax', bg: 'from-orange-400 to-red-500' },
  { id: '10', emoji: '🌙', label: 'Sleep', bg: 'from-blue-400 to-indigo-500' },
];

const WALLPAPERS: Wallpaper[] = [
  { id: 'default', name: 'Soft Blossom', style: { background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 50%, #ecfeff 100%)' } },
  { id: 'lavender', name: 'Lavender Dream', style: { background: 'linear-gradient(135deg, #e9d5ff 0%, #f0abfc 30%, #c4b5fd 70%, #ddd6fe 100%)' } },
  { id: 'teal', name: 'Teal Breeze', style: { background: 'linear-gradient(135deg, #ccfbf1 0%, #5eead4 30%, #67e8f9 70%, #a5f3fc 100%)' } },
  { id: 'peach', name: 'Peach Glow', style: { background: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 30%, #fed7aa 70%, #ffe4e6 100%)' } },
  { id: 'galaxy', name: 'Galaxy Soft', style: { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #831843 100%)' } },
  { id: 'forest', name: 'Forest Calm', style: { background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 30%, #6ee7b7 60%, #d1fae5 100%)' } },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 16 } },
};

export default function DoctorChat() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const storeDoctors = useAppStore((state) => state.doctors);
  const [backendDoctors, setBackendDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await doctorAPI.getDoctors();
        if (data && Array.isArray(data)) {
          const seen = new Set<string>();
          const formatted: Doctor[] = [];
          data.forEach((d: any) => {
            const id = (d._id || d.id || '').toString();
            if (id && !seen.has(id)) {
              seen.add(id);
              formatted.push({
                id,
                name: d.name,
                specialty: d.specialty || d.specialization || 'General Physician',
                experience: d.experience || 5,
                hospital: d.hospital || 'FemCare Health Clinic',
                rating: d.rating || 4.9,
                availableTime: d.availableTime || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
                fees: d.fees || d.consultationFee || 1500,
                online: d.online !== false,
                phone: d.phone || '+91 98765 43210',
                videoLink: d.videoLink || 'https://meet.google.com/new',
              });
            }
          });
          setBackendDoctors(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch backend doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const allDoctors = useMemo(() => {
    return backendDoctors;
  }, [backendDoctors]);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [searchChatList, setSearchChatList] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  const [replyToMessage, setReplyToMessage] = useState<DoctorMessage | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [longPressMsgId, setLongPressMsgId] = useState<string | null>(null);
  const [swipeMsgId, setSwipeMsgId] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStarredDrawer, setShowStarredDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [searchInChat, setSearchInChat] = useState('');
  const [searchHighlightIndex, setSearchHighlightIndex] = useState(0);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(WALLPAPERS[0]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<DoctorMessage | null>(null);
  const [showCallLog, setShowCallLog] = useState(false);
  const [chatListTab, setChatListTab] = useState<'chats' | 'calls'>('chats');
  const [showPrescriptionDrawer, setShowPrescriptionDrawer] = useState(false);

  const [callModal, setCallModal] = useState<{ type: CallType; status: CallStatus } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeaker, setCallSpeaker] = useState(true);
  const [callVideoEnabled, setCallVideoEnabled] = useState(true);
  const [callHeld, setCallHeld] = useState(false);
  const [callEndedSummary, setCallEndedSummary] = useState<{ duration: number; type: CallType } | null>(null);
  const [showKeypad, setShowKeypad] = useState(false);

  // WebRTC Active Call Overlay State
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    callType: 'audio' | 'video';
    initialStatus: WebRTCCallStatus;
    remoteParticipant: { id: string; name: string; role: string; avatar?: string; specialty?: string };
    incomingOffer?: any;
  } | null>(null);

  const [callLog, setCallLog] = useState<CallLogEntry[]>([
    { id: 'c1', doctorId: '1', doctorName: 'Dr. Sarah Johnson', doctorSpecialty: 'Gynecologist', type: 'voice', direction: 'incoming', date: new Date(Date.now() - 1000 * 60 * 30), duration: 245 },
    { id: 'c2', doctorId: '2', doctorName: 'Dr. Maria Garcia', doctorSpecialty: 'Endocrinologist', type: 'video', direction: 'outgoing', date: new Date(Date.now() - 1000 * 60 * 60 * 3), duration: 612 },
    { id: 'c3', doctorId: '1', doctorName: 'Dr. Sarah Johnson', doctorSpecialty: 'Gynecologist', type: 'voice', direction: 'missed', date: new Date(Date.now() - 1000 * 60 * 60 * 5), duration: 0 },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real Socket.IO Registration & Call Listening
  useEffect(() => {
    if (user?.id) {
      registerSocketUser(user.id, 'patient');
      const socket = getSocket();
      const handleIncomingCall = (data: {
        fromUser: { id: string; name: string; role: string; avatar?: string };
        callType: 'audio' | 'video';
        conversationId: string;
        offer: any;
      }) => {
        if (data.fromUser.id === doctorId || data.conversationId === doctorId || !doctorId) {
          setActiveCall({
            isOpen: true,
            callType: data.callType,
            initialStatus: 'incoming',
            remoteParticipant: {
              id: data.fromUser.id,
              name: data.fromUser.name,
              role: 'Doctor',
              specialty: 'Gynecologist',
            },
            incomingOffer: data.offer,
          });
        }
      };

      socket.on('call-incoming', handleIncomingCall);
      return () => {
        socket.off('call-incoming', handleIncomingCall);
      };
    }
  }, [user?.id, doctorId]);

  const handleCallOverlayClose = (durationSeconds: number, summaryText: string) => {
    if (activeCall && doctorId && summaryText) {
      const callMsg: DoctorMessage = {
        _id: `call-${Date.now()}`,
        conversationId: doctorId,
        senderId: user?.id || 'me',
        senderType: 'patient',
        content: `📞 ${summaryText}`,
        read: true,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, callMsg]);
      doctorAPI.sendMessage({
        doctorId,
        content: `📞 ${summaryText}`,
      }).catch(() => {});
    }
    setActiveCall(null);
  };

  const simulateTypingAndResponse = () => {};

  useEffect(() => {
    if (isRecording) {
      setRecordTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } else {
      clearInterval(recordingIntervalRef.current!);
    }
    return () => clearInterval(recordingIntervalRef.current!);
  }, [isRecording]);

  useEffect(() => {
    if (callModal?.status === 'active') {
      callIntervalRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      clearInterval(callIntervalRef.current!);
    }
    return () => clearInterval(callIntervalRef.current!);
  }, [callModal?.status]);

  useEffect(() => {
    if (input.trim().length > 2) {
      // (Real Socket.IO event would be: socket.emit('typing', {doctorId}))
    }
  }, [input, doctorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadConversation = async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await doctorAPI.getConversation(doctorId);
      const formattedDoctor: Doctor = {
        id: data.doctor._id,
        name: data.doctor.name,
        specialty: data.doctor.specialty,
        experience: data.doctor.experience,
        hospital: data.doctor.hospital,
        rating: data.doctor.rating,
        availableTime: data.doctor.availableTime,
        fees: data.doctor.fees,
        online: data.doctor.online,
        phone: data.doctor.phone,
        videoLink: data.doctor.videoLink,
      };
      const formattedMessages: DoctorMessage[] = data.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        reactions: msg.reactions || [],
      }));
      setDoctor(formattedDoctor);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      const fallbackDoctor = allDoctors.find((d) => d.id === doctorId);
      if (fallbackDoctor) setDoctor(fallbackDoctor);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
    const interval = setInterval(() => {
      if (doctorId) {
        doctorAPI.getConversation(doctorId).then((data) => {
          if (data && data.messages) {
            const formattedMessages: DoctorMessage[] = data.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
              reactions: msg.reactions || [],
            }));
            setMessages(formattedMessages);
          }
        }).catch(() => {});
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [doctorId]);

  const handleAttachClick = (accept: string, kind?: DoctorAttachment['kind']) => {
    setShowAttachMenu(false);
    setShowGifPicker(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.multiple = true;
      (fileInputRef.current as any).dataset.kind = kind || '';
      fileInputRef.current.click();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).slice(0, 5 - selectedImages.length);
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };
  const removeImage = (index: number) => setSelectedImages((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && selectedImages.length === 0) return;
    if (!doctorId || sending) return;

    if (isRecording) {
      setIsRecording(false);
      const voiceMsg: DoctorMessage = {
        _id: `voice-${Date.now()}`,
        conversationId: doctorId,
        senderId: user?.id || 'me',
        senderType: 'patient',
        content: `🎤 Voice message (${formatTime(recordTime)})`,
        read: false,
        createdAt: new Date(),
        reactions: [],
        replyTo: replyToMessage ? {
          _id: replyToMessage._id,
          content: replyToMessage.content,
          senderName: replyToMessage.senderType === 'patient' ? (user?.name || 'You') : (doctor?.name || 'Doctor'),
          senderType: replyToMessage.senderType,
        } : undefined,
      };
      setMessages((prev) => [...prev, voiceMsg]);
      setRecordTime(0);
      setReplyToMessage(null);
      simulateTypingAndResponse();
      return;
    }

    try {
      setSending(true);
      const data = await doctorAPI.sendMessage({
        doctorId,
        content: input.trim(),
        images: selectedImages,
      });
      const formattedMessages: DoctorMessage[] = data.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        reactions: msg.reactions || [],
        replyTo: replyToMessage ? {
          _id: replyToMessage._id,
          content: replyToMessage.content,
          senderName: replyToMessage.senderType === 'patient' ? (user?.name || 'You') : (doctor?.name || 'Doctor'),
          senderType: replyToMessage.senderType,
        } : undefined,
      }));
      setMessages(formattedMessages);
      setInput('');
      setSelectedImages([]);
      setReplyToMessage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      simulateTypingAndResponse();
    } catch (error) {
      console.error('Failed to send message:', error);
      const optimistic: DoctorMessage = {
        _id: `opt-${Date.now()}`,
        conversationId: doctorId,
        senderId: user?.id || 'me',
        senderType: 'patient',
        content: input.trim(),
        read: false,
        createdAt: new Date(),
        reactions: [],
        replyTo: replyToMessage ? {
          _id: replyToMessage._id,
          content: replyToMessage.content,
          senderName: replyToMessage.senderType === 'patient' ? (user?.name || 'You') : (doctor?.name || 'Doctor'),
          senderType: replyToMessage.senderType,
        } : undefined,
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      setSelectedImages([]);
      setReplyToMessage(null);
      simulateTypingAndResponse();
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) => prev.map((m) => {
      if (m._id !== msgId) return m;
      const currentReactions = m.reactions || [];
      const existing = currentReactions.find((r) => r.userId === (user?.id || 'me') && r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: currentReactions.filter((r) => !(r.userId === (user?.id || 'me') && r.emoji === emoji)) };
      }
      return { ...m, reactions: [...currentReactions, { emoji, userId: user?.id || 'me', userName: user?.name || 'You' }] };
    }));
  };

  const toggleStar = (msgId: string) => {
    setMessages((prev) => prev.map((m) =>
      m._id === msgId ? { ...m, starred: !m.starred } : m
    ));
  };

  const openForwardModal = (msg: DoctorMessage) => {
    setForwardMsg(msg);
    setLongPressMsgId(null);
    setHoveredMessageId(null);
    setShowForwardModal(true);
  };

  const executeForward = (toDoctorId: string) => {
    setShowForwardModal(false);
    setForwardMsg(null);
    navigate(`/doctor-chat/${toDoctorId}`);
  };

  const startCall = (type: CallType) => {
    if (!doctor || !user?.id) return;
    const mappedType: 'audio' | 'video' = type === 'video' ? 'video' : 'audio';
    setActiveCall({
      isOpen: true,
      callType: mappedType,
      initialStatus: 'calling',
      remoteParticipant: {
        id: doctor.id,
        name: doctor.name,
        role: 'Doctor',
        specialty: doctor.specialty,
      },
    });
  };

  const acceptCall = () => {
    setCallModal((prev) => prev ? { ...prev, status: 'active' } : null);
    setCallDuration(0);
  };

  const endCall = () => {
    if (!callModal) return;
    const finalDuration = callDuration;
    const finalType = callModal.type;
    if (doctor) {
      const direction: CallDirection = callModal.status === 'incoming' ? 'incoming' : 'outgoing';
      const entry: CallLogEntry = {
        id: `call-${Date.now()}`,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        type: finalType,
        direction,
        date: new Date(),
        duration: finalDuration,
      };
      setCallLog((prev) => [entry, ...prev]);
    }
    setCallModal(null);
    setCallEndedSummary({ duration: finalDuration, type: finalType });
    setTimeout(() => setCallEndedSummary(null), 5000);
  };

  const callBackFromLog = (entry: CallLogEntry) => {
    setShowCallLog(false);
    navigate(`/doctor-chat/${entry.doctorId}`);
    setTimeout(() => startCall(entry.type), 500);
  };

  const formatTime = (s: number | Date): string => {
    if (typeof s === 'number') {
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return `${m}:${ss.toString().padStart(2, '0')}`;
    }
    return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCallDuration = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  const formatDate = (d: Date) => {
    const today = new Date();
    const y = new Date(d);
    const isToday = y.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = y.toDateString() === yesterday.toDateString();
    return isToday ? 'Today' : isYesterday ? 'Yesterday' : y.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const messagesWithDateSeparators = useMemo(() => {
    const result: (DoctorMessage | { _id: string; type: 'date'; date: Date })[] = [];
    let last = '';
    messages.forEach((m) => {
      const key = new Date(m.createdAt).toDateString();
      if (key !== last) {
        result.push({ _id: `date-${m._id}`, type: 'date', date: new Date(m.createdAt) });
        last = key;
      }
      result.push(m);
    });
    return result;
  }, [messages]);

  const filteredDoctors = useMemo(
    () =>
      allDoctors.filter(
        (d) =>
          d.name.toLowerCase().includes(searchChatList.toLowerCase()) ||
          d.specialty.toLowerCase().includes(searchChatList.toLowerCase()) ||
          d.phone.includes(searchChatList) ||
          d.hospital.toLowerCase().includes(searchChatList.toLowerCase())
      ),
    [allDoctors, searchChatList]
  );

  const filteredSearchMessages = useMemo(() => {
    if (!searchInChat.trim()) return { messages: messages, indices: [] as number[] };
    const query = searchInChat.toLowerCase();
    const indices: number[] = [];
    messages.forEach((m, i) => {
      if (m.content.toLowerCase().includes(query)) indices.push(i);
    });
    return { messages, indices };
  }, [messages, searchInChat]);

  const starredMessages = useMemo(() => messages.filter((m) => m.starred), [messages]);

  const sharedPrescriptions = useMemo(() => {
    const all: { msgId: string; name: string; date: Date; status: 'sent' | 'fulfilled' | 'refill' }[] = [];
    messages.forEach((m) => {
      if (m.attachments) {
        m.attachments.forEach((att, idx) => {
          if (att.kind === 'prescription' || att.type.includes('pdf') || att.name.toLowerCase().includes('presc')) {
            all.push({ msgId: `${m._id}-${idx}`, name: att.name, date: new Date(m.createdAt), status: idx % 3 === 0 ? 'fulfilled' : idx % 3 === 1 ? 'refill' : 'sent' });
          }
        });
      }
    });
    return all;
  }, [messages]);

  const chatListInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const progressBarBg = 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500';

  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  const handleLongPressStart = (msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressMsgId(msgId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const renderReactionsBadge = (reactions: MessageReaction[] = []) => {
    if (reactions.length === 0) return null;
    const counts: Record<string, number> = {};
    reactions.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
    const items = Object.entries(counts).slice(0, 4);
    return (
      <motion.div
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/90 backdrop-blur border border-gray-100 shadow-sm mt-1"
      >
        {items.map(([e, c]) => (
          <span key={e} className="text-xs flex items-center">
            <span>{e}</span>
            {c > 1 && <span className="text-[10px] font-bold text-gray-600 ml-0.5">{c}</span>}
          </span>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/40 to-pink-50/60">
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl -z-0 animate-float pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl -z-0 animate-float pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="h-full flex flex-col lg:flex-row relative z-10 max-w-[1600px] mx-auto">
        {/* ========================= LEFT PANEL: Chat List (LG+) ========================= */}
        <aside className={`${doctorId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] xl:w-[420px] h-full border-r border-gray-100 bg-white/70 backdrop-blur-xl shadow-xl lg:shadow-none`}>
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-5 pt-6 pb-5 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-6 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div>
                <div className="text-2xl font-black tracking-tight">FemCare</div>
                <div className="text-xs text-white/80 font-medium">Messages & Calls</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCallLog(true)} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors" title="Call History">
                  <PhoneCall className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setShowSettingsDrawer(true)}
                  className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur border border-white/20 flex items-center justify-center text-xl font-black">
                  {user?.name ? chatListInitials(user.name) : '👤'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-400 border-2 border-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold truncate">{user?.name || 'Welcome Back!'}</div>
                <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  Encrypted · Online
                </div>
              </div>
            </div>
          </motion.div>

          <div className="px-5 py-4 border-b border-gray-50 bg-white/50">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-200/40 to-purple-200/40 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                  value={searchChatList}
                  onChange={(e) => setSearchChatList(e.target.value)}
                  type="text"
                  placeholder="Search doctors, calls..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-gray-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all text-sm font-medium placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="flex px-5 pt-3 gap-1 text-xs font-bold">
            {[
              { key: 'chats' as const, label: 'Chats', icon: <MessageCircle className="w-3.5 h-3.5" /> },
              { key: 'calls' as const, label: 'Calls', icon: <PhoneCall className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setChatListTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                  chatListTab === tab.key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-purple-200/50' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setShowStarredDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-amber-500 hover:bg-amber-50 transition-all"
              title="Starred"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>

          <div ref={chatListRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            {chatListTab === 'chats' ? (
              filteredDoctors.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <SearchX className="w-8 h-8 text-pink-400" />
                  </div>
                  <div className="font-bold text-gray-700 mb-1">No doctors found</div>
                  <div className="text-sm text-gray-500">Try adjusting your search terms</div>
                </div>
              ) : (
                filteredDoctors.map((d, idx) => {
                  const isActive = d.id === doctorId;
                  const unreadCount = idx === 0 ? 2 : idx === 1 ? 1 : 0;
                  const isTypingDoctor = idx === 0;
                  return (
                    <motion.button
                      key={d.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: idx * 0.04 }}
                      whileHover={{ y: -2 }}
                      onClick={() => navigate(`/doctor-chat/${d.id}`)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3 group ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-purple-500/10 border-2 border-purple-200 shadow-md'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                          ['from-pink-400 to-rose-500', 'from-violet-400 to-purple-500', 'from-sky-400 to-blue-500', 'from-emerald-400 to-teal-500'][idx % 4]
                        } flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                          {chatListInitials(d.name)}
                        </div>
                        {d.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-400 border-2 border-white shadow-sm animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-800 truncate">{d.name}</span>
                          <span className="text-[10px] font-semibold text-gray-400 flex-shrink-0 ml-2">
                            {idx === 0 ? 'now' : `${idx + 2}h ago`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            {d.specialty}
                          </span>
                          <span className="flex-1 truncate text-xs text-gray-500">
                            {isTypingDoctor ? (
                              <motion.span className="inline-flex gap-0.5 items-end">
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-1 h-1 bg-purple-500 rounded-full" />
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="inline-block w-1 h-1 bg-purple-500 rounded-full" />
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="inline-block w-1 h-1 bg-purple-500 rounded-full" />
                                <span className="ml-1 text-purple-600 font-bold">typing...</span>
                              </motion.span>
                            ) : idx === 1 ? '📄 Shared a prescription' : idx === 2 ? 'Thank you doctor 🙏' : 'Your consultation is booked'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-current" /> {d.rating}
                            <span className="text-gray-300 mx-1">·</span>
                            <span className="text-gray-400">{d.experience} yrs</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">{unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )
            ) : (
              callLog.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <PhoneCall className="w-8 h-8 text-teal-500" />
                  </div>
                  <div className="font-bold text-gray-700 mb-1">No call history</div>
                  <div className="text-sm text-gray-500">Your call history will appear here</div>
                </div>
              ) : (
                callLog.map((entry, idx) => (
                  <motion.button
                    key={entry.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => callBackFromLog(entry)}
                    className="w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3 group hover:bg-gray-50 border-2 border-transparent"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                        entry.type === 'voice'
                          ? 'from-emerald-400 to-teal-500'
                          : 'from-violet-400 to-indigo-500'
                      } flex items-center justify-center text-white shadow-md`}>
                        {entry.type === 'voice' ? <Phone className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 truncate">{entry.doctorName}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); callBackFromLog(entry); }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            entry.direction === 'missed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {entry.type === 'voice' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          entry.direction === 'missed' ? 'bg-red-50 text-red-600' :
                          entry.direction === 'incoming' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {entry.direction === 'missed' ? 'Missed' : entry.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-1 truncate">{entry.doctorSpecialty}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-medium">
                        <Clock className="w-3 h-3" /> {formatDate(entry.date)} · {formatCallDuration(entry.duration)}
                      </div>
                    </div>
                  </motion.button>
                ))
              )
            )}
          </div>

          <div className="p-4 border-t border-gray-50 bg-white/80">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/doctors')}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 shadow-lg shadow-purple-200/60 hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Find & Book a Doctor
            </motion.button>
          </div>
        </aside>

        {/* ========================= RIGHT PANEL: Conversation ========================= */}
        <main className={`${doctorId ? 'flex' : 'hidden lg:flex'} flex-col flex-1 h-full min-w-0`} style={currentWallpaper.style}>
          {!doctorId && (
            <div className="flex-1 flex items-center justify-center p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                {Array.from({ length: 25 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
                    className="absolute text-pink-300"
                    style={{
                      left: `${(i * 37) % 100}%`,
                      top: `${(i * 53) % 100}%`,
                      fontSize: `${14 + (i % 4) * 4}px`,
                    }}
                  >
                    {['💕', '🌸', '✨', '💊', '🩺'][i % 5]}
                  </motion.div>
                ))}
              </div>
              <div className="relative z-10 max-w-md">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 150 }}
                  className="w-36 h-36 mx-auto mb-8 rounded-[2.5rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-300/40 relative"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 -m-4 rounded-[3rem] border-2 border-dashed border-purple-300/30"
                  />
                  <div className="text-6xl">👩‍⚕️</div>
                </motion.div>
                <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Start a Consultation
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Select a doctor from the list to start chatting, share reports, prescriptions, and get real-time expert guidance.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {[
                    { icon: <Stethoscope className="w-5 h-5" />, label: 'Chat', color: 'from-pink-500 to-rose-500' },
                    { icon: <Phone className="w-5 h-5" />, label: 'Call', color: 'from-violet-500 to-purple-500' },
                    { icon: <Video className="w-5 h-5" />, label: 'Video', color: 'from-sky-500 to-blue-500' },
                  ].map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="p-4 rounded-2xl bg-white shadow-lg border border-gray-100 flex flex-col items-center gap-2"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center shadow-md`}>
                        {t.icon}
                      </div>
                      <div className="text-xs font-bold text-gray-700">{t.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && doctorId && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 rounded-2xl border-4 border-purple-200 border-t-pink-500"
              />
              <div className="text-gray-500 font-medium">Loading conversation...</div>
            </div>
          )}

          {doctorId && !loading && (
            <>
              <motion.header
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <BackToHomeButton />
                  {doctor && (
                    <>
                      <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowInfo((v) => !v)}>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                          {chatListInitials(doctor.name)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white ${doctor.online ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                      </div>
                      <div className="min-w-0 cursor-pointer" onClick={() => setShowInfo((v) => !v)}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-black text-gray-800 truncate">{doctor.name}</h3>
                          <CheckCheck className="w-4 h-4 text-sky-500" />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{doctor.specialty}</span>
                          {isTyping ? (
                            <motion.span
                              className="text-green-500 font-bold flex items-center gap-1"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <span className="flex gap-0.5 items-end">
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>•</motion.span>
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}>•</motion.span>
                                <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}>•</motion.span>
                              </span>
                              typing
                            </motion.span>
                          ) : (
                            <span className={`flex items-center gap-1 ${doctor.online ? 'text-green-600' : 'text-gray-400'}`}>
                              <Circle className={`w-2 h-2 fill-current ${doctor.online ? 'animate-pulse' : ''}`} />
                              {doctor.online ? 'online' : 'last seen recently'}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setShowPrescriptionDrawer(true)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 hover:from-violet-100 hover:to-purple-100 flex items-center justify-center shadow-sm border border-violet-100"
                    title="Prescriptions"
                  >
                    <Pill className="w-4.5 h-4.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setShowSearchDrawer(true)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-sky-600 hover:from-sky-100 hover:to-blue-100 flex items-center justify-center shadow-sm border border-sky-100"
                    title="Search in Chat"
                  >
                    <Search className="w-4.5 h-4.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => navigate('/appointments')}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 hover:from-emerald-100 hover:to-teal-100 flex items-center justify-center shadow-sm border border-emerald-100"
                    title="Appointments"
                  >
                    <Calendar className="w-4.5 h-4.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => startCall('voice')}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 hover:from-green-100 hover:to-emerald-100 flex items-center justify-center shadow-sm border border-green-100"
                    title="Voice Call"
                  >
                    <Phone className="w-4.5 h-4.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => startCall('video')}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 hover:from-violet-100 hover:to-purple-100 flex items-center justify-center shadow-sm border border-violet-100"
                    title="Video Call"
                  >
                    <Video className="w-4.5 h-4.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setShowInfo((v) => !v)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500"
                  >
                    <MoreVertical className="w-4.5 h-4.5" />
                  </motion.button>
                </div>
              </motion.header>

              <div
                className="flex-1 overflow-y-auto relative px-4 sm:px-8 py-6 space-y-2"
                onClick={() => { setShowAttachMenu(false); setShowEmojiPicker(false); setShowGifPicker(false); }}
              >
                <AnimatePresence>
                  {showInfo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -10 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -10 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="relative rounded-3xl bg-white/90 backdrop-blur-xl border border-purple-100 shadow-xl p-6 sm:p-7 overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-pink-200/40 to-purple-200/40 blur-3xl -mt-12 -mr-12" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
                          <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                              {doctor ? chatListInitials(doctor.name) : 'DR'}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center text-xs font-black text-white ${doctor?.online ? 'bg-green-500' : 'bg-gray-400'}`}>
                              ✓
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <h4 className="text-2xl font-black text-gray-800">{doctor?.name}</h4>
                              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold">
                                {doctor?.specialty}
                              </span>
                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-4 h-4 fill-current" /> {doctor?.rating}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium mt-2">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-purple-500" /> {doctor?.hospital}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-pink-500" /> {doctor?.experience} yrs exp.
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-emerald-500" /> Verified
                              </span>
                              <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                ₹{doctor?.fees} fee
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <motion.button
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => navigate('/appointments')}
                              className="px-5 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 shadow-lg shadow-purple-200/50"
                            >
                              Book Visit
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative z-10 space-y-3 max-w-5xl mx-auto"
                >
                  {messagesWithDateSeparators.length === 0 ? (
                    <div className="py-16 sm:py-24 text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 150 }}
                        className="relative inline-block mb-8"
                      >
                        <motion.div
                          animate={{ rotate: [0, -5, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                          className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-300/40 mx-auto"
                        >
                          <div className="text-6xl">👩‍⚕️</div>
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -right-3 -top-2 w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg rotate-12"
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                      </motion.div>
                      <h3 className="text-2xl sm:text-3xl font-black mb-3 bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
                        Start Your Consultation
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                        Share your symptoms, upload reports or prescriptions, and ask <span className="font-bold text-purple-600">{doctor?.name}</span> any questions. Your conversation is private and encrypted.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                        {[
                          { icon: <Pill className="w-5 h-5" />, label: 'Share Prescription', color: 'from-pink-500 to-rose-500' },
                          { icon: <FileSpreadsheet className="w-5 h-5" />, label: 'Upload Report', color: 'from-emerald-500 to-teal-500' },
                          { icon: <Stethoscope className="w-5 h-5" />, label: 'Ask a Question', color: 'from-violet-500 to-purple-500' },
                          { icon: <Video className="w-5 h-5" />, label: 'Video Consult', color: 'from-sky-500 to-blue-500' },
                        ].map((c, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAttachMenu(true)}
                            className="p-4 rounded-2xl bg-white shadow-lg border border-gray-100 hover:border-purple-200 transition-all flex flex-col items-center gap-2.5 group"
                          >
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform`}>
                              {c.icon}
                            </div>
                            <div className="text-xs font-bold text-gray-700">{c.label}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messagesWithDateSeparators.map((row) => {
                      if ((row as any).type === 'date') {
                        return (
                          <div key={row._id} className="flex justify-center my-5">
                            <motion.span
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-gray-100 shadow-sm text-xs font-bold text-gray-500"
                            >
                              {formatDate((row as any).date)}
                            </motion.span>
                          </div>
                        );
                      }
                      const msg = row as DoctorMessage;
                      const mine = msg.senderType === 'patient';
                      const highlightMatch = searchInChat && searchInChat.trim() && msg.content.toLowerCase().includes(searchInChat.toLowerCase());
                      const uniqueReactions = Array.from(new Set(msg.reactions?.map((r) => r.emoji) || []));

                      return (
                        <motion.div
                          key={msg._id}
                          variants={itemVariants}
                          onMouseEnter={() => setHoveredMessageId(msg._id)}
                          onMouseLeave={() => { setHoveredMessageId(null); setLongPressMsgId(null); handleLongPressEnd(); }}
                          onTouchStart={() => handleLongPressStart(msg._id)}
                          onTouchEnd={() => handleLongPressEnd()}
                          drag={swipeMsgId === msg._id ? 'x' : false}
                          dragConstraints={{ left: -80, right: 0 }}
                          dragElastic={0.2}
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -40) {
                              setReplyToMessage(msg);
                            }
                            setSwipeMsgId(null);
                          }}
                          onClick={() => setSwipeMsgId(msg._id)}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2 relative`}
                        >
                          {!mine && (
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm mb-1">
                              {doctor ? chatListInitials(doctor.name).slice(0, 1) : 'D'}
                            </div>
                          )}

                          <div className={`group flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]`}>
                            <div
                              className={`relative w-full`}
                              style={{ zIndex: swipeMsgId === msg._id ? 10 : 1 }}
                            >
                              <div
                                className={`absolute inset-y-0 ${mine ? 'right-full mr-2' : 'left-full ml-2'} flex items-center pointer-events-none`}
                              >
                                <motion.div
                                  initial={{ opacity: 0, x: mine ? 10 : -10 }}
                                  animate={{
                                    opacity: swipeMsgId === msg._id ? 1 : 0,
                                    x: 0,
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${mine ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-600'} shadow-sm`}
                                >
                                  <Reply className="w-4 h-4" />
                                  <span className="text-xs font-bold">Swipe to reply</span>
                                </motion.div>
                              </div>

                              <motion.div
                                layout
                                drag={swipeMsgId === msg._id ? 'x' : false}
                                dragConstraints={{ left: -70, right: 0 }}
                                onDragEnd={(_, info) => {
                                  if (info.offset.x < -35) setReplyToMessage(msg);
                                }}
                                className={`relative px-4 py-3 shadow-lg ${
                                  mine
                                    ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white rounded-[1.4rem] rounded-br-md'
                                    : 'bg-white text-gray-800 rounded-[1.4rem] rounded-bl-md border border-gray-50'
                                } ${highlightMatch ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                              >
                                {msg.replyTo && (
                                  <div className={`mb-2 p-2.5 rounded-xl text-xs ${
                                    mine
                                      ? 'bg-white/15 backdrop-blur border border-white/20'
                                      : msg.replyTo.senderType === 'patient'
                                        ? 'bg-pink-50 border border-pink-100'
                                        : 'bg-purple-50 border border-purple-100'
                                  }`}>
                                    <div className={`font-bold mb-0.5 flex items-center gap-1 ${mine ? 'text-white/80' : msg.replyTo.senderType === 'patient' ? 'text-pink-600' : 'text-purple-600'}`}>
                                      <Reply className="w-3 h-3" /> {msg.replyTo.senderName}
                                    </div>
                                    <div className={`truncate ${mine ? 'text-white/90' : 'text-gray-600'}`}>
                                      {msg.replyTo.content.length > 80 ? msg.replyTo.content.slice(0, 80) + '...' : msg.replyTo.content}
                                    </div>
                                  </div>
                                )}

                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className={`grid ${msg.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
                                    {msg.attachments.map((att: any, idx: number) => {
                                      const rawUrl = att.url || att.dataUrl || '';
                                      const fileUrl = rawUrl.startsWith('/') && typeof window !== 'undefined' ? `${window.location.origin}${rawUrl}` : rawUrl;
                                      const isImg = att.type?.startsWith('image/') || att.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|svg)$/i.test(att.name || '');
                                      const isMedical = att.kind === 'prescription' || att.kind === 'report' || att.kind === 'xray' || (att.name && (att.name.toLowerCase().includes('presc') || att.name.toLowerCase().includes('report') || att.name.toLowerCase().includes('xray')));
                                      return (
                                        <div key={idx} className="relative">
                                          {isImg ? (
                                            <motion.div
                                              whileHover={{ scale: 1.02 }}
                                              onClick={() => setImagePreview(fileUrl)}
                                              className="relative overflow-hidden rounded-xl border border-white/20 cursor-zoom-in"
                                            >
                                              <img src={fileUrl} alt={att.name || 'Image'} className="w-full max-h-56 object-cover" />
                                              <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-[10px] text-white font-bold">
                                                📷 {att.kind || 'IMG'}
                                              </div>
                                            </motion.div>
                                          ) : (
                                            <div className={`rounded-xl ${
                                              mine ? 'bg-white/15 backdrop-blur border border-white/20' : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100'
                                            }`}>
                                              <div className={`flex items-center gap-3 p-3`}>
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                  mine ? 'bg-white/20 text-white' : att.kind === 'prescription'
                                                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                                                    : att.kind === 'report'
                                                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                                      : att.kind === 'xray'
                                                        ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                                                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                                }`}>
                                                  {att.kind === 'prescription' ? <Pill className="w-5 h-5" /> :
                                                   att.kind === 'report' ? <FileSpreadsheet className="w-5 h-5" /> :
                                                   att.kind === 'xray' ? <Upload className="w-5 h-5" /> :
                                                   <FileText className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className={`text-sm font-bold truncate ${mine ? 'text-white' : 'text-gray-800'}`}>{att.name || 'Attachment'}</div>
                                                  <div className={`text-xs font-medium ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                                                    {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Document'}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className={`grid grid-cols-4 gap-1 p-2 border-t ${mine ? 'border-white/20' : 'border-purple-100'}`}>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); navigate('/ai-chat'); }}
                                                  className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 ${
                                                    mine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white'
                                                  }`}
                                                  title="AI Analyze"
                                                >
                                                  <Sparkles className="w-2.5 h-2.5" /> AI
                                                </button>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); navigate('/ai-chat'); }}
                                                  className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 ${
                                                    mine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
                                                  }`}
                                                  title="Share to AI"
                                                >
                                                  <Share2 className="w-2.5 h-2.5" /> Share
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const a = document.createElement('a');
                                                    a.href = fileUrl;
                                                    a.download = att.name || 'file';
                                                    a.target = '_blank';
                                                    a.click();
                                                  }}
                                                  className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 ${
                                                    mine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                                                  }`}
                                                  title="Download"
                                                >
                                                  <Download className="w-2.5 h-2.5" /> Save
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const printWin = window.open(fileUrl, '_blank');
                                                    if (printWin) {
                                                      printWin.focus();
                                                    }
                                                  }}
                                                  className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 ${
                                                    mine ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white'
                                                  }`}
                                                  title="Open"
                                                >
                                                  <Printer className="w-2.5 h-2.5" /> Open
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {msg.content && (
                                  <p className={`whitespace-pre-wrap text-[15px] leading-relaxed ${mine ? 'text-white' : 'text-gray-800'}`}>
                                    {highlightMatch ? (
                                      msg.content.split(new RegExp(`(${searchInChat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                                        part.toLowerCase() === searchInChat.toLowerCase()
                                          ? <mark key={i} className="bg-yellow-300 rounded px-0.5">{part}</mark>
                                          : <span key={i}>{part}</span>
                                      )
                                    ) : msg.content}
                                  </p>
                                )}

                                <div className={`flex items-center gap-1.5 mt-1 ${mine ? 'justify-end' : 'justify-end'}`}>
                                  {msg.starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                  {msg.forwarded && <Forward className="w-3 h-3 text-gray-400" />}
                                  <span className={`text-[10.5px] font-medium ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {mine && (
                                    <span className={`${msg.read ? 'text-sky-300' : 'text-white/60'}`}>
                                      {sending ? (
                                        <Clock className="w-3.5 h-3.5" />
                                      ) : msg.read ? (
                                        <CheckCheck className="w-4 h-4 fill-current" />
                                      ) : (
                                        <CheckCheck className="w-4 h-4" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </motion.div>

                              {(hoveredMessageId === msg._id || longPressMsgId === msg._id) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  className={`absolute ${mine ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} -top-3 flex items-center gap-1 p-1 rounded-2xl bg-white shadow-xl border border-gray-100 backdrop-blur z-20`}
                                >
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <motion.button
                                      key={emoji}
                                      whileHover={{ scale: 1.3, y: -3 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => toggleReaction(msg._id, emoji)}
                                      className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center hover:bg-gray-100 ${uniqueReactions.includes(emoji) ? 'bg-purple-100 scale-110' : ''}`}
                                    >
                                      {emoji}
                                    </motion.button>
                                  ))}
                                  <div className="w-px h-5 bg-gray-200 mx-0.5" />
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setReplyToMessage(msg)}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-purple-100 hover:text-purple-600 ${replyToMessage?._id === msg._id ? 'bg-purple-100 text-purple-600' : ''}`}
                                    title="Reply"
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleStar(msg._id)}
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center hover:bg-amber-100 ${msg.starred ? 'bg-amber-100 text-amber-500' : 'text-gray-500 hover:text-amber-500'}`}
                                    title={msg.starred ? 'Unstar' : 'Star'}
                                  >
                                    <BookmarkCheck className={`w-3.5 h-3.5 ${msg.starred ? 'fill-current' : ''}`} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openForwardModal(msg)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-sky-100 hover:text-sky-600"
                                    title="Forward"
                                  >
                                    <Forward className="w-3.5 h-3.5" />
                                  </motion.button>
                                </motion.div>
                              )}
                            </div>

                            {renderReactionsBadge(msg.reactions)}
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-end gap-2"
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                        {doctor ? chatListInitials(doctor.name).slice(0, 1) : 'D'}
                      </div>
                      <div className="bg-white border border-gray-50 shadow-sm px-5 py-4 rounded-[1.4rem] rounded-bl-md flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                            className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-500"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </motion.div>
              </div>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="absolute left-4 sm:left-8 right-4 sm:right-8 bottom-[108px] z-20 max-w-md mx-auto"
                  >
                    <div className="relative rounded-[1.4rem] bg-white/95 backdrop-blur-2xl shadow-2xl border border-gray-100 p-4 overflow-hidden">
                      <div className="flex gap-1 mb-3 border-b border-gray-100 pb-2">
                        {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setEmojiCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              emojiCategory === cat
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-8 gap-1 max-h-52 overflow-y-auto">
                        {EMOJI_CATEGORIES[emojiCategory].map((emoji, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.4 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => insertEmoji(emoji)}
                            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-xl"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showGifPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="absolute left-4 sm:left-8 right-4 sm:right-8 bottom-[108px] z-20 max-w-md mx-auto"
                  >
                    <div className="relative rounded-[1.4rem] bg-white/95 backdrop-blur-2xl shadow-2xl border border-gray-100 p-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MonitorPlay className="w-5 h-5 text-purple-500" />
                          <div className="text-sm font-black text-gray-800">GIFs & Animated Stickers</div>
                        </div>
                        <div className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-full">Placeholders</div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {GIF_PLACEHOLDERS.map((gif) => (
                          <motion.button
                            key={gif.id}
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => { setInput((p) => p + ` ${gif.emoji} ${gif.label} `); setShowGifPicker(false); }}
                            className={`aspect-square rounded-2xl bg-gradient-to-br ${gif.bg} flex flex-col items-center justify-center gap-1 shadow-md group`}
                          >
                            <motion.span
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="text-3xl"
                            >
                              {gif.emoji}
                            </motion.span>
                            <span className="text-[10px] font-bold text-white drop-shadow">{gif.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    className="absolute left-4 sm:left-8 right-4 sm:right-8 bottom-[108px] z-20 max-w-2xl mx-auto"
                  >
                    <div className="relative rounded-[1.6rem] bg-white/95 backdrop-blur-2xl shadow-2xl border border-gray-100 p-4 sm:p-5 overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-2xl" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-md">
                              <Paperclip className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <div className="font-black text-gray-800 text-sm">Share via Attachment</div>
                              <div className="text-xs text-gray-500 font-medium">Images, documents, reports & more</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAttachMenu(false)}
                            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {attachmentOptions.map((opt) => (
                            <motion.button
                              key={opt.key}
                              whileHover={{ y: -3 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAttachClick(opt.accept, opt.kind)}
                              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-all group"
                            >
                              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.gradient} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                                {opt.icon}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center">
                                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                                </div>
                              </div>
                              <div className="text-[11px] font-bold text-gray-700 text-center leading-tight">
                                {opt.label}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setShowAttachMenu(false); setShowGifPicker(true); }}
                            className="w-full p-3 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border border-violet-100 flex items-center justify-center gap-2 transition-all"
                          >
                            <ImagePlus className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-bold text-violet-600">GIFs & Stickers</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setImagePreview(null)}
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                  >
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/25"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---------- INPUT / COMPOSER AREA ---------- */}
              <div className="relative bg-white/80 backdrop-blur-xl border-t border-gray-100 px-3 sm:px-5 pt-3 pb-4 sm:pt-4 sm:pb-5">
                <AnimatePresence>
                  {replyToMessage && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: 10 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: 10 }}
                      className="max-w-5xl mx-auto overflow-hidden mb-3"
                    >
                      <div className={`p-3 rounded-2xl border-2 flex items-center gap-3 ${
                        replyToMessage.senderType === 'patient'
                          ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200'
                          : 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                          replyToMessage.senderType === 'patient'
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                        }`}>
                          <Reply className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-black mb-0.5 ${
                            replyToMessage.senderType === 'patient' ? 'text-pink-600' : 'text-violet-600'
                          }`}>
                            Reply to {replyToMessage.senderType === 'patient' ? (user?.name || 'You') : (doctor?.name || 'Doctor')}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {replyToMessage.content.slice(0, 120)}{replyToMessage.content.length > 120 ? '...' : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => setReplyToMessage(null)}
                          className="w-8 h-8 rounded-xl bg-white/60 hover:bg-white flex items-center justify-center text-gray-500 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedImages.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="max-w-5xl mx-auto overflow-hidden mb-3"
                    >
                      <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                        {selectedImages.map((f, i) => {
                          const isImg = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|svg)$/i.test(f.name);
                          return (
                            <motion.div
                              key={i}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-white group bg-gray-100"
                            >
                              {isImg ? (
                                <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center text-white p-1">
                                  <FileText className="w-6 h-6" />
                                  <span className="text-[9px] font-bold truncate max-w-full">{f.name}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] text-white font-bold">
                                {isImg ? `📷 ${i + 1}` : `📄 ${i + 1}`}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      {sending && (
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '0%' }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`h-full ${progressBarBg}`}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSend} className="max-w-5xl mx-auto flex items-end gap-2 sm:gap-3 relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  <AnimatePresence>
                    {isRecording && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '100%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="absolute -top-14 left-0 right-0 flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white shadow-lg overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="w-3.5 h-3.5 rounded-full bg-white"
                          />
                          <div className="font-black tracking-wide">REC · {formatTime(recordTime)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => { setIsRecording(false); setRecordTime(0); }} className="px-3 py-1.5 rounded-xl bg-white/20 text-xs font-bold hover:bg-white/30">Cancel</button>
                          <button type="submit" className="px-3 py-1.5 rounded-xl bg-white text-red-600 text-xs font-black shadow-md">Send</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => { setShowEmojiPicker((v) => !v); setShowAttachMenu(false); setShowGifPicker(false); }}
                    className={`w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl border-2 flex items-center justify-center shadow-sm transition-all ${
                      showEmojiPicker
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-transparent shadow-lg shadow-amber-200/50'
                        : 'bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-500 border-amber-100 hover:from-amber-100 hover:to-yellow-100'
                    }`}
                    title="Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => { setShowAttachMenu((v) => !v); setShowEmojiPicker(false); setShowGifPicker(false); }}
                    className={`w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl border-2 flex items-center justify-center shadow-sm transition-all ${
                      showAttachMenu
                        ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white border-transparent shadow-lg shadow-purple-200/50'
                        : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                    }`}
                    title="Attach"
                  >
                    <motion.span animate={{ rotate: showAttachMenu ? 45 : 0 }} transition={{ type: 'spring', stiffness: 260 }}>
                      <Paperclip className="w-5 h-5" />
                    </motion.span>
                  </motion.button>

                  <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-200/40 to-purple-200/40 rounded-2xl blur opacity-0 group-focus-within:opacity-80 transition-opacity" />
                    <textarea
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        const el = e.target as HTMLTextAreaElement;
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                      }}
                      placeholder={isRecording ? 'Recording voice message...' : `Message ${doctor?.name?.split(' ')[0] || 'doctor'}...`}
                      disabled={isRecording || sending}
                      className={`relative w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-white border-2 border-gray-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all resize-none text-sm sm:text-base font-medium placeholder:text-gray-400 ${
                        isRecording ? 'italic text-red-500 pl-10' : ''
                      }`}
                      style={{ lineHeight: 1.5 }}
                    />
                    {isRecording && (
                      <motion.div
                        animate={{ x: [0, 2, 0, -2, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"
                      />
                    )}
                  </div>

                  {!input.trim() && selectedImages.length === 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.08, y: -1 }}
                      whileTap={{ scale: 0.92 }}
                      type="button"
                      onClick={() => setIsRecording((v) => !v)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                        isRecording
                          ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-300/50 animate-pulse'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border border-gray-200 hover:from-gray-100 hover:to-gray-200'
                      }`}
                      title={isRecording ? 'Stop Recording' : 'Voice Message'}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.08, y: -1 }}
                      whileTap={{ scale: 0.92 }}
                      type="submit"
                      disabled={sending}
                      className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-purple-300/50 hover:shadow-xl hover:shadow-purple-400/40 disabled:opacity-60 flex items-center justify-center disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Send className="w-5 h-5 -ml-0.5" />
                      )}
                    </motion.button>
                  )}
                </form>

                <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 mt-3 text-[11px] font-medium text-gray-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Messages are end-to-end encrypted. Do not share passwords or financial information.
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ========== STARRED MESSAGES DRAWER ========== */}
      <AnimatePresence>
        {showStarredDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStarredDrawer(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-[61] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookmarkCheck className="w-7 h-7" />
                    <div>
                      <div className="text-xl font-black">Starred Messages</div>
                      <div className="text-xs text-white/80 font-medium">{starredMessages.length} messages</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStarredDrawer(false)}
                    className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {starredMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Star className="w-10 h-10 text-amber-400" />
                    </div>
                    <div className="font-bold text-gray-700 mb-1">No starred messages</div>
                    <div className="text-sm text-gray-500">Hover over a message and click ⭐ to save it here</div>
                  </div>
                ) : (
                  starredMessages.map((msg) => {
                    const mine = msg.senderType === 'patient';
                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl ${
                          mine
                            ? 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 ml-8'
                            : 'bg-gray-50 border border-gray-100 mr-8'
                        }`}
                      >
                        <div className={`text-xs font-bold mb-2 ${mine ? 'text-pink-600' : 'text-purple-600'}`}>
                          {mine ? 'You' : doctor?.name || 'Doctor'} · {formatDate(msg.createdAt)}
                        </div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">
                          {msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 font-bold">📎 {msg.attachments.length} attachment(s)</div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== SEARCH IN CHAT DRAWER ========== */}
      <AnimatePresence>
        {showSearchDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchDrawer(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-[61] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Search className="w-7 h-7" />
                    <div>
                      <div className="text-xl font-black">Search in Chat</div>
                      <div className="text-xs text-white/80 font-medium">Find messages quickly</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSearchDrawer(false)}
                    className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                  <input
                    value={searchInChat}
                    onChange={(e) => { setSearchInChat(e.target.value); setSearchHighlightIndex(0); }}
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-800 text-sm font-bold placeholder:text-gray-400 outline-none"
                  />
                </div>
                {searchInChat.trim() && (
                  <div className="mt-3 flex items-center justify-between text-sm font-bold">
                    <span className="text-white/90">
                      {filteredSearchMessages.indices.length} result(s)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSearchHighlightIndex((i) => Math.max(0, i - 1))}
                        className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4 rotate-90" />
                      </button>
                      <span className="px-2">{searchHighlightIndex + 1}/{filteredSearchMessages.indices.length || 0}</span>
                      <button
                        onClick={() => setSearchHighlightIndex((i) => Math.min(filteredSearchMessages.indices.length - 1, i + 1))}
                        className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                      >
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredSearchMessages.indices.length === 0 && searchInChat.trim() ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                      <SearchX className="w-10 h-10 text-sky-400" />
                    </div>
                    <div className="font-bold text-gray-700 mb-1">No results found</div>
                    <div className="text-sm text-gray-500">Try different keywords</div>
                  </div>
                ) : filteredSearchMessages.indices.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Filter className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="font-bold text-gray-700 mb-1">Start searching</div>
                    <div className="text-sm text-gray-500">Type to find messages in this conversation</div>
                  </div>
                ) : (
                  filteredSearchMessages.indices.map((idx, count) => {
                    const msg = messages[idx];
                    const mine = msg.senderType === 'patient';
                    return (
                      <motion.div
                        key={`${msg._id}-${count}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-2xl cursor-pointer hover:shadow-md transition-all ${
                          count === searchHighlightIndex
                            ? 'ring-2 ring-yellow-400 shadow-lg'
                            : ''
                        } ${mine ? 'bg-pink-50 border border-pink-100' : 'bg-gray-50 border border-gray-100'}`}
                        onClick={() => {
                          setShowSearchDrawer(false);
                          const el = document.querySelector(`[data-msg-id="${msg._id}"]`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        <div className={`text-[11px] font-bold mb-1 ${mine ? 'text-pink-600' : 'text-purple-600'}`}>
                          {mine ? 'You' : doctor?.name || 'Doctor'} · {formatTime(msg.createdAt)}
                        </div>
                        <div className="text-sm text-gray-800">
                          {msg.content.split(new RegExp(`(${searchInChat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                            part.toLowerCase() === searchInChat.toLowerCase()
                              ? <mark key={i} className="bg-yellow-300 rounded px-0.5">{part}</mark>
                              : <span key={i}>{part}</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== SETTINGS / WALLPAPER DRAWER ========== */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsDrawer(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-full sm:w-[420px] bg-white z-[61] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Palette className="w-7 h-7" />
                    <div>
                      <div className="text-xl font-black">Chat Settings</div>
                      <div className="text-xs text-white/80 font-medium">Customize your experience</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettingsDrawer(false)}
                    className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    <h3 className="text-sm font-black text-gray-800">Chat Wallpaper</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {WALLPAPERS.map((wp) => (
                      <motion.button
                        key={wp.id}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setCurrentWallpaper(wp)}
                        className={`aspect-video rounded-2xl border-4 overflow-hidden shadow-md transition-all ${
                          currentWallpaper.id === wp.id
                            ? 'border-purple-500 ring-4 ring-purple-200'
                            : 'border-transparent hover:border-purple-200'
                        }`}
                        style={wp.style}
                      >
                        <div className="w-full h-full flex items-end p-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${currentWallpaper.id === wp.id ? 'bg-purple-500 text-white' : 'bg-white/80 text-gray-600 backdrop-blur'}`}>
                            {wp.name}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-black text-gray-800">Privacy & Encryption</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    All your conversations are end-to-end encrypted. Only you and your doctor can read messages.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl inline-flex">
                    <CheckCheck className="w-3.5 h-3.5" /> Encrypted & Secure
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== FORWARD MESSAGE MODAL ========== */}
      <AnimatePresence>
        {showForwardModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForwardModal(false)}
              className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-[1.8rem] bg-white shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                  <div className="flex items-center gap-3">
                    <Forward className="w-7 h-7" />
                    <div>
                      <div className="text-xl font-black">Forward Message</div>
                      <div className="text-xs text-white/80 font-medium">Choose a doctor to forward to</div>
                    </div>
                  </div>
                </div>
                {forwardMsg && (
                  <div className="p-4 mx-5 mt-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      {forwardMsg.senderType === 'patient' ? 'From You' : `From ${doctor?.name || 'Doctor'}`}
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-2">
                      {forwardMsg.content.slice(0, 150)}{forwardMsg.content.length > 150 ? '...' : ''}
                    </div>
                  </div>
                )}
                <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
                  {allDoctors.map((d, idx) => (
                    <motion.button
                      key={d.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => executeForward(d.id)}
                      disabled={d.id === doctorId}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${
                        d.id === doctorId
                          ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'hover:bg-gradient-to-r from-pink-50 to-purple-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                        ['from-pink-400 to-rose-500', 'from-violet-400 to-purple-500', 'from-sky-400 to-blue-500', 'from-emerald-400 to-teal-500'][idx % 4]
                      } flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0`}>
                        {chatListInitials(d.name)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-bold text-gray-800 truncate">{d.name}</div>
                        <div className="text-xs text-gray-500 truncate">{d.specialty} · {d.hospital}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  ))}
                </div>
                <div className="p-5 border-t border-gray-50 flex gap-3">
                  <button
                    onClick={() => setShowForwardModal(false)}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== PRESCRIPTION DRAWER ========== */}
      <AnimatePresence>
        {showPrescriptionDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrescriptionDrawer(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-white z-[61] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <Pill className="w-7 h-7" />
                    <div>
                      <div className="text-xl font-black">Prescriptions</div>
                      <div className="text-xs text-white/80 font-medium">{sharedPrescriptions.length} shared with you</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrescriptionDrawer(false)}
                    className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {sharedPrescriptions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <Pill className="w-10 h-10 text-violet-400" />
                    </div>
                    <div className="font-bold text-gray-700 mb-1">No prescriptions yet</div>
                    <div className="text-sm text-gray-500">Prescriptions shared by your doctor will appear here</div>
                  </div>
                ) : (
                  sharedPrescriptions.map((presc) => (
                    <motion.div
                      key={presc.msgId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                            <Pill className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-gray-800 truncate">{presc.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {doctor?.name || 'Doctor'} · {formatDate(presc.date)}
                            </div>
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                              presc.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' :
                              presc.status === 'refill' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {presc.status === 'fulfilled' ? '✓ Fulfilled' :
                               presc.status === 'refill' ? '⟳ Refill Available' :
                               '📋 Sent'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex gap-2">
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/ai-chat')}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> AI Review
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate('/appointments')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 ${
                            presc.status === 'refill'
                              ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white'
                              : 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                          }`}
                        >
                          {presc.status === 'refill' ? (
                            <><RotateCcw className="w-3.5 h-3.5" /> Refill</>
                          ) : (
                            <><Calendar className="w-3.5 h-3.5" /> Follow Up</>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== CALL HISTORY DRAWER ========== */}
      <AnimatePresence>
        {showCallLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCallLog(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-white z-[61] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PhoneCall className="w-7 h-7" />
                    <div>
                      <div className="text-xl font-black">Call History</div>
                      <div className="text-xs text-white/80 font-medium">{callLog.length} calls logged</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCallLog(false)}
                    className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl bg-white/20 backdrop-blur text-xs font-bold">All</button>
                  <button className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur text-xs font-bold">Missed</button>
                  <button className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur text-xs font-bold">Voice</button>
                  <button className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur text-xs font-bold">Video</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {callLog.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <PhoneCall className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div className="font-bold text-gray-700 mb-1">No call history</div>
                    <div className="text-sm text-gray-500">Your calls with doctors will appear here</div>
                  </div>
                ) : (
                  callLog.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3.5 rounded-2xl bg-gray-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all group flex items-center gap-3"
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`rounded-2xl bg-gradient-to-br ${
                          entry.type === 'voice' ? 'from-emerald-500 to-teal-600' : 'from-violet-500 to-indigo-600'
                        } flex items-center justify-center text-white shadow-md`} style={{width: 52, height: 52}}>
                          {entry.type === 'voice' ? <Phone className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">{entry.doctorName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            entry.direction === 'missed' ? 'bg-red-100 text-red-600' :
                            entry.direction === 'incoming' ? `bg-blue-100 text-blue-600` : 'bg-green-100 text-green-600'
                          }`}>
                            {entry.direction.charAt(0).toUpperCase() + entry.direction.slice(1)}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">{entry.doctorSpecialty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-medium">
                          <Clock className="w-3 h-3" /> {formatDate(entry.date)} · {formatCallDuration(entry.duration)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => callBackFromLog({ ...entry, type: 'voice' })}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md"
                        >
                          <Phone className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => callBackFromLog({ ...entry, type: 'video' })}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center shadow-md"
                        >
                          <Video className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== WebRTC Audio/Video Call Overlay ========== */}
      {activeCall && user && (
        <CallOverlay
          isOpen={activeCall.isOpen}
          callType={activeCall.callType}
          initialStatus={activeCall.initialStatus}
          remoteParticipant={activeCall.remoteParticipant}
          currentUser={{
            id: user.id,
            name: user.name || 'Patient',
            role: 'Patient',
          }}
          conversationId={doctorId || ''}
          incomingOffer={activeCall.incomingOffer}
          onClose={handleCallOverlayClose}
        />
      )}
    </div>
  );
}