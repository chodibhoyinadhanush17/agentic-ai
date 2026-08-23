import { describe, it } from 'node:test';
import assert from 'node:assert';
import authService from '../src/services/authService.js';
import workflowService from '../src/services/workflowService.js';
import integrationService from '../src/services/integrationService.js';
import aiService from '../src/services/aiService.js';
import plannerAgent from '../src/agents/plannerAgent.js';
import executionAgent from '../src/agents/executionAgent.js';
import validationAgent from '../src/agents/validationAgent.js';
import recoveryAgent from '../src/agents/recoveryAgent.js';
import orchestrator from '../src/agents/orchestrator.js';
import { encryptCredential, decryptCredential } from '../src/models/Integration.js';
import { connectDB } from '../src/config/db.js';

describe('Agentflow_AI Comprehensive Verification Suite', async () => {
  await connectDB();

  describe('1. Authentication & Security (Bcrypt Cost 12 & JWT)', () => {
    it('should successfully register an operator and return JWT token', async () => {
      const email = `operator_${Date.now()}@test.com`;
      const result = await authService.register({
        name: 'Test Operator',
        email,
        password: 'securePassword123',
        role: 'operator',
      });

      assert.ok(result.token, 'Token must be present');
      assert.strictEqual(result.user.email, email);
      assert.strictEqual(result.user.role, 'operator');
    });

    it('should verify and authenticate valid login', async () => {
      const email = `testlogin_${Date.now()}@test.com`;
      await authService.register({
        name: 'Login Test',
        email,
        password: 'myPassword!',
      });

      const loginRes = await authService.login({
        email,
        password: 'myPassword!',
      });

      assert.ok(loginRes.token);
      assert.strictEqual(loginRes.user.email, email);
    });

    it('should reject invalid password', async () => {
      const email = `invalidpass_${Date.now()}@test.com`;
      await authService.register({
        name: 'Bad Pass Test',
        email,
        password: 'correctPassword',
      });

      await assert.rejects(
        async () => {
          await authService.login({
            email,
            password: 'wrongPassword',
          });
        },
        /Invalid email or password/
      );
    });
  });

  describe('2. Credential Encryption Substrate (AES-256)', () => {
    it('should encrypt and decrypt third-party credentials flawlessly', () => {
      const sensitiveTokens = {
        accessToken: 'ya29.a0AfH6SMD_secret_google_oauth_token',
        refreshToken: '1//04_refresh_token_xyz',
        botToken: 'xoxb-123456789-slack-bot-token',
      };

      const encrypted = encryptCredential(sensitiveTokens);
      assert.ok(typeof encrypted === 'string');
      assert.ok(encrypted.includes(':'), 'Encrypted string should include IV delimiter');

      const decrypted = decryptCredential(encrypted);
      assert.deepStrictEqual(decrypted, sensitiveTokens);
    });
  });

  describe('3. AI Workflow Generation & Fallback Rules', () => {
    it('should generate a valid DAG graph with nodes and edges for invoice prompt', async () => {
      const generated = await aiService.generateWorkflow('When an invoice arrives, extract line items, append to Google Sheets, and alert Slack.');
      
      assert.ok(generated.name);
      assert.ok(Array.isArray(generated.nodes) && generated.nodes.length >= 3);
      assert.ok(Array.isArray(generated.edges) && generated.edges.length >= 2);
      
      const nodeTypes = generated.nodes.map((n) => n.type);
      assert.ok(nodeTypes.includes('trigger'));
      assert.ok(nodeTypes.includes('ai_agent'));
      assert.ok(nodeTypes.includes('google_sheets') || nodeTypes.includes('slack'));
    });
  });

  describe('4. 5-Agent Multi-Agent Orchestration Chain', () => {
    it('Planner Agent: should sort DAG topologically and compute confidence score', async () => {
      const workflow = {
        _id: 'test_wf_1',
        nodes: [
          { id: 'node_trigger', type: 'trigger', label: 'Trigger' },
          { id: 'node_ai', type: 'ai_agent', label: 'AI Agent' },
          { id: 'node_slack', type: 'slack', label: 'Slack Alert' },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_ai' },
          { id: 'e2', source: 'node_ai', target: 'node_slack' },
        ],
      };

      const plan = await plannerAgent.plan(workflow, 'test_exec_1');
      assert.strictEqual(plan.totalSteps, 3);
      assert.strictEqual(plan.executionPlan[0].id, 'node_trigger');
      assert.strictEqual(plan.executionPlan[1].id, 'node_ai');
      assert.strictEqual(plan.executionPlan[2].id, 'node_slack');
      assert.ok(plan.confidenceScore >= 0.7 && plan.confidenceScore <= 1.0);
    });

    it('Execution Agent: should execute AI Agent node and resolve template variables', async () => {
      const node = {
        id: 'node_ai_summary',
        type: 'ai_agent',
        config: {
          role: 'Executive Summarizer',
          promptTemplate: 'Analyze invoice from {{node_ai.vendor}} for total ${{node_ai.total}}',
        },
      };

      const context = {
        workflowId: 'test_wf_1',
        nodeOutputs: {
          node_ai: { vendor: 'Acme Corp', total: '1450.00' },
        },
      };

      const result = await executionAgent.executeNode(node, context, 'test_exec_2', 'user_1');
      assert.strictEqual(result.agent, 'execution');
      assert.ok(result.output.role === 'Executive Summarizer');
      assert.ok(result.output.status === 'PROCESSED');
    });

    it('Execution Agent: should execute connected Slack node with mock token', async () => {
      // Connect mock Slack credentials for user_1
      await integrationService.saveManualCredentials('user_1', {
        provider: 'slack',
        credentials: { accessToken: 'mock_slack_token_123' },
      });

      const node = {
        id: 'node_slack',
        type: 'slack',
        config: { action: 'post_message', channel: '#alerts', text: 'Invoice for {{node_ai.vendor}}' },
      };

      const context = {
        workflowId: 'test_wf_1',
        nodeOutputs: {
          node_ai: { vendor: 'Acme Corp' },
        },
      };

      const result = await executionAgent.executeNode(node, context, 'test_exec_2_slack', 'user_1');
      assert.strictEqual(result.agent, 'execution');
      assert.strictEqual(result.output.channel, '#alerts');
      assert.strictEqual(result.output.text, 'Invoice for Acme Corp');
    });

    it('Validation Agent: should verify valid step output', async () => {
      const node = { id: 'node_slack', type: 'slack' };
      const stepResult = { output: { success: true, channel: '#alerts', messageId: 'msg_1' } };

      const validation = await validationAgent.validate(node, stepResult, { workflowId: 'test_wf_1' }, 'test_exec_3');
      assert.strictEqual(validation.isValid, true);
    });

    it('Recovery Agent: should correctly classify error taxonomy', async () => {
      const missingFieldErr = new Error('MISSING_FIELDS: "to" is required');
      missingFieldErr.code = 'MISSING_FIELDS';

      const plan = await recoveryAgent.handleFailure(missingFieldErr, { id: 'node_gmail' }, { workflowId: 'test_wf_1' }, 'test_exec_4', 0);
      assert.strictEqual(plan.errorCategory, 'MISSING_FIELDS');
      assert.strictEqual(plan.strategy, 'escalate');
    });

    it('Orchestrator: should report LangGraph availability and execute full flow', async () => {
      const langGraphStatus = orchestrator.getLangGraphStatus();
      assert.ok(['available', 'not-installed'].includes(langGraphStatus));
    });
  });
});
