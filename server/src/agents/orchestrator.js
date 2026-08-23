import plannerAgent from './plannerAgent.js';
import executionAgent from './executionAgent.js';
import validationAgent from './validationAgent.js';
import recoveryAgent from './recoveryAgent.js';
import monitoringAgent from './monitoringAgent.js';
import { Execution } from '../models/Execution.js';

// In-memory execution runtime state manager (for pause, resume, cancel)
const activeExecutionControls = new Map();

// Check LangGraph substrate availability
let langGraphStatus = 'not-installed';
try {
  // Check if LangGraph / LangChain packages can be resolved
  const isAvailable = await import('@langchain/langgraph').then(() => true).catch(() => false);
  langGraphStatus = isAvailable ? 'available' : 'not-installed';
} catch {
  langGraphStatus = 'not-installed';
}

export class AgentOrchestrator {
  /**
   * Runs an execution through the 5-agent multi-agent chain
   */
  async runExecution(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found.`);
    }

    const workflow = execution.workflowSnapshot;
    const startTime = Date.now();

    // Initialize control record
    activeExecutionControls.set(executionId.toString(), {
      paused: false,
      cancelled: false,
    });

    try {
      // Set status to RUNNING
      execution.status = 'RUNNING';
      execution.startTime = new Date(startTime);
      await execution.save();

      await monitoringAgent.recordEvent({
        executionId,
        workflowId: execution.workflowId,
        agent: 'monitoring',
        level: 'info',
        message: `Execution initiated. Orchestrator substrate: LangGraph [${langGraphStatus}].`,
        metadata: { langGraph: langGraphStatus, status: 'RUNNING' },
        userId,
      });

      await monitoringAgent.updateStatus(executionId, execution.workflowId, 'RUNNING', 0, null, userId);

      // STEP 1: PLANNER AGENT
      await monitoringAgent.recordEvent({
        executionId,
        workflowId: execution.workflowId,
        agent: 'planner',
        level: 'info',
        message: 'Planner Agent analyzing workflow DAG topology and node dependencies...',
      });

      const planResult = await plannerAgent.plan(workflow, executionId);

      await monitoringAgent.recordEvent({
        executionId,
        workflowId: execution.workflowId,
        agent: 'planner',
        level: 'success',
        message: `Execution plan established (${planResult.totalSteps} steps). Confidence score: ${(planResult.confidenceScore * 100).toFixed(0)}%.`,
        metadata: planResult,
      });

      const executionContext = {
        workflowId: execution.workflowId,
        initialInputs: execution.inputs || {},
        nodeOutputs: {},
      };

      // STEP 2 to 5: Iterate through nodes in planned sequence
      for (let i = 0; i < planResult.executionPlan.length; i++) {
        const node = planResult.executionPlan[i];
        const stepNum = i + 1;

        // Check for cancellation
        const control = activeExecutionControls.get(executionId.toString());
        if (control?.cancelled) {
          execution.status = 'CANCELLED';
          execution.endTime = new Date();
          execution.duration = Date.now() - startTime;
          await execution.save();

          await monitoringAgent.recordEvent({
            executionId,
            workflowId: execution.workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution cancelled by operator at step ${stepNum} (${node.label || node.id}).`,
          });
          await monitoringAgent.updateStatus(executionId, execution.workflowId, 'CANCELLED', execution.duration, null, userId);
          return execution;
        }

        // Check for pause
        while (control?.paused) {
          execution.status = 'PAUSED';
          await execution.save();
          await monitoringAgent.updateStatus(executionId, execution.workflowId, 'PAUSED', Date.now() - startTime, null, userId);
          // Wait 1 second before checking resume state
          await new Promise((r) => setTimeout(r, 1000));
          if (control?.cancelled) break;
        }

        execution.currentNode = node.id;
        await execution.save();

        // 2. EXECUTION AGENT
        await monitoringAgent.recordEvent({
          executionId,
          workflowId: execution.workflowId,
          nodeId: node.id,
          agent: 'execution',
          level: 'info',
          message: `[Step ${stepNum}/${planResult.totalSteps}] Executing node "${node.label || node.id}" (${node.type})...`,
          metadata: { nodeConfig: node.config },
        });

        let stepResult = null;
        let retryAttempt = 0;
        let stepSucceeded = false;

        while (!stepSucceeded && retryAttempt <= 3) {
          try {
            stepResult = await executionAgent.executeNode(node, executionContext, executionId, userId);
            stepSucceeded = true;
          } catch (execError) {
            // 4. RECOVERY AGENT
            const recoveryPlan = await recoveryAgent.handleFailure(
              execError,
              node,
              executionContext,
              executionId,
              retryAttempt
            );

            await monitoringAgent.recordEvent({
              executionId,
              workflowId: execution.workflowId,
              nodeId: node.id,
              agent: 'recovery',
              level: 'warning',
              message: `Recovery Agent evaluated error [${recoveryPlan.errorCategory}]. Action: ${recoveryPlan.strategy}. ${recoveryPlan.remediationSuggestion}`,
              metadata: recoveryPlan,
            });

            if (recoveryPlan.strategy === 'retry_with_backoff' && recoveryPlan.canRetry) {
              retryAttempt++;
              execution.retryCount = (execution.retryCount || 0) + 1;
              execution.status = 'RETRYING';
              await execution.save();

              await monitoringAgent.recordEvent({
                executionId,
                workflowId: execution.workflowId,
                nodeId: node.id,
                agent: 'recovery',
                level: 'info',
                message: `Backing off ${recoveryPlan.backoffDelayMs}ms before retry attempt ${retryAttempt}...`,
              });

              await new Promise((r) => setTimeout(r, recoveryPlan.backoffDelayMs));
            } else {
              // Escalation - mark execution as FAILED
              throw execError;
            }
          }
        }

        // 3. VALIDATION AGENT
        await monitoringAgent.recordEvent({
          executionId,
          workflowId: execution.workflowId,
          nodeId: node.id,
          agent: 'validation',
          level: 'info',
          message: `Validation Agent verifying output schema contracts for "${node.label || node.id}"...`,
        });

        const validationResult = await validationAgent.validate(node, stepResult, executionContext, executionId);

        if (!validationResult.isValid) {
          await monitoringAgent.recordEvent({
            executionId,
            workflowId: execution.workflowId,
            nodeId: node.id,
            agent: 'validation',
            level: 'error',
            message: `Validation failed: ${validationResult.summary}`,
            metadata: validationResult,
            userId,
          });
          throw new Error(`VALIDATION_ERROR: Output validation failed for node "${node.id}".`);
        }

        await monitoringAgent.recordEvent({
          executionId,
          workflowId: execution.workflowId,
          nodeId: node.id,
          agent: 'validation',
          level: 'success',
          message: `Validation confirmed. Node output satisfies schema contract.`,
          metadata: validationResult,
        });

        // Store output into context for downstream steps
        executionContext.nodeOutputs[node.id] = stepResult.output;
      }

      // Mark COMPLETED
      const endTime = Date.now();
      const duration = endTime - startTime;
      execution.status = 'COMPLETED';
      execution.endTime = new Date(endTime);
      execution.duration = duration;
      execution.outputs = executionContext.nodeOutputs;
      await execution.save();

      await monitoringAgent.recordEvent({
        executionId,
        workflowId: execution.workflowId,
        agent: 'monitoring',
        level: 'success',
        message: `Workflow completed successfully in ${(duration / 1000).toFixed(2)}s across ${planResult.totalSteps} agent steps.`,
        metadata: { duration, totalSteps: planResult.totalSteps },
      });

      await monitoringAgent.updateStatus(executionId, execution.workflowId, 'COMPLETED', duration, null, userId);

      activeExecutionControls.delete(executionId.toString());
      return execution;
    } catch (err) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      execution.status = 'FAILED';
      execution.endTime = new Date(endTime);
      execution.duration = duration;
      execution.error = {
        code: err.code || 'EXECUTION_FAILED',
        message: err.message,
        details: err.stack,
      };
      await execution.save();

      await monitoringAgent.recordEvent({
        executionId,
        workflowId: execution.workflowId,
        agent: 'monitoring',
        level: 'error',
        message: `Execution terminated with failure: ${err.message}`,
        metadata: { error: err.message, code: err.code },
        userId,
      });

      await monitoringAgent.updateStatus(executionId, execution.workflowId, 'FAILED', duration, execution.error, userId);

      activeExecutionControls.delete(executionId.toString());
      return execution;
    }
  }

  pauseExecution(executionId) {
    const ctrl = activeExecutionControls.get(executionId.toString());
    if (ctrl) {
      ctrl.paused = true;
      return true;
    }
    return false;
  }

  resumeExecution(executionId) {
    const ctrl = activeExecutionControls.get(executionId.toString());
    if (ctrl) {
      ctrl.paused = false;
      return true;
    }
    return false;
  }

  cancelExecution(executionId) {
    const ctrl = activeExecutionControls.get(executionId.toString());
    if (ctrl) {
      ctrl.cancelled = true;
      return true;
    }
    return false;
  }

  getLangGraphStatus() {
    return langGraphStatus;
  }
}

export default new AgentOrchestrator();
