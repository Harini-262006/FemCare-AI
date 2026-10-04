import { io, Socket } from 'socket.io-client';

const getSocketServerUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketServerUrl(), {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  }
  return socket;
};

export const registerSocketUser = (userId: string, role: 'patient' | 'doctor' | 'user') => {
  const s = getSocket();
  if (s.connected) {
    s.emit('add-user', userId, role);
  } else {
    s.on('connect', () => {
      s.emit('add-user', userId, role);
    });
  }
};
