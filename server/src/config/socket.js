import { Server } from 'socket.io';
import config from './env.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join execution room for live timeline streaming
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] ${socket.id} joined room execution:${executionId}`);
      }
    });

    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] ${socket.id} left room execution:${executionId}`);
      }
    });

    // Join user room for targeted notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] ${socket.id} joined room user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('[Socket.IO] Socket server has not been initialized yet.');
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };
  }
  return io;
};

// Helper: Broadcast agent event to an execution room
export const emitAgentEvent = (executionId, agent, payload) => {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit('agent:event', {
      executionId,
      agent,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
};

// Helper: Broadcast execution status change
export const emitExecutionStatus = (executionId, statusData) => {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit('execution:status', {
      executionId,
      ...statusData,
      timestamp: new Date().toISOString(),
    });
    // Also broadcast summary update to all clients for executions list
    io.emit('execution:update', {
      executionId,
      ...statusData,
    });
  }
};

// Helper: Broadcast user notification
export const emitNotification = (userId, notification) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit('notification:new', notification);
    io.emit('notification:broadcast', notification);
  }
};

export default {
  initSocket,
  getIO,
  emitAgentEvent,
  emitExecutionStatus,
  emitNotification,
};
