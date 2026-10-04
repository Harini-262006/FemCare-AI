import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  MessageSquare,
  Plus,
  Send,
  User,
  Bot,
  Trash2,
  Edit2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Moon,
  Sun,
  Menu,
  X,
  Search,
  Paperclip,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Camera,
  Share2,
  Check,
  Heart,
  Leaf,
  Flower2,
  Activity,
  Moon as MoonIcon,
  Volume2,
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Mic,
  Music,
  Video,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatAPI, ApiAttachmentMetadata } from '../services/api';
import { useAppStore, useProfile } from '../store';
import { useTheme } from '../hooks/useTheme';
import BackToHomeButton from '../components/BackToHomeButton';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  files?: string[];
  attachmentsMetadata?: ApiAttachmentMetadata[];
  feedback?: 'like' | 'dislike';
  createdAt: Date;
}

interface Conversation {
  _id: string;
  title: string;
  isCustomTitle?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileCategoryIcon(filename: string, mimetype?: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || mimetype?.startsWith('image/')) {
    return { icon: ImageIcon, color: 'from-pink-500 to-rose-500', label: 'IMG' };
  }
  if (['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(ext) || mimetype?.startsWith('audio/')) {
    return { icon: Music, color: 'from-purple-500 to-indigo-500', label: 'AUDIO' };
  }
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || mimetype?.startsWith('video/')) {
    return { icon: Video, color: 'from-violet-500 to-purple-600', label: 'VIDEO' };
  }
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    return { icon: FileText, color: 'from-red-500 to-rose-600', label: 'PDF' };
  }
  if (['docx', 'doc'].includes(ext) || mimetype?.includes('word')) {
    return { icon: FileText, color: 'from-blue-500 to-indigo-600', label: 'DOCX' };
  }
  if (ext === 'csv' || mimetype?.includes('csv')) {
    return { icon: FileSpreadsheet, color: 'from-emerald-500 to-teal-600', label: 'CSV' };
  }
  return { icon: FileText, color: 'from-slate-500 to-gray-600', label: 'TXT' };
}

export default function Chat() {
  const { toggleTheme, isDark } = useTheme();
  const storeUser = useAppStore((s) => s.user);
  const profile = useProfile();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  // Multimodal Attachments State (Images, Docs, Audio, Video)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Rename Chat Modal State
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetConv, setRenameTargetConv] = useState<Conversation | null>(null);
  const [renameInputTitle, setRenameInputTitle] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const openRenameModal = (conv: Conversation) => {
    setRenameTargetConv(conv);
    setRenameInputTitle(conv.title);
    setRenameError(null);
    setRenameModalOpen(true);
  };

  const handleSaveRename = async () => {
    if (!renameTargetConv) return;
    const trimmed = renameInputTitle.trim();
    if (!trimmed) {
      setRenameError('Chat name cannot be empty.');
      return;
    }
    setIsRenamingLoading(true);
    setRenameError(null);
    try {
      const updated = await chatAPI.renameConversation(renameTargetConv._id, trimmed);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === renameTargetConv._id
            ? { ...c, title: updated.title, isCustomTitle: true, updatedAt: new Date(updated.updatedAt || Date.now()) }
            : c
        )
      );
      setRenameModalOpen(false);
      setRenameTargetConv(null);
    } catch (err: any) {
      console.error('Failed to rename conversation:', err);
      setRenameError(err.message || 'Failed to rename conversation. Please try again.');
    } finally {
      setIsRenamingLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(
        data.map((conv) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
        }))
      );
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => {
    if (storeUser && storeUser.token) {
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
      loadConversations();
    }
  }, [storeUser?.id, storeUser?.email, storeUser?.token]);

  const loadConversation = async (id: string) => {
    try {
      const data = await chatAPI.getConversation(id);
      setMessages(
        data.messages.map((msg) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        }))
      );
      setCurrentConversationId(id);
      setMobileSidebarOpen(false);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const createNewConversation = async () => {
    try {
      const data = await chatAPI.createConversation();
      const newConv: Conversation = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(data._id);
      setMessages([]);
      setMobileSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  // Multimodal File Validation Logic
  const handleAddFiles = (filesToAdd: File[]) => {
    setUploadError(null);

    if (selectedFiles.length + filesToAdd.length > 5) {
      setUploadError('Maximum 5 files allowed per message.');
      return;
    }

    const validated: File[] = [];
    for (const file of filesToAdd) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || file.type.startsWith('image/');
      const isDoc = ['pdf', 'docx', 'doc', 'txt', 'csv'].includes(ext) || 
        file.type === 'application/pdf' || 
        file.type === 'text/plain' || 
        file.type === 'text/csv' ||
        file.type.includes('word');
      const isAudio = ['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(ext) || file.type.startsWith('audio/');
      const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(ext) || file.type.startsWith('video/');

      if (!isImage && !isDoc && !isAudio && !isVideo) {
        setUploadError(`File type "${file.name}" is not supported.`);
        return;
      }

      if (isImage && file.size > 10 * 1024 * 1024) {
        setUploadError(`Image "${file.name}" exceeds 10 MB limit.`);
        return;
      }

      if ((isDoc || isAudio || isVideo) && file.size > 25 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 25 MB limit.`);
        return;
      }

      validated.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validated]);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections && fileRejections.length > 0) {
        setUploadError('Some files exceed allowed size limits (10MB images, 25MB docs/audio/video).');
      }
      if (acceptedFiles.length > 0) {
        handleAddFiles(acceptedFiles);
      }
    },
    [selectedFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxFiles: 5,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const finalInput = customPrompt || input;
    if (!finalInput.trim() && selectedFiles.length === 0) return;
    if (isTyping) return;

    setUploadError(null);

    const imagesToPreview: string[] = [];
    const docsToPreview: string[] = [];

    selectedFiles.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || file.type.startsWith('image/')) {
        imagesToPreview.push(URL.createObjectURL(file));
      } else {
        docsToPreview.push(file.name);
      }
    });

    const userMessage: Message = {
      _id: Date.now().toString(),
      role: 'user',
      content: finalInput,
      images: imagesToPreview,
      files: docsToPreview,
      createdAt: new Date(),
    };

    const filesToSend = [...selectedFiles];

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    setIsTyping(true);
    setAttachMenuOpen(false);

    if (filesToSend.length > 0) {
      setUploadStatus(`Analyzing ${filesToSend.length} attachment(s) (Gemini Vision, Whisper, OCR)...`);
      setUploadProgress(40);
    }

    let aiContent = '';
    const updateAiMessage = (chunk: string) => {
      setUploadStatus(null);
      setUploadProgress(null);
      aiContent += chunk;
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: aiContent },
          ];
        }
        return [
          ...prev,
          {
            _id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiContent,
            createdAt: new Date(),
          },
        ];
      });
    };

    try {
      if (filesToSend.length > 0) {
        setUploadProgress(75);
      }
      await chatAPI.sendMessage(
        currentConversationId,
        finalInput,
        updateAiMessage,
        filesToSend
      );
      await loadConversations();
    } catch (err) {
      console.error('Failed to send multimodal message', err);
    } finally {
      setUploadStatus(null);
      setUploadProgress(null);
      setIsTyping(false);
    }
  };

  const handleFeedback = async (id: string, feedback: 'like' | 'dislike') => {
    try {
      await chatAPI.feedbackMessage(id, feedback);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === id ? { ...msg, feedback } : msg))
      );
    } catch (err) {
      console.error('Failed to send feedback', err);
    }
  };

  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareConversation = async () => {
    if (messages.length === 0) {
      alert('No messages to share in this conversation.');
      return;
    }

    const currentTitle =
      conversations.find((c) => c._id === currentConversationId)?.title ||
      'FemCare AI Multimodal Conversation';
    const formattedTranscript = messages
      .map((m) => `[${m.role === 'user' ? 'User' : 'FemCare AI'}]\n${m.content}`)
      .join('\n\n---\n\n');

    const shareText = `FemCare AI Chat - ${currentTitle}:\n\n${formattedTranscript}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTitle,
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          alert('Conversation transcript copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Conversation transcript copied to clipboard!');
    }
  };

  const speakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await chatAPI.deleteConversation(id);
      setConversations((prev) => prev.filter((conv) => conv._id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickPrompts = [
    {
      icon: Heart,
      label: 'Fatigue & Health Analysis',
      prompt: 'Why am I feeling tired and low on energy recently? Please analyze my profile, sleep, stress, and stored medical reports automatically.',
    },
    {
      icon: Leaf,
      label: profile?.pcos === 'Yes' ? 'PCOS Balanced Diet' : 'Personalized Nutrition Plan',
      prompt: profile?.pcos === 'Yes'
        ? 'Create a customized PCOS-friendly meal plan considering my profile, lifestyle, and dietary preferences to balance hormones.'
        : 'Suggest a nutrient-dense meal plan tailored to my women’s health profile, energy goals, and daily routine.',
    },
    {
      icon: Flower2,
      label: 'Cycle & Symptom Guidance',
      prompt: 'Based on my recorded cycle information and symptoms, what self-care, herbal teas, or lifestyle remedies can relieve my discomfort?',
    },
    {
      icon: FileText,
      label: 'Explain My Lab Reports',
      prompt: 'Please summarize my uploaded medical/lab reports on file in simple terms and tell me what questions I should ask my doctor.',
    },
  ];

  const userName = storeUser?.name || profile?.name || 'there';

  return (
    <div
      {...getRootProps()}
      className={`relative h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-white' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 text-slate-900'
      }`}
    >
      <input {...getInputProps()} />

      {/* Drag & Drop Visual Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-pink-500/20 backdrop-blur-md border-4 border-dashed border-pink-500 flex flex-col items-center justify-center pointer-events-none p-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xl mb-4 animate-bounce">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white drop-shadow-md">Drop files here to analyze!</h2>
            <p className="text-sm font-semibold text-white/90 mt-1">
              Supports Images (JPG, PNG, WEBP, HEIC), Videos (MP4, MOV, AVI, MKV), Documents (PDF, DOCX, TXT, CSV), & Audio (MP3, WAV, M4A, OGG)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex h-full">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {(sidebarOpen || mobileSidebarOpen) && (
            <motion.aside
              initial={{ x: -360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -360, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className={`
                fixed md:relative z-40 md:z-0 h-full flex flex-col
                ${mobileSidebarOpen ? 'w-80' : 'w-80 md:w-80'}
                ${isDark ? 'bg-slate-900/95 border-slate-800/80 text-white' : 'bg-white/90 border-slate-200/80 text-slate-900'}
                backdrop-blur-2xl border-r shadow-2xl md:shadow-xl transition-colors duration-300
              `}
            >
              {/* Sidebar Header */}
              <div className="relative p-5 border-b border-inherit overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
                        FemCare AI
                      </h2>
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Multimodal Assistant ✨
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createNewConversation}
                  className="group relative w-full overflow-hidden rounded-2xl p-3.5 font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-shadow"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500" />
                  <div className="relative z-10 flex items-center justify-center gap-2.5">
                    <Plus className="w-5 h-5" />
                    <span>New Multimodal Chat</span>
                  </div>
                </motion.button>
              </div>

              {/* Search */}
              <div className="p-4">
                <div
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${
                    isDark ? 'bg-slate-800/70 border border-slate-700/50' : 'bg-slate-100/80 border border-slate-200/80'
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 scrollbar-thin">
                <AnimatePresence>
                  {filteredConversations.map((conv) => (
                    <motion.div key={conv._id} className="relative group">
                      <button
                        onClick={() => loadConversation(conv._id)}
                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-2 transition-all ${
                          currentConversationId === conv._id
                            ? isDark
                              ? 'bg-fuchsia-900/40 border border-fuchsia-500/40 text-white'
                              : 'bg-pink-100/90 border border-pink-300/60 text-slate-900'
                            : isDark
                            ? 'hover:bg-slate-800/60 text-slate-300'
                            : 'hover:bg-slate-100/80 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <MessageSquare className="w-4 h-4 text-pink-500 flex-shrink-0" />
                          <span className="text-sm font-semibold truncate">{conv.title}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenameModal(conv);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 transition-colors"
                            title="Rename Chat"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv._id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete Chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
          {/* Header */}
          <header
            className={`p-3 md:p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800/60 text-white' : 'bg-white/90 border-slate-200/60 text-slate-900'
            } backdrop-blur-xl z-30 transition-colors duration-300`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:flex p-2 rounded-xl hover:bg-slate-500/10"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-slate-500/10"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Back to Home Button in Header top-left */}
              <BackToHomeButton showText={true} className="flex-shrink-0" />

              <div className="min-w-0 hidden sm:block">
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight flex items-center gap-2 truncate">
                  <span className="truncate">FemCare AI Multimodal Assistant</span>
                  <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-500 border border-pink-500/30">
                    Gemini Vision + Whisper
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">Text • Images • Videos • PDFs • DOCX • Audio</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleShareConversation}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-500/10"
                title="Share Transcript"
              >
                <Share2 className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-500/10 text-pink-500 transition-transform active:scale-95"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400" /> : <Moon className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />}
              </button>
            </div>
          </header>

          {/* Active Context Intelligence Bar */}
          <div className="px-4 py-2 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-teal-500/10 border-b border-pink-500/15 flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="truncate">
                Auto-Context Active: <strong>{profile?.bloodGroup ? `Blood: ${profile.bloodGroup}` : 'Profile Connected'}</strong> {profile?.pcos === 'Yes' ? '• PCOS' : ''} {profile?.pregnancyStatus === 'Yes' ? '• Pregnant' : ''} • Stored Lab Reports & Vitals Auto-Loaded
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl w-full mx-auto space-y-6 scrollbar-thin">
            {messages.length === 0 && !isTyping ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black mb-2">Hello, {userName}! 💕</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6 text-xs sm:text-sm leading-relaxed">
                  I automatically analyze your saved health profile and stored medical reports. Ask any question or upload new documents!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(undefined, qp.prompt)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        isDark ? 'bg-slate-900/70 border-slate-800 hover:border-pink-500/50 text-slate-200' : 'bg-white/80 border-slate-200 hover:border-pink-300 text-slate-800'
                      }`}
                    >
                      <h4 className="font-bold text-sm mb-1">{qp.label}</h4>
                      <p className="text-xs text-slate-500">Click to send prompt →</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble
                  key={msg._id || idx}
                  message={msg}
                  index={idx}
                  isDark={isDark}
                  onFeedback={handleFeedback}
                  onCopy={copyToClipboard}
                  copiedId={copiedId}
                  onSpeak={speakMessage}
                  onImageClick={setZoomImage}
                />
              ))
            )}
            {isTyping && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 text-sm font-semibold animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{uploadStatus || 'FemCare AI is thinking...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Multimodal Input Bar */}
          <div
            className={`p-3 md:p-5 border-t ${
              isDark ? 'bg-slate-900/95 border-slate-800/70' : 'bg-white/95 border-slate-200/70'
            } backdrop-blur-2xl z-20 transition-colors duration-300`}
          >
            <div className="max-w-4xl mx-auto">
              {/* Validation Error Toast */}
              <AnimatePresence>
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Indicator */}
              {uploadProgress !== null && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-bold text-pink-500 mb-1">
                    <span>Analyzing Multimodal Attachments & Transcriptions...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Previews Bar */}
              <AnimatePresence>
                {selectedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin"
                  >
                    {selectedFiles.map((file, idx) => {
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || file.type.startsWith('image/');
                      const cat = getFileCategoryIcon(file.name, file.type);
                      const IconComp = cat.icon;

                      return (
                        <div
                          key={idx}
                          className={`relative flex items-center gap-2.5 p-2 rounded-2xl border shadow-md flex-shrink-0 ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {isImage ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-11 h-11 rounded-xl object-cover border"
                            />
                          ) : (
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white font-black text-xs shadow-sm`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                          )}
                          <div className="max-w-[120px] truncate">
                            <p className="text-xs font-bold truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Multimodal Input Form */}
              <form onSubmit={handleSend} className="relative">
                <div
                  className={`flex items-end gap-1.5 sm:gap-2 p-2 rounded-3xl border transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700/80 focus-within:border-pink-500' : 'bg-white border-slate-300 focus-within:border-pink-500 shadow-xl'
                  }`}
                >
                  {/* Attach Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                      className="p-2.5 sm:p-3 rounded-2xl hover:bg-slate-500/10 text-slate-500 hover:text-pink-500 transition-colors"
                      title="Attach documents, audio, video, or photos"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {attachMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setAttachMenuOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute bottom-full left-0 mb-3 z-20 w-64 p-2 rounded-2xl border shadow-2xl ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setAttachMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-left text-xs font-bold"
                            >
                              <ImageIcon className="w-4 h-4 text-pink-500" />
                              Upload Images (JPG, PNG, WEBP, HEIC)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                pdfInputRef.current?.click();
                                setAttachMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-left text-xs font-bold"
                            >
                              <FileText className="w-4 h-4 text-red-500" />
                              Upload PDF Reports
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                docInputRef.current?.click();
                                setAttachMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-left text-xs font-bold"
                            >
                              <FileText className="w-4 h-4 text-blue-500" />
                              Upload DOCX / TXT / CSV
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                audioInputRef.current?.click();
                                setAttachMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-left text-xs font-bold"
                            >
                              <Music className="w-4 h-4 text-purple-500" />
                              Upload Audio (MP3, WAV, M4A, OGG)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                videoInputRef.current?.click();
                                setAttachMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-left text-xs font-bold"
                            >
                              <Video className="w-4 h-4 text-violet-500" />
                              Upload Video (MP4, MOV, AVI, MKV)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                cameraInputRef.current?.click();
                                setAttachMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-left text-xs font-bold"
                            >
                              <Camera className="w-4 h-4 text-rose-500" />
                              Take Photo
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Audio Picker Direct */}
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="p-2.5 sm:p-3 rounded-2xl hover:bg-slate-500/10 text-slate-500 hover:text-purple-500 transition-colors"
                    title="Upload Audio / Voice Note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* Hidden Inputs */}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    ref={pdfInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept=".docx,.doc,.txt,.csv,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    ref={docInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                    multiple
                    ref={audioInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="video/*,.mp4,.mov,.avi,.mkv"
                    multiple
                    ref={videoInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))}
                    className="hidden"
                  />

                  {/* Textarea */}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Message FemCare AI or attach files/audio/video..."
                    disabled={isTyping}
                    className={`flex-1 bg-transparent py-2.5 px-2 focus:outline-none text-xs sm:text-sm resize-none max-h-36 ${
                      isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!input.trim() && selectedFiles.length === 0) || isTyping}
                    className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <div
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setZoomImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={zoomImage} alt="Zoomed" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute -top-4 -right-4 p-3 rounded-full bg-white/20 text-white hover:bg-white/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Chat Modal */}
      <AnimatePresence>
        {renameModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!isRenamingLoading) {
                  setRenameModalOpen(false);
                  setRenameTargetConv(null);
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Rename Chat</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Enter a new name for your saved conversation
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isRenamingLoading) {
                      setRenameModalOpen(false);
                      setRenameTargetConv(null);
                    }
                  }}
                  disabled={isRenamingLoading}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-500/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveRename();
                }}
                className="space-y-4"
              >
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Conversation Title
                  </label>
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameInputTitle}
                    onChange={(e) => {
                      setRenameInputTitle(e.target.value);
                      if (renameError) setRenameError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && !isRenamingLoading) {
                        setRenameModalOpen(false);
                        setRenameTargetConv(null);
                      }
                    }}
                    placeholder="e.g. My Pregnancy Health Chat"
                    disabled={isRenamingLoading}
                    autoFocus
                    className={`w-full px-4 py-3 rounded-2xl text-sm font-medium border outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20'
                    }`}
                  />
                  {renameError && (
                    <p className="mt-2 text-xs font-semibold text-red-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{renameError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRenameModalOpen(false);
                      setRenameTargetConv(null);
                    }}
                    disabled={isRenamingLoading}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRenamingLoading || !renameInputTitle.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
                  >
                    {isRenamingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Title</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============ Message Bubble Component ============ */
function MessageBubble({
  message,
  isDark,
  onFeedback,
  onCopy,
  copiedId,
  onSpeak,
  onImageClick,
}: {
  message: Message;
  index: number;
  isDark: boolean;
  onFeedback: (id: string, feedback: 'like' | 'dislike') => void;
  onCopy: (id: string, content: string) => void;
  copiedId: string | null;
  onSpeak: (content: string) => void;
  onImageClick: (url: string) => void;
}) {
  const isUser = message.role === 'user';
  const [accordionOpen, setAccordionOpen] = useState(false);

  const hasAttachments =
    (message.images && message.images.length > 0) ||
    (message.files && message.files.length > 0) ||
    (message.attachmentsMetadata && message.attachmentsMetadata.length > 0);
  const totalAttachments =
    message.attachmentsMetadata?.length ||
    (message.images?.length || 0) + (message.files?.length || 0);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[90%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              isUser ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
            }`}
          >
            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && (
            <span className="text-xs font-bold mb-1 ml-1 text-slate-500">
              FemCare AI Multimodal Assistant
            </span>
          )}

          <div
            className={`p-4 md:p-5 rounded-3xl shadow-md text-sm leading-relaxed ${
              isUser
                ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-tr-none'
                : isDark
                ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}
          >
            {/* User Uploaded Images */}
            {message.images && message.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {message.images.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onImageClick(imgUrl)}
                    className="relative overflow-hidden rounded-xl border border-white/20 shadow-md group cursor-zoom-in"
                  >
                    <img src={imgUrl} alt="Attachment" className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            {/* User Uploaded Files */}
            {message.files && message.files.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {message.files.map((filename, i) => {
                  const cat = getFileCategoryIcon(filename);
                  const IconComp = cat.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold ${
                        isUser ? 'bg-white/10 border-white/20' : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <IconComp className="w-4 h-4 text-pink-400" />
                      <span className="truncate">{filename}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Analyzed Attachments Accordion Badge */}
            {!isUser && hasAttachments && (
              <div className="mb-3 border-b border-pink-500/20 pb-2">
                <button
                  type="button"
                  onClick={() => setAccordionOpen(!accordionOpen)}
                  className="flex items-center justify-between w-full text-xs font-bold text-pink-500 bg-pink-500/10 px-3 py-2 rounded-xl border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Analyzed {totalAttachments} attachment(s)
                  </span>
                  {accordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {accordionOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-2 space-y-2 text-xs p-3 rounded-xl border ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-pink-500 border-b border-inherit pb-1">Analyzed File Previews & Extracted Data:</p>

                      {message.attachmentsMetadata && message.attachmentsMetadata.length > 0 ? (
                        message.attachmentsMetadata.map((meta, i) => (
                          <div key={i} className={`space-y-1 p-2 rounded-lg border ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-500 font-bold uppercase">
                                {meta.mimeType?.split('/')[1] || 'FILE'}
                              </span>
                              {meta.filename}
                            </p>
                            {meta.imageObservations && (
                              <p className="text-[11px] whitespace-pre-wrap">
                                <span className="font-bold text-purple-500">Gemini Vision Summary:</span> {meta.imageObservations}
                              </p>
                            )}
                            {meta.audioTranscription && (
                              <p className="text-[11px] whitespace-pre-wrap">
                                <span className="font-bold text-indigo-500">Whisper Audio Transcription:</span> "{meta.audioTranscription}"
                              </p>
                            )}
                            {meta.extractedText && (
                              <p className="text-[11px] whitespace-pre-wrap">
                                <span className="font-bold text-emerald-500">Extracted Document Text:</span> {meta.extractedText.slice(0, 200)}...
                              </p>
                            )}
                            {meta.videoObservations && (
                              <p className="text-[11px] whitespace-pre-wrap">
                                <span className="font-bold text-violet-500">Video Keyframe Analysis:</span> {meta.videoObservations}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="space-y-1">
                          {message.files?.map((f, i) => (
                            <p key={i} className="truncate">• Attachment: {f}</p>
                          ))}
                          {message.images?.map((_, i) => (
                            <p key={`img-${i}`}>• Medical Visual Image #{i + 1}</p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Content Markdown */}
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : isDark ? 'prose-invert' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          </div>

          {/* Action buttons */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 ml-1 text-xs text-slate-400">
              <button type="button" onClick={() => onCopy(message._id, message.content)} className="hover:text-pink-500" title="Copy">
                {copiedId === message._id ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => onSpeak(message.content)} className="hover:text-pink-500" title="Listen">
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => onFeedback(message._id, 'like')} className="hover:text-emerald-500">
                <ThumbsUp className={`w-3.5 h-3.5 ${message.feedback === 'like' ? 'text-emerald-500' : ''}`} />
              </button>
              <button type="button" onClick={() => onFeedback(message._id, 'dislike')} className="hover:text-red-500">
                <ThumbsDown className={`w-3.5 h-3.5 ${message.feedback === 'dislike' ? 'text-red-500' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
