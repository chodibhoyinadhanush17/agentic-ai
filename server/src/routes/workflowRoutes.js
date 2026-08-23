import express from 'express';
import { body } from 'express-validator';
import workflowController from '../controllers/workflowController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', workflowController.getDashboard.bind(workflowController));
router.get('/', workflowController.listWorkflows.bind(workflowController));

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workflow name is required')],
  workflowController.createWorkflow.bind(workflowController)
);

router.post(
  '/generate',
  [body('prompt').trim().notEmpty().withMessage('Prompt is required for workflow generation')],
  workflowController.generateWorkflow.bind(workflowController)
);

router.get('/:id', workflowController.getWorkflowById.bind(workflowController));
router.put('/:id', workflowController.updateWorkflow.bind(workflowController));
router.post('/:id/duplicate', workflowController.duplicateWorkflow.bind(workflowController));
router.post('/:id/execute', workflowController.executeWorkflow.bind(workflowController));
router.delete('/:id', workflowController.deleteWorkflow.bind(workflowController));

export default router;
