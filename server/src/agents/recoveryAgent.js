import { AgentMemory } from '../models/AgentMemory.js';

export class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
    this.maxRetries = 3;
  }

  /**
   * Classifies error and determines automated remediation strategy
   */
  async handleFailure(error, node, executionContext, executionId, currentRetryCount = 0) {
    const errorClassification = this.classifyError(error);
    const canRetry = currentRetryCount < this.maxRetries && errorClassification.isRetryable;

    const strategy = canRetry ? 'retry_with_backoff' : 'escalate';
    const backoffDelayMs = canRetry ? Math.pow(2, currentRetryCount) * 1000 : 0;

    const recoveryPlan = {
      agent: this.name,
      nodeId: node.id,
      errorCategory: errorClassification.category,
      rawErrorMessage: error.message,
      strategy,
      canRetry,
      retryAttempt: currentRetryCount + 1,
      maxRetries: this.maxRetries,
      backoffDelayMs,
      remediationSuggestion: errorClassification.remediation,
    };

    // Store recovery diagnostics in AgentMemory
    await AgentMemory.create({
      workflowId: executionContext.workflowId,
      executionId,
      agentId: 'recovery',
      key: `recovery_${node.id}_attempt_${currentRetryCount + 1}`,
      value: recoveryPlan,
      confidenceScore: 0.95,
    });

    return recoveryPlan;
  }

  classifyError(error) {
    const msg = (error?.message || '').toLowerCase();
    const code = error?.code || '';

    if (code === 'MISSING_FIELDS' || msg.includes('missing_fields') || msg.includes('requires')) {
      return {
        category: 'MISSING_FIELDS',
        isRetryable: false,
        remediation: 'Verify node configuration and ensure preceding steps supply all required payload variables.',
      };
    }

    if (code === 'AUTH_EXPIRED' || msg.includes('auth_expired') || msg.includes('unauthorized') || msg.includes('invalid_grant')) {
      return {
        category: 'AUTH_EXPIRED',
        isRetryable: false,
        remediation: 'OAuth credentials expired or revoked. Re-authenticate integration in the Integrations panel.',
      };
    }

    if (code === 'INTEGRATION_NOT_CONNECTED' || msg.includes('integration_not_connected') || msg.includes('not connected')) {
      return {
        category: 'INTEGRATION_NOT_CONNECTED',
        isRetryable: false,
        remediation: 'Third-party integration is disconnected. Connect provider via OAuth in Integrations page.',
      };
    }

    if (code === 'RATE_LIMIT' || msg.includes('rate_limit') || msg.includes('429') || msg.includes('too many requests')) {
      return {
        category: 'RATE_LIMIT',
        isRetryable: true,
        remediation: 'API rate limit encountered. Automated exponential backoff will pause before re-trying.',
      };
    }

    if (msg.includes('network') || msg.includes('timeout') || msg.includes('econnreset') || msg.includes('503') || msg.includes('502')) {
      return {
        category: 'TRANSIENT',
        isRetryable: true,
        remediation: 'Network or transient server hiccup. Retry with exponential backoff.',
      };
    }

    return {
      category: 'API_FAILURE',
      isRetryable: false,
      remediation: 'External API rejected payload. Check node input parameters for schema discrepancies.',
    };
  }
}

export default new RecoveryAgent();
