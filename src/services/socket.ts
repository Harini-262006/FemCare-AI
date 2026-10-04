import { io, Socket } from 'socket.io-client';

const SERVER_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:5000'
  : window.location.origin;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
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
