import express from 'express';
import executionController from '../controllers/executionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', executionController.listExecutions.bind(executionController));
router.get('/:id', executionController.getExecutionById.bind(executionController));
router.get('/:id/timeline', executionController.getExecutionTimeline.bind(executionController));
router.post('/:id/pause', executionController.pauseExecution.bind(executionController));
router.post('/:id/resume', executionController.resumeExecution.bind(executionController));
router.post('/:id/cancel', executionController.cancelExecution.bind(executionController));

export default router;
