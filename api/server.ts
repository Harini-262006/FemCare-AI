/**
 * Local server entry file with Socket.IO real-time communication support.
 */
import http from 'http';
import { Server } from 'socket.io';
import app from './app';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface OnlineUser {
  userId: string;
  socketId: string;
  role: 'patient' | 'doctor' | 'user';
}

let onlineUsers: OnlineUser[] = [];

io.on('connection', (socket) => {
  console.log('⚡ User connected to Socket.IO:', socket.id);

  socket.on('add-user', (userId: string, role: 'patient' | 'doctor' | 'user') => {
    if (!userId) return;
    const normalizedRole = role === 'user' ? 'patient' : role;
    const existingIndex = onlineUsers.findIndex((u) => u.userId === userId);
    if (existingIndex !== -1) {
      onlineUsers[existingIndex].socketId = socket.id;
      onlineUsers[existingIndex].role = normalizedRole;
    } else {
      onlineUsers.push({ userId, socketId: socket.id, role: normalizedRole });
    }
    console.log('✅ Active online users:', onlineUsers.length);
    io.emit('get-users', onlineUsers);
  });

  socket.on('join-conversation', (conversationId: string) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`📌 Socket ${socket.id} joined conversation room: ${conversationId}`);
    }
  });

  socket.on('send-message', (data: { conversationId?: string; receiverId?: string; senderId?: string; content?: string; message?: any }) => {
    const { conversationId, receiverId } = data;
    
    // Broadcast to specific conversation room
    if (conversationId) {
      socket.to(conversationId).emit('receive-message', data);
    }
    
    // Also send directly to target receiver if online
    if (receiverId) {
      const receiver = onlineUsers.find((u) => u.userId === receiverId);
      if (receiver && receiver.socketId) {
        io.to(receiver.socketId).emit('receive-message', data);
      }
    }
  });

  socket.on('typing', (data: { receiverId?: string; conversationId?: string; senderName?: string }) => {
    const { receiverId, conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit('typing', data);
    }
    if (receiverId) {
      const receiver = onlineUsers.find((u) => u.userId === receiverId);
      if (receiver) {
        socket.to(receiver.socketId).emit('typing', data);
      }
    }
  });

  socket.on('stop-typing', (data: { receiverId?: string; conversationId?: string }) => {
    const { receiverId, conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit('stop-typing', data);
    }
    if (receiverId) {
      const receiver = onlineUsers.find((u) => u.userId === receiverId);
      if (receiver) {
        socket.to(receiver.socketId).emit('stop-typing', data);
      }
    }
  });

  // ---------- WebRTC Call Signaling Events ----------
  socket.on('call-user', (data: {
    toUserId: string;
    fromUser: { id: string; name: string; role: string; avatar?: string };
    callType: 'audio' | 'video';
    conversationId: string;
    offer: any;
  }) => {
    const targetUser = onlineUsers.find((u) => u.userId === data.toUserId);
    if (targetUser && targetUser.socketId) {
      console.log(`📞 Call request from ${data.fromUser.name} (${data.fromUser.id}) to ${data.toUserId}`);
      io.to(targetUser.socketId).emit('call-incoming', {
        fromUser: data.fromUser,
        callType: data.callType,
        conversationId: data.conversationId,
        offer: data.offer,
        fromSocketId: socket.id,
      });
    } else {
      socket.emit('call-rejected', { reason: 'User is offline' });
    }
  });

  socket.on('accept-call', (data: { toUserId: string; answer: any }) => {
    const targetUser = onlineUsers.find((u) => u.userId === data.toUserId);
    if (targetUser && targetUser.socketId) {
      console.log(`✅ Call accepted by ${socket.id} for ${data.toUserId}`);
      io.to(targetUser.socketId).emit('call-accepted', { answer: data.answer });
    }
  });

  socket.on('reject-call', (data: { toUserId: string; reason?: string }) => {
    const targetUser = onlineUsers.find((u) => u.userId === data.toUserId);
    if (targetUser && targetUser.socketId) {
      console.log(`❌ Call rejected for ${data.toUserId}`);
      io.to(targetUser.socketId).emit('call-rejected', { reason: data.reason || 'Call rejected' });
    }
  });

  socket.on('ice-candidate', (data: { toUserId: string; candidate: any }) => {
    const targetUser = onlineUsers.find((u) => u.userId === data.toUserId);
    if (targetUser && targetUser.socketId) {
      io.to(targetUser.socketId).emit('ice-candidate', { candidate: data.candidate });
    }
  });

  socket.on('end-call', (data: { toUserId: string }) => {
    const targetUser = onlineUsers.find((u) => u.userId === data.toUserId);
    if (targetUser && targetUser.socketId) {
      console.log(`⏹️ Call ended for ${data.toUserId}`);
      io.to(targetUser.socketId).emit('call-ended');
    }
  });

  socket.on('disconnect', () => {
    console.log('🔥 User disconnected:', socket.id);
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit('get-users', onlineUsers);
  });
});

import connectDB from './db';
import { ensureDefaultAdmin, ensureDefaultDoctor } from './routes/auth';

connectDB().then((isConnected) => {
  if (isConnected) {
    ensureDefaultAdmin();
    ensureDefaultDoctor();
  }
});

const portNumber = Number(process.env.PORT) || 5000;
server.listen(portNumber, '0.0.0.0', () => {
  console.log(`Server ready on port ${portNumber} (0.0.0.0)`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
