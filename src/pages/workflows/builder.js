import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../../components/AppShell/AppShell.jsx';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas.jsx';
import api from '../../services/api.js';
import {
  Sparkles,
  Loader2,
  Workflow,
  Play,
  ExternalLink,
  Dices,
  Trash2,
  Search,
  CheckCircle2,
  ArrowRight,
  Send,
  Zap,
  Tag,
  Lightbulb,
} from 'lucide-react';

const promptKnowledgeBase = [
  // Invoicing & Finance
  {
    id: 'inv-1',
    title: 'Webhook Invoice Extractor & Slack Alert',
    keywords: ['invoice', 'bill', 'receipt', 'finance', 'extract', 'payment', 'money', 'vendor', 'accounting'],
    prompt: 'When an invoice arrives via webhook, extract vendor name, invoice date, line items, and total amount using AI, append the record to Google Sheets, send an alert to the #finance Slack channel, and email an invoice summary to accounts@company.com.',
    category: 'Finance',
  },
  {
    id: 'inv-2',
    title: 'Gmail Invoice PDF Parser & Ledger Sync',
    keywords: ['invoice', 'gmail', 'pdf', 'email', 'attachment', 'sheets', 'accounting', 'vendor'],
    prompt: 'Monitor Gmail for incoming emails with invoice attachments, parse line items and tax calculations with AI, record data into Google Sheets, and alert the finance team on Slack.',
    category: 'Finance',
  },
  {
    id: 'inv-3',
    title: 'High-Expense Approval Gate',
    keywords: ['expense', 'receipt', 'threshold', 'approval', 'budget', 'audit', 'over', 'dollar', 'money'],
    prompt: 'Parse expense receipts from incoming webhook using AI. If total amount exceeds $1000, trigger manager approval in Slack, else append directly to Google Sheets expense ledger.',
    category: 'Finance',
  },

  // Customer Support & Tickets
  {
    id: 'sup-1',
    title: 'Support Ticket Sentiment & Urgent Escalation',
    keywords: ['ticket', 'support', 'customer', 'sentiment', 'urgent', 'helpdesk', 'issue', 'complaint', 'angry'],
    prompt: 'When a new support ticket arrives via webhook, classify sentiment and priority with an AI agent. If sentiment is negative or priority is high, alert #customer-escalations in Slack, draft an automated empathetic Gmail reply, and log the incident in Google Sheets.',
    category: 'Support',
  },
  {
    id: 'sup-2',
    title: 'Customer Inquiry Auto-Responder & Sheets Logger',
    keywords: ['customer', 'inquiry', 'email', 'reply', 'auto-reply', 'gmail', 'support', 'question'],
    prompt: 'When a customer sends an inquiry to Gmail, analyze the questions using AI reasoning, draft a comprehensive response email, and log user contact information to Google Sheets.',
    category: 'Support',
  },
  {
    id: 'sup-3',
    title: 'Churn Risk Detection & Account Alert',
    keywords: ['churn', 'cancellation', 'risk', 'retention', 'customer', 'feedback', 'review'],
    prompt: 'When cancellation feedback is submitted via webhook, evaluate customer churn risk score with AI, send immediate retention alert to Discord VIP channel, and email account manager.',
    category: 'Support',
  },

  // Slack & Team Communication
  {
    id: 'slk-1',
    title: 'Slack Daily Standup & Summary Digest',
    keywords: ['slack', 'channel', 'summary', 'standup', 'daily', 'digest', 'report', 'team'],
    prompt: 'Aggregate daily project updates from Google Sheets, summarize key blockers and achievements using AI, and broadcast a clean executive summary to Slack #general every morning.',
    category: 'Slack',
  },
  {
    id: 'slk-2',
    title: 'Slack Bug Notification & Tracking',
    keywords: ['slack', 'bug', 'error', 'alert', 'dev', 'developer', 'channel', 'notify'],
    prompt: 'When an error report webhook is received, synthesize debug notes with an AI engineer agent, post actionable bug cards to Slack #dev-alerts, and notify the on-call engineer.',
    category: 'Slack',
  },

  // Gmail & Email Automation
  {
    id: 'gml-1',
    title: 'Gmail Newsletter & Content Summarizer',
    keywords: ['gmail', 'email', 'newsletter', 'digest', 'read', 'summarize', 'inbox'],
    prompt: 'Read unread industry newsletters in Gmail, generate a 3-bullet executive summary with AI, save key insights to Google Sheets, and post the digest to Slack.',
    category: 'Gmail',
  },
  {
    id: 'gml-2',
    title: 'Automated Client Onboarding Sequence',
    keywords: ['onboard', 'welcome', 'client', 'email', 'gmail', 'new', 'signup'],
    prompt: 'When a new client signs up via webhook, extract profile details with AI, send a customized welcome email via Gmail, create a client row in Google Sheets, and alert Slack #sales.',
    category: 'Gmail',
  },

  // Google Sheets & Data Operations
  {
    id: 'sht-1',
    title: 'Google Sheets Data Extraction & Discord Broadcast',
    keywords: ['sheets', 'google', 'spreadsheet', 'data', 'table', 'row', 'append', 'metrics'],
    prompt: 'Read key performance data from Google Sheets, analyze week-over-week trends using AI, and broadcast highlighted wins to Discord announcements channel and Slack.',
    category: 'Google Sheets',
  },
  {
    id: 'sht-2',
    title: 'Survey Feedback Analyzer to Spreadsheet',
    keywords: ['survey', 'feedback', 'form', 'sheets', 'analysis', 'rating', 'review'],
    prompt: 'When survey responses arrive via webhook, categorize qualitative answers with AI into sentiment clusters, append structured records to Google Sheets, and alert the product channel.',
    category: 'Google Sheets',
  },

  // DevOps & System Alerts
  {
    id: 'dev-1',
    title: 'Server Anomaly Detection & Discord Webhook',
    keywords: ['server', 'devops', 'incident', 'anomaly', 'telemetry', 'discord', 'webhook', 'crash', 'down', 'uptime'],
    prompt: 'Analyze incoming server telemetry logs with AI reasoning agent, classify error stack severity, broadcast incident notifications to Discord and Slack #ops-alerts, and email on-call engineer.',
    category: 'DevOps',
  },
  {
    id: 'dev-2',
    title: 'CI/CD Build Failure Triage',
    keywords: ['build', 'ci', 'cd', 'deploy', 'github', 'pipeline', 'test', 'fail'],
    prompt: 'When a CI/CD build fails, summarize raw build logs using an AI debugging agent, identify suspect commit author, post rich embed to Discord, and alert developer on Slack.',
    category: 'DevOps',
  },

  // Marketing & Sales
  {
    id: 'mkt-1',
    title: 'Inbound Lead Enrichment & Sales Dispatch',
    keywords: ['lead', 'sales', 'enrich', 'crm', 'marketing', 'conversion', 'prospect'],
    prompt: 'When a new lead submits a contact form, enrich lead company details with an AI agent, record lead in Google Sheets, dispatch Discord sales announcement, and trigger a welcome email in Gmail.',
    category: 'Sales',
  },
  {
    id: 'mkt-2',
    title: 'Social Media Trend & Sentiment Monitor',
    keywords: ['social', 'twitter', 'trend', 'brand', 'mention', 'marketing', 'viral'],
    prompt: 'Collect brand mentions via webhook, run batch sentiment classification with AI, log structured feedback in Google Sheets, and notify marketing channel on Slack.',
    category: 'Marketing',
  },
];

const quickDirectiveChips = [
  { label: '+ Gmail Email', text: ', email a summary confirmation via Gmail' },
  { label: '+ Slack Alert', text: ', dispatch structured notification to Slack #alerts' },
  { label: '+ Google Sheets', text: ', append extracted records to Google Sheets' },
  { label: '+ Discord Webhook', text: ', broadcast real-time embed to Discord' },
  { label: '+ AI Sentiment', text: ', analyze sentiment and classification with AI' },
  { label: '+ Approval Condition', text: ', evaluate threshold condition and route approval logic' },
];

export default function AIWorkflowBuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Dynamic Relatable Suggestions based on current input
  const dynamicSuggestions = useMemo(() => {
    const query = prompt.trim().toLowerCase();
    if (!query) {
      // Return top recommended starter templates when empty
      return promptKnowledgeBase.slice(0, 5);
    }

    const words = query.split(/\s+/).filter((w) => w.length > 1);

    // Score each item based on keyword & text matching
    const scored = promptKnowledgeBase.map((item) => {
      let score = 0;
      const lowerPrompt = item.prompt.toLowerCase();
      const lowerTitle = item.title.toLowerCase();
      const lowerCategory = item.category.toLowerCase();

      // Exact substring match
      if (lowerPrompt.includes(query)) score += 50;
      if (lowerTitle.includes(query)) score += 40;
      if (lowerCategory.includes(query)) score += 30;

      // Word level matches
      for (const word of words) {
        if (item.keywords.some((k) => k.includes(word) || word.includes(k))) score += 20;
        if (lowerPrompt.includes(word)) score += 10;
        if (lowerTitle.includes(word)) score += 10;
      }

      return { ...item, score };
    });

    // Sort by relevance score
    const matches = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

    // If query has no direct keyword match, synthesize a custom dynamic suggestion based on their input!
    if (matches.length === 0) {
      return [
        {
          id: 'custom-continuation',
          title: `Autonomous Workflow for: "${query.slice(0, 30)}..."`,
          category: 'AI Generated',
          prompt: `${prompt.trim()}, extract key parameters with AI reasoning, record output in Google Sheets, and send structured alerts to Slack #general.`,
          isDynamic: true,
        },
        ...promptKnowledgeBase.slice(0, 3),
      ];
    }

    return matches.slice(0, 6);
  }, [prompt]);

  const handleGenerate = async (targetPrompt) => {
    const textToUse = targetPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await api.post('/workflows/generate', { prompt: textToUse });
      const wf = res.data;
      setGeneratedWorkflow(wf);
      setNodes(wf.nodes || []);
      setEdges(wf.edges || []);
    } catch (err) {
      setError(err.message || 'Generation failed. Please try a different prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSuggestion = (suggestedText, autoGenerate = false) => {
    setPrompt(suggestedText);
    if (autoGenerate) {
      handleGenerate(suggestedText);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleSurpriseMe = () => {
    const randomItem = promptKnowledgeBase[Math.floor(Math.random() * promptKnowledgeBase.length)];
    setPrompt(randomItem.prompt);
    handleGenerate(randomItem.prompt);
  };

  const handleAppendChip = (chipText) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return `When an event triggers${chipText}.`;
      }
      return `${trimmed}${chipText}.`;
    });
    inputRef.current?.focus();
  };

  const handleOpenInEditor = () => {
    if (generatedWorkflow?._id || generatedWorkflow?.id) {
      router.push(`/workflows/${generatedWorkflow._id || generatedWorkflow.id}`);
    }
  };

  const handleExecuteNow = async () => {
    if (!generatedWorkflow?._id && !generatedWorkflow?.id) return;
    try {
      const res = await api.post(`/workflows/${generatedWorkflow._id || generatedWorkflow.id}/execute`, {});
      if (res.data?._id || res.data?.id) {
        router.push(`/executions/${res.data._id || res.data.id}`);
      }
    } catch (err) {
      alert(`Execution failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex h-[calc(100vh-6.5rem)] flex-col gap-5 lg:flex-row">
          {/* Left Panel: Prompt Studio & Smart Suggestions */}
          <div className="flex w-full flex-col justify-between rounded-xl border border-slate-200 dark:border-surface-800 bg-white/95 dark:bg-surface-900/90 p-5 backdrop-blur-md lg:w-[440px] shrink-0 shadow-sm overflow-y-auto">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-brand-100 dark:bg-brand-500/20 p-1.5 text-brand-600 dark:text-brand-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      AI Prompt-to-Graph Studio
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Type keywords or natural language below. Relatable suggestions will appear in real time!
                  </p>
                </div>

                {/* Surprise Me Button */}
                <button
                  onClick={handleSurpriseMe}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition shadow-sm"
                  title="Generate a random workflow"
                >
                  <Dices className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Surprise Me</span>
                </button>
              </div>

              {/* Prompt Search / Textarea Box */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                    <span>Describe Automation / Search Keyword</span>
                  </label>
                  {prompt && (
                    <button
                      onClick={() => setPrompt('')}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    ref={inputRef}
                    rows={4}
                    value={prompt}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type anything (e.g. 'invoice', 'slack', 'ticket', 'email', 'sheets', 'error')..."
                    className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-slate-50 dark:bg-surface-950 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed shadow-inner"
                  />
                </div>

                {/* Quick Directive Chips */}
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400 mb-1.5">
                    <Tag className="h-3 w-3" />
                    <span>Quick Add Actions:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickDirectiveChips.map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleAppendChip(chip.text)}
                        className="rounded-md border border-slate-200 dark:border-surface-700 bg-slate-100 dark:bg-surface-850 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/20 dark:hover:text-brand-300 transition"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Main Button */}
              <button
                onClick={() => handleGenerate(prompt)}
                disabled={isGenerating || !prompt.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Agent Graph...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Visual Workflow</span>
                  </>
                )}
              </button>

              {/* Error Alert */}
              {error && (
                <div className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* REAL-TIME RELATABLE SMART SUGGESTIONS */}
              <div className="pt-2 border-t border-slate-200 dark:border-surface-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {prompt.trim() ? (
                        <>Relatable Suggestions for <span className="text-brand-600 dark:text-brand-400">"{prompt.slice(0, 18)}{prompt.length > 18 ? '...' : ''}"</span></>
                      ) : (
                        'Smart Quick Suggestions'
                      )}
                    </h4>
                  </div>
                  <span className="rounded bg-slate-100 dark:bg-surface-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {dynamicSuggestions.length} available
                  </span>
                </div>

                {/* Relatable Suggestion Cards */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {dynamicSuggestions.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-lg border border-slate-200 dark:border-surface-800 bg-slate-50/90 dark:bg-surface-850 p-2.5 transition hover:border-brand-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-surface-800 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="rounded bg-brand-100 dark:bg-brand-500/20 px-1.5 py-0.2 text-[9px] font-bold text-brand-700 dark:text-brand-300">
                              {item.category}
                            </span>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
                              {item.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {item.prompt}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200/60 dark:border-surface-800/60 pt-2">
                        <button
                          onClick={() => handleSelectSuggestion(item.prompt, false)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-surface-700 transition"
                        >
                          <span>Insert to Box</span>
                        </button>
                        <button
                          onClick={() => handleSelectSuggestion(item.prompt, true)}
                          className="flex items-center gap-1 rounded bg-brand-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-brand-500 transition"
                        >
                          <Send className="h-2.5 w-2.5" />
                          <span>Generate Graph</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workflow Action Bar */}
            {generatedWorkflow && (
              <div className="pt-4 border-t border-slate-200 dark:border-surface-800 space-y-2">
                <button
                  onClick={handleExecuteNow}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500"
                >
                  <Play className="h-4 w-4" />
                  <span>Execute Workflow Now</span>
                </button>
                <button
                  onClick={handleOpenInEditor}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Full Visual Canvas</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Live Interactive Graph Preview */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-surface-800 bg-white dark:bg-surface-950 shadow-sm">
            {/* Top Toolbar */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-surface-800 bg-slate-50/90 dark:bg-surface-900/60 px-5">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                  {generatedWorkflow ? generatedWorkflow.name : 'Interactive Graph Preview'}
                </span>
                {generatedWorkflow && (
                  <span className="rounded bg-brand-100 dark:bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                    {nodes.length} Nodes Generated
                  </span>
                )}
              </div>

              {generatedWorkflow && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Engine: Multi-Tier AI Substrate</span>
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              {nodes.length > 0 ? (
                <WorkflowCanvas
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={() => {}}
                  onEdgesChange={() => {}}
                  setEdges={setEdges}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
                  <div className="rounded-2xl border border-slate-200 dark:border-surface-800 bg-slate-50/60 dark:bg-surface-900/50 p-6 max-w-sm">
                    <Sparkles className="mx-auto h-10 w-10 text-brand-500 dark:text-brand-400 opacity-70 mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Graph Generated Yet</h3>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Type any keyword in the box on the left (e.g. <em>invoice</em>, <em>slack</em>, <em>ticket</em>, <em>error</em>, <em>sheets</em>) to see relatable suggestions, then click <strong>Generate Graph</strong>!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
