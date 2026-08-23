import http from 'http';
import app from './app.js';
import config from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { initExecutionQueue } from './queues/executionQueue.js';
import authService from './services/authService.js';

const startServer = async () => {
  try {
    // 1. Initialize Database Connection
    await connectDB();

    // 2. Seed Default Operator Account
    await authService.seedDemoUser();

    // 3. Initialize Background Execution Queue
    initExecutionQueue();

    // 4. Create HTTP Server
    const httpServer = http.createServer(app);

    // 5. Initialize Real-Time WebSocket Layer
    initSocket(httpServer);

    // 6. Start listening
    httpServer.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 Agentflow_AI Server running on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api`);
      console.log(`❤️  Health Check: http://localhost:${config.port}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
