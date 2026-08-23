import workflowService from '../services/workflowService.js';
import executionService from '../services/executionService.js';
import { validationResult } from 'express-validator';

export class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await workflowService.getDashboardStats(userId);
      return res.json({ success: true, data: stats });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'STATS_FETCH_FAILED', message: err.message },
      });
    }
  }

  async listWorkflows(req, res, next) {
    try {
      const userId = req.user.id;
      const { search, status, tag, page, limit } = req.query;
      const result = await workflowService.listWorkflows(userId, { search, status, tag, page, limit });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'LIST_FAILED', message: err.message },
      });
    }
  }

  async createWorkflow(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userId = req.user.id;
      const workflow = await workflowService.createWorkflow(userId, req.body);
      return res.status(201).json({ success: true, data: workflow });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'CREATE_FAILED', message: err.message },
      });
    }
  }

  async generateWorkflow(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const userId = req.user.id;
      const { prompt } = req.body;
      const workflow = await workflowService.generateFromPrompt(userId, prompt);
      return res.status(201).json({ success: true, data: workflow });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'GENERATION_FAILED', message: err.message },
      });
    }
  }

  async getWorkflowById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const workflow = await workflowService.getWorkflowById(userId, id);
      return res.json({ success: true, data: workflow });
    } catch (err) {
      return res.status(err.statusCode || 404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const workflow = await workflowService.updateWorkflow(userId, id, req.body);
      return res.json({ success: true, data: workflow });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'UPDATE_FAILED', message: err.message },
      });
    }
  }

  async duplicateWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const cloned = await workflowService.duplicateWorkflow(userId, id);
      return res.status(201).json({ success: true, data: cloned });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'DUPLICATE_FAILED', message: err.message },
      });
    }
  }

  async executeWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const inputs = req.body.inputs || {};
      const execution = await executionService.triggerExecution(userId, id, inputs);
      return res.status(202).json({ success: true, data: execution });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: { code: 'EXECUTION_TRIGGER_FAILED', message: err.message },
      });
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await workflowService.deleteWorkflow(userId, id);
      return res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: err.message },
      });
    }
  }
}

export default new WorkflowController();
