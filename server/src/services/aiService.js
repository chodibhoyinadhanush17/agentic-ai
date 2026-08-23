import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';

export class AIService {
  /**
   * Generates a complete workflow DAG from a natural language prompt.
   * Priority: OpenRouter -> Google Gemini -> Deterministic Rule Builder
   */
  async generateWorkflow(prompt, context = {}) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required for workflow generation');
    }

    // Tier 1: OpenRouter
    if (config.ai.openRouterApiKey) {
      try {
        console.log('[AIService] Generating workflow using OpenRouter...');
        return await this.generateWithOpenRouter(prompt);
      } catch (err) {
        console.warn(`[AIService] OpenRouter failed (${err.message}). Falling back to Gemini...`);
      }
    }

    // Tier 2: Gemini
    if (config.ai.geminiApiKey) {
      try {
        console.log('[AIService] Generating workflow using Google Gemini...');
        return await this.generateWithGemini(prompt);
      } catch (err) {
        console.warn(`[AIService] Gemini failed (${err.message}). Falling back to Deterministic Builder...`);
      }
    }

    // Tier 3: Deterministic Rule-Based Builder
    console.log('[AIService] Generating workflow using Deterministic Rule Engine...');
    return this.generateDeterministicWorkflow(prompt);
  }

  async generateWithOpenRouter(prompt) {
    const systemPrompt = `You are an expert AI workflow architect for Agentflow_AI.
Given a user's natural language request, generate an executable workflow graph with nodes and edges.
Allowed node types:
- trigger (config: { type: 'manual'|'webhook'|'schedule'|'event' })
- ai_agent (config: { model: 'gemini-2.0-flash'|'gpt-4o', promptTemplate: string, role: string })
- gmail (config: { action: 'send_email'|'read_emails', to?: string, subject?: string, body?: string })
- slack (config: { action: 'post_message'|'post_channel_alert', channel?: string, text?: string })
- discord (config: { action: 'post_message'|'post_embed', channelId?: string, content?: string })
- google_sheets (config: { action: 'append_row'|'read_range', spreadsheetId?: string, values?: array })
- logic_filter (config: { condition: string, operator: string, value: string })

Output ONLY a JSON object matching this schema:
{
  "name": "string",
  "description": "string",
  "triggerConfig": { "type": "manual|schedule|webhook" },
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger|ai_agent|gmail|slack|discord|google_sheets|logic_filter",
      "label": "string",
      "position": { "x": 100, "y": 150 },
      "data": { "label": "string", "icon": "string", "description": "string" },
      "config": {}
    }
  ],
  "edges": [
    {
      "id": "edge_1_2",
      "source": "node_1",
      "target": "node_2",
      "animated": true,
      "label": "string"
    }
  ],
  "tags": ["string"]
}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: config.ai.openRouterModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create an automation workflow for: ${prompt}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openRouterApiKey}`,
          'HTTP-Referer': 'https://agentflow.ai',
          'X-Title': 'Agentflow AI',
        },
        timeout: 20000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    return this.parseAndValidateGraph(content, prompt);
  }

  async generateWithGemini(prompt) {
    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: config.ai.geminiModel,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const promptText = `You are an expert AI workflow architect for Agentflow_AI.
Given this request: "${prompt}", create a valid JSON workflow object containing:
- "name": string
- "description": string
- "triggerConfig": { "type": "manual" | "schedule" | "webhook" }
- "nodes": Array of { id, type, label, position: {x, y}, data: {label, icon, description}, config: {} }
- "edges": Array of { id, source, target, animated: true, label }
- "tags": Array of strings

Node types must be one of: trigger, ai_agent, gmail, slack, discord, google_sheets, logic_filter.
Position nodes linearly left-to-right (e.g. x: 50, 300, 550, 800; y: 150).`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    return this.parseAndValidateGraph(response.text(), prompt);
  }

  /**
   * Deterministic Rule-Based Builder
   * Produces robust, fully-configured runnable graphs for any prompt without requiring API keys.
   */
  generateDeterministicWorkflow(rawPrompt) {
    const p = rawPrompt.toLowerCase();
    
    // Default flow template
    let name = 'Automated Agent Workflow';
    let description = `Autonomous multi-agent automation workflow created for: "${rawPrompt}"`;
    let nodes = [];
    let edges = [];
    let tags = ['automation', 'agentic'];

    const createTrigger = (label = 'Webhook Event Trigger', type = 'manual') => ({
      id: 'node_trigger',
      type: 'trigger',
      label,
      position: { x: 50, y: 160 },
      data: { label, icon: 'Zap', description: 'Initiates workflow pipeline' },
      config: { type, event: 'incoming_payload' },
    });

    const createAI = (id, x, y, label, role, promptTemplate) => ({
      id,
      type: 'ai_agent',
      label,
      position: { x, y },
      data: { label, icon: 'Bot', description: `AI Reasoning: ${role}` },
      config: { role, model: 'gemini-2.0-flash', promptTemplate },
    });

    const createGmail = (id, x, y, label, action, to, subject, body) => ({
      id,
      type: 'gmail',
      label,
      position: { x, y },
      data: { label, icon: 'Mail', description: `Gmail ${action}` },
      config: { action, to, subject, body },
    });

    const createSlack = (id, x, y, label, action, channel, text) => ({
      id,
      type: 'slack',
      label,
      position: { x, y },
      data: { label, icon: 'MessageSquare', description: `Slack ${action}` },
      config: { action, channel, text },
    });

    const createDiscord = (id, x, y, label, action, content) => ({
      id,
      type: 'discord',
      label,
      position: { x, y },
      data: { label, icon: 'Disc', description: `Discord ${action}` },
      config: { action, content },
    });

    const createSheets = (id, x, y, label, action, values) => ({
      id,
      type: 'google_sheets',
      label,
      position: { x, y },
      data: { label, icon: 'Table', description: `Google Sheets ${action}` },
      config: { action, spreadsheetId: 'ops_ledger_2026', range: 'Sheet1!A:E', values },
    });

    // Pattern 1: Invoice / Receipt / Billing Routing
    if (p.includes('invoice') || p.includes('receipt') || p.includes('bill') || p.includes('accounting')) {
      name = 'AI Invoice Processing & Multi-Channel Alert';
      description = 'Parses incoming invoices with AI, logs records to Google Sheets, and notifies Slack and Email.';
      tags = ['finance', 'invoices', 'multi-agent'];

      nodes = [
        createTrigger('New Invoice Received', 'webhook'),
        createAI('node_ai_parser', 320, 160, 'AI Invoice Extractor', 'Financial Parser', 'Extract vendor, total amount, line items, and payment due date from payload.'),
        createSheets('node_sheets', 600, 80, 'Log to Financial Sheet', 'append_row', ['{{timestamp}}', '{{node_ai_parser.vendor}}', '{{node_ai_parser.total}}', 'PROCESSED']),
        createSlack('node_slack', 600, 240, 'Notify Finance Channel', 'post_channel_alert', '#finance-ops', 'New invoice processed: ${{node_ai_parser.total}} for {{node_ai_parser.vendor}}'),
        createGmail('node_gmail', 880, 160, 'Send Vendor Confirmation', 'send_email', 'accounting@company.com', 'Invoice Confirmation: {{node_ai_parser.vendor}}', 'Your invoice has been validated and queued for payment.'),
      ];

      edges = [
        { id: 'e1', source: 'node_trigger', target: 'node_ai_parser', animated: true, label: 'Payload' },
        { id: 'e2', source: 'node_ai_parser', target: 'node_sheets', animated: true, label: 'Parsed Record' },
        { id: 'e3', source: 'node_ai_parser', target: 'node_slack', animated: true, label: 'Alert Data' },
        { id: 'e4', source: 'node_sheets', target: 'node_gmail', animated: true, label: 'Confirmation' },
      ];
    }
    // Pattern 2: Support Ticket / Customer Inquiry
    else if (p.includes('support') || p.includes('ticket') || p.includes('customer') || p.includes('sentiment')) {
      name = 'Intelligent Support Ticket Classifier & Routing';
      description = 'Analyzes customer query sentiment, classifies urgency, alerts Slack channel, and emails auto-response.';
      tags = ['support', 'sentiment', 'routing'];

      nodes = [
        createTrigger('Customer Ticket Inbound', 'webhook'),
        createAI('node_ai_agent', 320, 160, 'AI Sentiment & Intent Classifier', 'Support Specialist', 'Analyze sentiment, categorize urgency (P1/P2/P3), and draft personalized response.'),
        createSlack('node_slack', 600, 80, 'Dispatch Support Alert', 'post_channel_alert', '#support-urgent', '🚨 Inbound Ticket [Urgency: {{node_ai_agent.urgency}}]: {{node_ai_agent.summary}}'),
        createGmail('node_gmail', 600, 240, 'Send Customer Auto-Reply', 'send_email', 'customer@client.com', 'We received your inquiry - Agentflow Support', '{{node_ai_agent.draftReply}}'),
        createSheets('node_sheets', 880, 160, 'Audit Support Log', 'append_row', ['{{timestamp}}', '{{node_ai_agent.urgency}}', '{{node_ai_agent.category}}', 'RESOLVED']),
      ];

      edges = [
        { id: 'e1', source: 'node_trigger', target: 'node_ai_agent', animated: true, label: 'Inbound Ticket' },
        { id: 'e2', source: 'node_ai_agent', target: 'node_slack', animated: true, label: 'Internal Notification' },
        { id: 'e3', source: 'node_ai_agent', target: 'node_gmail', animated: true, label: 'Drafted Reply' },
        { id: 'e4', source: 'node_gmail', target: 'node_sheets', animated: true, label: 'Audit Record' },
      ];
    }
    // Pattern 3: Email / Notification / Discord specific
    else if (p.includes('email') || p.includes('gmail') || p.includes('slack') || p.includes('discord')) {
      name = 'Multi-Platform Notification & Intelligence Agent';
      description = 'Orchestrates cross-platform alerts across Slack, Discord, and Gmail with AI summarization.';
      tags = ['communication', 'alerts', 'notifications'];

      nodes = [
        createTrigger('System Event Trigger', 'manual'),
        createAI('node_ai_summary', 320, 160, 'AI Executive Brief Generator', 'Summarizer Agent', 'Generate executive summaries and tailored messages for team channels.'),
        createSlack('node_slack', 600, 80, 'Post Slack Broadcast', 'post_message', '#general', '{{node_ai_summary.summary}}'),
        createDiscord('node_discord', 600, 240, 'Post Discord Announcement', 'post_message', '📣 System Update: {{node_ai_summary.summary}}'),
        createGmail('node_gmail', 880, 160, 'Email Stakeholders', 'send_email', 'stakeholders@agentflow.ai', 'Daily Operations Summary', '{{node_ai_summary.detailedReport}}'),
      ];

      edges = [
        { id: 'e1', source: 'node_trigger', target: 'node_ai_summary', animated: true, label: 'Input Data' },
        { id: 'e2', source: 'node_ai_summary', target: 'node_slack', animated: true, label: 'Slack Format' },
        { id: 'e3', source: 'node_ai_summary', target: 'node_discord', animated: true, label: 'Discord Format' },
        { id: 'e4', source: 'node_slack', target: 'node_gmail', animated: true, label: 'Email Digest' },
      ];
    }
    // Pattern 4: General Multi-Agent Pipeline
    else {
      name = `AI Automated Workflow: ${rawPrompt.slice(0, 35)}...`;
      description = `AI-powered end-to-end automation tailored for "${rawPrompt}"`;
      tags = ['agentic', 'workflow', 'automation'];

      nodes = [
        createTrigger('Workflow Start', 'manual'),
        createAI('node_ai_planner', 320, 160, 'AI Orchestrator & Task Decomposer', 'Strategic Planner', `Analyze task requirements for: "${rawPrompt}" and generate execution payload.`),
        createSheets('node_sheets', 600, 80, 'Record Task Ledger', 'append_row', ['{{timestamp}}', 'TASK_EXECUTED', '{{node_ai_planner.status}}']),
        createSlack('node_slack', 600, 240, 'Notify Ops Channel', 'post_message', '#ops-team', 'Pipeline executed successfully: {{node_ai_planner.output}}'),
        createGmail('node_gmail', 880, 160, 'Send Audit Summary', 'send_email', 'ops@agentflow.ai', 'Workflow Execution Report', 'Task completed: {{node_ai_planner.summary}}'),
      ];

      edges = [
        { id: 'e1', source: 'node_trigger', target: 'node_ai_planner', animated: true, label: 'Trigger Event' },
        { id: 'e2', source: 'node_ai_planner', target: 'node_sheets', animated: true, label: 'Ledger Data' },
        { id: 'e3', source: 'node_ai_planner', target: 'node_slack', animated: true, label: 'Alert Payload' },
        { id: 'e4', source: 'node_sheets', target: 'node_gmail', animated: true, label: 'Summary' },
      ];
    }

    return {
      name,
      description,
      triggerConfig: { type: 'manual' },
      nodes,
      edges,
      tags,
      version: 1,
    };
  }

  parseAndValidateGraph(rawText, fallbackPrompt) {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(cleaned);

      if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        return this.generateDeterministicWorkflow(fallbackPrompt);
      }

      // Ensure nodes have coordinates and data
      parsed.nodes = parsed.nodes.map((node, index) => ({
        id: node.id || `node_${index + 1}`,
        type: node.type || 'ai_agent',
        label: node.label || node.data?.label || `Step ${index + 1}`,
        position: node.position || { x: 50 + index * 260, y: 160 },
        data: {
          label: node.label || node.data?.label || `Step ${index + 1}`,
          icon: node.data?.icon || (node.type === 'gmail' ? 'Mail' : node.type === 'slack' ? 'MessageSquare' : 'Bot'),
          description: node.data?.description || '',
          ...node.data,
        },
        config: node.config || {},
      }));

      parsed.edges = (parsed.edges || []).map((edge, index) => ({
        id: edge.id || `edge_${index + 1}`,
        source: edge.source,
        target: edge.target,
        animated: edge.animated !== undefined ? edge.animated : true,
        label: edge.label || '',
      }));

      return {
        name: parsed.name || 'AI Generated Workflow',
        description: parsed.description || `Generated workflow for "${fallbackPrompt}"`,
        triggerConfig: parsed.triggerConfig || { type: 'manual' },
        nodes: parsed.nodes,
        edges: parsed.edges,
        tags: parsed.tags || ['ai-generated'],
        version: 1,
      };
    } catch (e) {
      console.warn('[AIService] Failed to parse AI JSON response, falling back to rule builder:', e.message);
      return this.generateDeterministicWorkflow(fallbackPrompt);
    }
  }
}

export default new AIService();
