import { AgentMemory } from '../models/AgentMemory.js';

export class ValidationAgent {
  constructor() {
    this.name = 'validation';
  }

  /**
   * Validates the execution output against expected node contracts
   */
  async validate(node, executionResult, context, executionId) {
    const { type } = node;
    const output = executionResult?.output;
    const checks = [];

    // Check 1: Output existence
    if (output === null || output === undefined) {
      checks.push({ check: 'OUTPUT_EXISTS', passed: false, message: 'Node produced empty output.' });
    } else {
      checks.push({ check: 'OUTPUT_EXISTS', passed: true, message: 'Node produced non-null output.' });
    }

    // Check 2: Type-specific output validation
    switch (type) {
      case 'gmail':
        if (output?.success || output?.messageId || output?.messages) {
          checks.push({ check: 'GMAIL_SCHEMA', passed: true, message: 'Gmail operation returned valid response object.' });
        } else {
          checks.push({ check: 'GMAIL_SCHEMA', passed: false, message: 'Gmail operation did not confirm success or message ID.' });
        }
        break;

      case 'slack':
        if (output?.success || output?.ts || output?.messageId) {
          checks.push({ check: 'SLACK_SCHEMA', passed: true, message: 'Slack dispatch acknowledged by channel endpoint.' });
        } else {
          checks.push({ check: 'SLACK_SCHEMA', passed: false, message: 'Slack delivery unconfirmed.' });
        }
        break;

      case 'discord':
        if (output?.success || output?.data || output?.messageId || output?.status === 'DELIVERED') {
          checks.push({ check: 'DISCORD_SCHEMA', passed: true, message: 'Discord message delivered.' });
        } else {
          checks.push({ check: 'DISCORD_SCHEMA', passed: false, message: 'Discord delivery unconfirmed.' });
        }
        break;

      case 'google_sheets':
        if (output?.success || output?.updatedRows !== undefined || output?.values) {
          checks.push({ check: 'SHEETS_SCHEMA', passed: true, message: 'Google Sheets table mutation confirmed.' });
        } else {
          checks.push({ check: 'SHEETS_SCHEMA', passed: false, message: 'Google Sheets output missing row confirmation.' });
        }
        break;

      case 'ai_agent':
        if (output?.summary || output?.response || output?.vendor || output?.output) {
          checks.push({ check: 'AI_SYNTHESIS', passed: true, message: 'AI agent produced structured semantic fields.' });
        } else {
          checks.push({ check: 'AI_SYNTHESIS', passed: false, message: 'AI agent failed to generate required fields.' });
        }
        break;

      default:
        checks.push({ check: 'GENERIC_SCHEMA', passed: true, message: 'Node executed within standard boundaries.' });
        break;
    }

    const isValid = checks.every((c) => c.passed);

    // Save validation audit to AgentMemory
    await AgentMemory.create({
      workflowId: context.workflowId,
      executionId,
      agentId: 'validation',
      key: `validation_${node.id}`,
      value: { isValid, checks },
      confidenceScore: isValid ? 1.0 : 0.4,
    });

    return {
      agent: this.name,
      nodeId: node.id,
      isValid,
      checks,
      summary: isValid ? 'All contract criteria met.' : 'Output failed contract validation checks.',
    };
  }
}

export default new ValidationAgent();
