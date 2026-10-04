import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, AlertCircle, Clock, Volume2, User as UserIcon } from 'lucide-react';
import { getSocket } from '../services/socket';

export type CallType = 'audio' | 'video';
export type CallStatus = 'calling' | 'incoming' | 'ringing' | 'accepted' | 'connected' | 'ended' | 'rejected' | 'permission_error';

export interface CallParticipant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  specialty?: string;
}

interface CallOverlayProps {
  isOpen: boolean;
  callType: CallType;
  initialStatus: CallStatus;
  remoteParticipant: CallParticipant;
  currentUser: CallParticipant;
  conversationId: string;
  incomingOffer?: any;
  onClose: (durationSeconds: number, summaryText: string) => void;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallOverlay: React.FC<CallOverlayProps> = ({
  isOpen,
  callType,
  initialStatus,
  remoteParticipant,
  currentUser,
  conversationId,
  incomingOffer,
  onClose,
}) => {
  const [status, setStatus] = useState<CallStatus>(initialStatus);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const socket = getSocket();

  // Reset status on open
  useEffect(() => {
    setStatus(initialStatus);
    setPermissionError(null);
    setDuration(0);
  }, [initialStatus, isOpen]);

  // Call timer
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const cleanupMediaAndPC = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  const handleEndCall = useCallback((summary?: string) => {
    cleanupMediaAndPC();
    socket.emit('end-call', { toUserId: remoteParticipant.id });
    setStatus('ended');
    const finalDuration = duration;
    const finalSummary = summary || (callType === 'video' ? `Video call • ${Math.ceil(finalDuration / 60)} min` : `Audio call • ${Math.ceil(finalDuration / 60)} min`);
    setTimeout(() => {
      onClose(finalDuration, finalSummary);
    }, 1500);
  }, [cleanupMediaAndPC, duration, onClose, remoteParticipant.id, socket, callType]);

  // Setup WebRTC and Local Media
  const initWebRTC = useCallback(async (isCaller: boolean) => {
    try {
      setPermissionError(null);
      const constraints = {
        audio: true,
        video: callType === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(STUN_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (callType === 'video' && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          } else if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            toUserId: remoteParticipant.id,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatus('connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          handleEndCall('Connection failed');
        }
      };

      if (isCaller) {
        // Create Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call-user', {
          toUserId: remoteParticipant.id,
          fromUser: currentUser,
          callType,
          conversationId,
          offer,
        });
      } else if (incomingOffer) {
        // Create Answer for incoming call
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('accept-call', {
          toUserId: remoteParticipant.id,
          answer,
        });
        setStatus('connected');
      }
    } catch (err: any) {
      console.error('Media permission or WebRTC error:', err);
      setPermissionError('Microphone/camera permission is required for this call.');
      setStatus('permission_error');
    }
  }, [callType, currentUser, incomingOffer, remoteParticipant.id, socket, conversationId, handleEndCall]);

  // Handle Socket Events
  useEffect(() => {
    if (!isOpen) return;

    const handleCallAccepted = async (data: { answer: any }) => {
      setStatus('connected');
      if (pcRef.current && data.answer) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (e) {
          console.error('Set remote description error:', e);
        }
      }
    };

    const handleCallRejected = (data: { reason?: string }) => {
      setStatus('rejected');
      cleanupMediaAndPC();
      setTimeout(() => {
        onClose(0, 'Call rejected');
      }, 2000);
    };

    const handleIceCandidate = async (data: { candidate: any }) => {
      if (pcRef.current && data.candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Add ICE candidate error:', e);
        }
      }
    };

    const handleCallEnded = () => {
      setStatus('ended');
      cleanupMediaAndPC();
      setTimeout(() => {
        onClose(duration, callType === 'video' ? 'Video call ended' : 'Audio call ended');
      }, 1500);
    };

    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ended', handleCallEnded);

    // If initial status is calling, trigger caller setup
    if (initialStatus === 'calling') {
      initWebRTC(true);
    }

    return () => {
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-ended', handleCallEnded);
    };
  }, [isOpen, initialStatus, initWebRTC, socket, cleanupMediaAndPC, onClose, duration, callType]);

  const handleAcceptIncoming = () => {
    setStatus('accepted');
    initWebRTC(false);
  };

  const handleRejectIncoming = () => {
    socket.emit('reject-call', { toUserId: remoteParticipant.id, reason: 'Declined by user' });
    setStatus('rejected');
    cleanupMediaAndPC();
    setTimeout(() => {
      onClose(0, 'Call declined');
    }, 1500);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // toggle
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 text-white font-sans overflow-hidden"
      >
        <div className="w-full max-w-2xl bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative min-h-[500px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                FemCare Encrypted {callType === 'video' ? 'Video' : 'Audio'} Call
              </span>
            </div>
            {status === 'connected' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-xs font-mono text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(duration)}
              </div>
            )}
          </div>

          {/* Hidden audio element for remote stream in audio call */}
          <audio ref={remoteAudioRef} autoPlay />

          {/* Main Display Container */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-6 text-center overflow-hidden min-h-[360px]">
            {/* Video Streams Display */}
            {callType === 'video' && (status === 'connected' || status === 'accepted') ? (
              <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                {/* Remote Video (Main) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Local Video (Floating Thumbnail) */}
                <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              /* Audio / Ringing / Calling Profile View */
              <div className="flex flex-col items-center justify-center z-10 space-y-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-slate-800">
                    {remoteParticipant.avatar ? (
                      <img src={remoteParticipant.avatar} alt={remoteParticipant.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      remoteParticipant.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {(status === 'calling' || status === 'incoming') && (
                    <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/40 animate-ping" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-slate-100">{remoteParticipant.name}</h3>
                  <p className="text-sm text-slate-400">{remoteParticipant.specialty || remoteParticipant.role}</p>
                </div>

                {/* Status Indicator Badges */}
                <div className="pt-2">
                  {status === 'calling' && <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold animate-pulse">Calling...</span>}
                  {status === 'incoming' && <span className="px-4 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold animate-pulse">Incoming Call...</span>}
                  {status === 'connected' && <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">Connected</span>}
                  {status === 'rejected' && <span className="px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">Call Declined</span>}
                  {status === 'ended' && <span className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">Call Ended</span>}
                </div>

                {/* Permission Error Message */}
                {permissionError && (
                  <div className="mt-4 p-3 bg-red-950/80 border border-red-800/80 rounded-2xl max-w-md text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{permissionError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Bar / Controls */}
          <div className="p-6 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-center gap-6">
            {/* Incoming Call Accept/Reject Controls */}
            {status === 'incoming' ? (
              <div className="flex items-center gap-8">
                <button
                  onClick={handleRejectIncoming}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  title="Reject Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  onClick={handleAcceptIncoming}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg animate-bounce transition-transform active:scale-95"
                  title="Accept Call"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            ) : status === 'connected' || status === 'calling' ? (
              <div className="flex items-center gap-4">
                {/* Mute Mic Button */}
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Toggle Camera Button (Video Calls) */}
                {callType === 'video' && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      !isVideoEnabled ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={() => handleEndCall()}
                  className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onClose(0, 'Call closed')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
