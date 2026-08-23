import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import config from './config/env.js';
import { getDBStatus } from './config/db.js';
import { getQueueStats } from './queues/executionQueue.js';
import orchestrator from './agents/orchestrator.js';

import authRoutes from './routes/authRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration for Local, Vercel & Production
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (Vercel previews, custom domains, localhost)
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Compression & Body Parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root Welcome & Ping
app.get('/', (req, res) => {
  res.json({
    platform: 'Agentflow_AI Backend Engine',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Health Check Heartbeat
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const queueStats = getQueueStats();
  const langGraphStatus = orchestrator.getLangGraphStatus();

  return res.json({
    status: 'healthy',
    platform: 'Agentflow_AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    queue: queueStats,
    langGraph: langGraphStatus,
    openRouter: !!config.ai.openRouterApiKey,
    gemini: !!config.ai.geminiApiKey,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  console.error(`[Error] ${errorCode}: ${err.message}`);
  if (config.nodeEnv === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected server error occurred',
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    },
  });
});

export default app;
