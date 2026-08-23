import executionService from '../services/executionService.js';

export class ExecutionController {
  async listExecutions(req, res, next) {
    try {
      const { workflowId, status, page, limit } = req.query;
      const result = await executionService.listExecutions({ workflowId, status, page, limit });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'EXECUTIONS_FETCH_FAILED', message: err.message },
      });
    }
  }

  async getExecutionById(req, res, next) {
    try {
      const { id } = req.params;
      const execution = await executionService.getExecutionById(id);
      return res.json({ success: true, data: execution });
    } catch (err) {
      return res.status(err.statusCode || 404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
  }

  async getExecutionTimeline(req, res, next) {
    try {
      const { id } = req.params;
      const data = await executionService.getExecutionTimeline(id);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(err.statusCode || 404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
  }

  async pauseExecution(req, res, next) {
    try {
      const { id } = req.params;
      const result = await executionService.pauseExecution(id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'PAUSE_FAILED', message: err.message },
      });
    }
  }

  async resumeExecution(req, res, next) {
    try {
      const { id } = req.params;
      const result = await executionService.resumeExecution(id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'RESUME_FAILED', message: err.message },
      });
    }
  }

  async cancelExecution(req, res, next) {
    try {
      const { id } = req.params;
      const result = await executionService.cancelExecution(id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'CANCEL_FAILED', message: err.message },
      });
    }
  }
}

export default new ExecutionController();
