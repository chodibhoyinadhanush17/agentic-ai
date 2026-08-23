import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/env.js';
import orchestrator from '../agents/orchestrator.js';

let bullQueue = null;
let isRedisActive = false;

// Async in-memory queue fallback
const inMemoryQueue = [];
let isProcessingInMemory = false;

const processInMemoryQueue = async () => {
  if (isProcessingInMemory || inMemoryQueue.length === 0) return;
  isProcessingInMemory = true;

  while (inMemoryQueue.length > 0) {
    const job = inMemoryQueue.shift();
    try {
      if (job.delay > 0) {
        await new Promise((r) => setTimeout(r, job.delay));
      }
      console.log(`[Queue:InMemory] Processing execution job ${job.executionId}`);
      await orchestrator.runExecution(job.executionId, job.userId);
    } catch (err) {
      console.error(`[Queue:InMemory] Job failed for ${job.executionId}:`, err.message);
    }
  }

  isProcessingInMemory = false;
};

export const initExecutionQueue = () => {
  try {
    const redisConnection = new IORedis(config.redis.url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });

    redisConnection.connect().then(() => {
      bullQueue = new Queue('workflow-executions', { connection: redisConnection });
      new Worker(
        'workflow-executions',
        async (job) => {
          console.log(`[Queue:BullMQ] Processing execution job ${job.data.executionId}`);
          return orchestrator.runExecution(job.data.executionId, job.data.userId);
        },
        { connection: redisConnection }
      );
      isRedisActive = true;
      console.log('[Queue] BullMQ initialized on Redis.');
    }).catch(() => {
      console.warn('[Queue] Redis unavailable. Switched to high-throughput In-Memory Queue fallback.');
      isRedisActive = false;
    });
  } catch {
    isRedisActive = false;
  }
};

export const addExecutionJob = async (executionId, userId, delay = 0) => {
  if (isRedisActive && bullQueue) {
    try {
      await bullQueue.add('execute-workflow', { executionId, userId }, { delay });
      return { queued: true, type: 'bullmq' };
    } catch {
      // Fall through to in-memory
    }
  }

  // Enqueue in memory
  inMemoryQueue.push({ executionId, userId, delay, enqueuedAt: Date.now() });
  setTimeout(() => processInMemoryQueue(), 10);
  return { queued: true, type: 'in-memory' };
};

export const getQueueStats = () => ({
  type: isRedisActive ? 'bullmq' : 'in-memory',
  pendingJobs: inMemoryQueue.length,
  isProcessing: isProcessingInMemory,
});

export default {
  initExecutionQueue,
  addExecutionJob,
  getQueueStats,
};
