import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected with ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO Client] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO Client] Connection error:', err.message);
    });
  }

  return socket;
};

export const joinExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s && executionId) {
    s.emit('join:execution', executionId);
  }
};

export const leaveExecutionRoom = (executionId) => {
  const s = getSocket();
  if (s && executionId) {
    s.emit('leave:execution', executionId);
  }
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join:user', userId);
  }
};

export default {
  getSocket,
  joinExecutionRoom,
  leaveExecutionRoom,
  joinUserRoom,
};
