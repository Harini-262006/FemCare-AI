import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, Users, MessageCircle, Calendar, Bell, LogOut,
  Send, Search, Clock, CheckCircle2, Shield, Heart, User,
  Paperclip, Image as ImageIcon, Sparkles, RefreshCcw, Activity,
  FileText, X, Download, Upload, Phone, Video, Pill, Power, Plus
} from 'lucide-react';
import { useAppStore } from '../store';
import { doctorAPI, prescriptionAPI, appointmentAPI, ApiAppointment } from '../services/api';
import { getSocket, registerSocketUser } from '../services/socket';
import { CallOverlay, CallStatus as WebRTCCallStatus } from '../components/CallOverlay';

interface PatientConversation {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      age?: number;
      bloodGroup?: string;
    };
  };
  doctorId: string;
  lastMessage?: string;
  unreadCount?: number;
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  content: string;
  attachments?: Array<{ name: string; type: string; size?: number; dataUrl: string }>;
  createdAt: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const logoutUser = useAppStore((state) => state.logoutUser);

  const [conversations, setConversations] = useState<PatientConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<PatientConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'patients' | 'appointments'>('chats');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ file: File; url: string; isImage: boolean }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Doctor Online Status
  const [doctorStatus, setDoctorStatus] = useState<'Online' | 'In Consultation' | 'Offline'>('Online');

  // Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [issuingPrescription, setIssuingPrescription] = useState(false);

  // Appointments State
  const [doctorAppointments, setDoctorAppointments] = useState<ApiAppointment[]>([]);

  // WebRTC Call State
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    callType: 'audio' | 'video';
    initialStatus: WebRTCCallStatus;
    remoteParticipant: { id: string; name: string; role: string; avatar?: string };
    incomingOffer?: any;
  } | null>(null);

  // Register Doctor Socket & Listen for Incoming Calls
  useEffect(() => {
    if (user?.id) {
      registerSocketUser(user.id, 'doctor');
      const socket = getSocket();
      const handleIncomingCall = (data: {
        fromUser: { id: string; name: string; role: string; avatar?: string };
        callType: 'audio' | 'video';
        conversationId: string;
        offer: any;
      }) => {
        setActiveCall({
          isOpen: true,
          callType: data.callType,
          initialStatus: 'incoming',
          remoteParticipant: {
            id: data.fromUser.id,
            name: data.fromUser.name,
            role: 'Patient',
          },
          incomingOffer: data.offer,
        });
      };

      socket.on('call-incoming', handleIncomingCall);
      return () => {
        socket.off('call-incoming', handleIncomingCall);
      };
    }
  }, [user?.id]);

  const handleStartCall = (callType: 'audio' | 'video') => {
    if (!selectedConversation || !user?.id) return;
    setActiveCall({
      isOpen: true,
      callType,
      initialStatus: 'calling',
      remoteParticipant: {
        id: selectedConversation.userId._id,
        name: selectedConversation.userId.name || 'Patient',
        role: 'Patient',
      },
    });
  };

  const handleCallOverlayClose = (durationSeconds: number, summaryText: string) => {
    if (activeCall && selectedConversation && summaryText) {
      doctorAPI.sendMessage({
        doctorId: user?.id || '',
        userId: selectedConversation.userId._id,
        content: `📞 ${summaryText}`,
      }).catch(() => {});
    }
    setActiveCall(null);
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !prescriptionForm.medication.trim() || issuingPrescription) return;
    try {
      setIssuingPrescription(true);
      await prescriptionAPI.createPrescription({
        userId: selectedConversation.userId._id,
        medication: prescriptionForm.medication.trim(),
        dosage: prescriptionForm.dosage.trim(),
        frequency: prescriptionForm.frequency.trim(),
        duration: prescriptionForm.duration.trim(),
        instructions: prescriptionForm.instructions.trim(),
      });
      setShowPrescriptionModal(false);
      setPrescriptionForm({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });
      // Send chat notification
      await doctorAPI.sendMessage({
        doctorId: user?.id || '',
        userId: selectedConversation.userId._id,
        content: `📋 Issued Prescription: ${prescriptionForm.medication} (${prescriptionForm.dosage}, ${prescriptionForm.frequency} for ${prescriptionForm.duration})`,
      });
    } catch (err: any) {
      console.error('Failed to issue prescription:', err);
    } finally {
      setIssuingPrescription(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, status);
      const updated = await appointmentAPI.getDoctorAppointments();
      setDoctorAppointments(updated);
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const combined = [...selectedFiles, ...newFiles].slice(0, 5);
      setSelectedFiles(combined);

      const previews = combined.map((file) => {
        const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(file.name);
        return {
          file,
          url: URL.createObjectURL(file),
          isImage: isImg,
        };
      });
      setFilePreviews(previews);
    }
  };

  const removeSelectedFile = (index: number) => {
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);
    const nextPreviews = filePreviews.filter((_, i) => i !== index);
    setFilePreviews(nextPreviews);
  };

  // Poll for new messages every 4 seconds as fallback to socket
  useEffect(() => {
    let isMounted = true;

    const fetchConversations = async () => {
      try {
        const data = await doctorAPI.getConversations();
        if (isMounted) {
          setConversations(data as any);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching doctor conversations:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const data = await doctorAPI.getConversation(selectedConversation.userId._id);
        if (isMounted) {
          setMessages(data.messages as any);
        }
      } catch (err) {
        console.error('Error fetching conversation messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && selectedFiles.length === 0) || !selectedConversation || sending) return;

    try {
      setSending(true);
      const text = inputMessage.trim();
      const filesToSend = [...selectedFiles];

      setInputMessage('');
      setSelectedFiles([]);
      setFilePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const patientUserId = typeof selectedConversation.userId === 'object' ? selectedConversation.userId._id : selectedConversation.userId;

      const res = await doctorAPI.sendMessage({
        doctorId: selectedConversation.doctorId,
        userId: patientUserId,
        conversationId: selectedConversation._id,
        content: text,
        images: filesToSend,
      });

      setMessages(res.messages as any);
    } catch (err) {
      console.error('Error sending doctor message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const filteredConversations = conversations.filter((c) =>
    c.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-purple-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                FemCare AI <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">Doctor Portal</span>
              </h1>
              <p className="text-xs text-gray-600 font-semibold">Welcome back, {user?.name || 'Doctor'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={doctorStatus}
              onChange={(e) => setDoctorStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="Online">🟢 Online</option>
              <option value="In Consultation">🟡 In Consultation</option>
              <option value="Offline">🔴 Offline</option>
            </select>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar - Doctor Info & Conversations */}
        <div className="lg:col-span-4 space-y-6">
          {/* Doctor Profile Card */}
          <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black border border-white/30">
                  👨‍⚕️
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.name || 'Dr. Specialist'}</h2>
                  <p className="text-xs text-purple-200 font-semibold">{user?.specialty || 'Gynecology & Obstetrics'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/15 text-xs">
                <div className="bg-white/10 rounded-xl p-2.5">
                  <span className="text-purple-200 block text-[10px] font-semibold">Active Patients</span>
                  <span className="text-lg font-black">{conversations.length}</span>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5">
                  <span className="text-purple-200 block text-[10px] font-semibold">Role Verified</span>
                  <span className="text-lg font-black text-emerald-300 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Doctor
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Conversation List */}
          <div className="bg-white rounded-3xl p-5 shadow-lg border border-purple-50 flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                Patient Consultations
              </h3>
              <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                {filteredConversations.length}
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="text-center py-10 text-gray-500 text-sm font-semibold">Loading patients...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">No patient messages yet</p>
                  <p className="text-xs text-gray-500">Patient requests will appear here</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?._id === conv._id;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                          : 'hover:bg-purple-50/60 border border-transparent'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {conv.userId?.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {conv.userId?.name || 'Patient'}
                          </span>
                          <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-gray-600'} font-semibold`}>
                            {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${isSelected ? 'text-purple-100' : 'text-gray-600'} font-medium`}>
                          {conv.lastMessage || 'No recent messages'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Area - Interactive Chat Box */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-purple-50 flex flex-col h-[700px] overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {selectedConversation.userId?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {selectedConversation.userId?.name || 'Patient'}
                    </h3>
                    <p className="text-xs text-gray-600 font-semibold">
                      {selectedConversation.userId?.email || 'Registered Patient'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartCall('audio')}
                    className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200 transition-colors"
                    title="Audio Call Patient"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center border border-purple-200 transition-colors"
                    title="Video Call Patient"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowPrescriptionModal(true)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity"
                    title="Issue Prescription"
                  >
                    <Pill className="w-3.5 h-3.5" /> Prescription
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                    <p className="font-bold text-gray-700">No conversation history yet</p>
                    <p className="text-xs text-gray-500">Send a greeting message to start consulting</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isDoctor = msg.senderType === 'doctor';
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl p-4 shadow-sm text-sm font-medium ${
                            isDoctor
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-75 mb-1">
                            {isDoctor ? 'Doctor (You)' : selectedConversation.userId?.name || 'Patient'}
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {msg.attachments.map((att: any, idx: number) => {
                                const rawUrl = att.url || att.dataUrl || '';
                                const fileUrl = rawUrl.startsWith('/') && typeof window !== 'undefined' ? `${window.location.origin}${rawUrl}` : rawUrl;
                                const isImg = att.type?.startsWith('image/') || att.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|svg)$/i.test(att.name || '');
                                return (
                                  <div key={idx} className="rounded-xl overflow-hidden">
                                    {isImg ? (
                                      <a href={fileUrl} target="_blank" rel="noreferrer">
                                        <img
                                          src={fileUrl}
                                          alt={att.name || 'Attachment image'}
                                          className="max-h-56 w-full object-cover rounded-xl border border-purple-200/50 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                                        />
                                      </a>
                                    ) : (
                                      <div className={`flex items-center justify-between p-3 rounded-xl border ${isDoctor ? 'bg-white/15 text-white border-white/20' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDoctor ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                                            <FileText className="w-5 h-5" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">{att.name || 'Attachment file'}</p>
                                            <p className={`text-[10px] ${isDoctor ? 'text-purple-200' : 'text-gray-500'}`}>
                                              {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Document'}
                                            </p>
                                          </div>
                                        </div>
                                        <a
                                          href={fileUrl}
                                          download={att.name || 'attachment'}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${isDoctor ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'}`}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Open/Save</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className={`text-[10px] text-right mt-1.5 font-semibold ${isDoctor ? 'text-purple-200' : 'text-gray-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Selected File Previews */}
              {filePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2.5 p-3 border-t border-purple-100 bg-purple-50/60">
                  {filePreviews.map((p, idx) => (
                    <div key={idx} className="relative group bg-white p-2 rounded-xl border border-purple-100 shadow-sm flex items-center gap-2 max-w-xs">
                      {p.isImage ? (
                        <img src={p.url} alt={p.file.name} className="w-12 h-12 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-xs font-bold text-gray-800 truncate">{p.file.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{(p.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx,.zip"
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl transition-all font-bold flex items-center justify-center"
                    title="Attach Images or Documents"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type your medical response or advice..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-gray-900 placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={(!inputMessage.trim() && selectedFiles.length === 0) || sending}
                    className="py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4 text-purple-600 shadow-inner">
                <Stethoscope className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Patient to Consult</h3>
              <p className="text-gray-600 max-w-sm text-sm font-medium">
                Choose a patient from the consultation list on the left to review messages, medical notes, and reply in real-time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== PRESCRIPTION CREATION MODAL ========== */}
      <AnimatePresence>
        {showPrescriptionModal && selectedConversation && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-purple-100"
            >
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Issue Prescription</h3>
                    <p className="text-xs text-gray-500 font-medium">Patient: {selectedConversation.userId?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePrescription} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Medication Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin / Iron Supplement"
                    value={prescriptionForm.medication}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={prescriptionForm.dosage}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. Twice daily"
                      value={prescriptionForm.frequency}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days"
                      value={prescriptionForm.duration}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Take after meals with water."
                    value={prescriptionForm.instructions}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuingPrescription || !prescriptionForm.medication.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50"
                  >
                    {issuingPrescription ? 'Issuing...' : 'Issue Prescription'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
            name: user.name || 'Doctor',
            role: 'Doctor',
          }}
          conversationId={selectedConversation?._id || ''}
          incomingOffer={activeCall.incomingOffer}
          onClose={handleCallOverlayClose}
        />
      )}
    </div>
  );
}
