import React from 'react';
import { useWorkflowStore } from '../../store/workflowStore.js';
import {
  Sliders,
  Trash2,
  X,
} from 'lucide-react';

export const NodeConfigPanel = () => {
  const { selectedNode, setSelectedNode, updateNodeConfig, deleteNode } = useWorkflowStore();

  if (!selectedNode) return null;

  const { id, type, label, config = {} } = selectedNode;

  const handleLabelChange = (e) => {
    updateNodeConfig(id, {}, e.target.value);
  };

  const handleConfigChange = (key, value) => {
    updateNodeConfig(id, { [key]: value });
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-200 dark:border-surface-800/80 bg-white/95 dark:bg-surface-900/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-surface-800 px-4">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Properties Inspector</h3>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Node ID & Type Pill */}
        <div className="rounded-lg bg-slate-100 dark:bg-surface-850 p-3 border border-slate-200 dark:border-surface-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500">Node ID</span>
            <span className="font-mono text-[11px] font-semibold text-brand-600 dark:text-brand-400">{id}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500">Type</span>
            <span className="rounded bg-white dark:bg-surface-800 border border-slate-200 dark:border-transparent px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase">
              {type}
            </span>
          </div>
        </div>

        {/* Node Label Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            Display Label
          </label>
          <input
            type="text"
            value={label || ''}
            onChange={handleLabelChange}
            className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Dynamic Fields by Type */}
        {type === 'trigger' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Trigger Method
              </label>
              <select
                value={config.type || 'manual'}
                onChange={(e) => handleConfigChange('type', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="manual">Manual Operator Trigger</option>
                <option value="webhook">Incoming HTTP Webhook</option>
                <option value="schedule">Scheduled Cron Job</option>
              </select>
            </div>
            {config.type === 'schedule' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Cron Expression
                </label>
                <input
                  type="text"
                  placeholder="0 * * * *"
                  value={config.schedule || ''}
                  onChange={(e) => handleConfigChange('schedule', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {type === 'ai_agent' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Agent Role</label>
              <input
                type="text"
                placeholder="e.g. Financial Analyst"
                value={config.role || ''}
                onChange={(e) => handleConfigChange('role', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">AI Model Substrate</label>
              <select
                value={config.model || 'gemini-2.0-flash'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (OpenRouter)</option>
                <option value="openai/gpt-4o">GPT-4o (OpenRouter)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Prompt / System Directive
              </label>
              <textarea
                rows={4}
                placeholder="Extract parameters from payload {{node_trigger.payload}}..."
                value={config.promptTemplate || ''}
                onChange={(e) => handleConfigChange('promptTemplate', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {type === 'gmail' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Action</label>
              <select
                value={config.action || 'send_email'}
                onChange={(e) => handleConfigChange('action', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="send_email">Send Email</option>
                <option value="read_emails">Read Unread Emails</option>
              </select>
            </div>
            {config.action !== 'read_emails' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">To</label>
                  <input
                    type="text"
                    placeholder="user@example.com"
                    value={config.to || ''}
                    onChange={(e) => handleConfigChange('to', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Subject line"
                    value={config.subject || ''}
                    onChange={(e) => handleConfigChange('subject', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Body Template</label>
                  <textarea
                    rows={3}
                    placeholder="Email body text or HTML..."
                    value={config.body || ''}
                    onChange={(e) => handleConfigChange('body', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {type === 'slack' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Target Channel</label>
              <input
                type="text"
                placeholder="#general or #alerts"
                value={config.channel || ''}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Message Text</label>
              <textarea
                rows={3}
                placeholder="Alert text: {{node_ai_agent.summary}}"
                value={config.text || ''}
                onChange={(e) => handleConfigChange('text', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {type === 'discord' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Message Content</label>
              <textarea
                rows={3}
                placeholder="Discord message text..."
                value={config.content || ''}
                onChange={(e) => handleConfigChange('content', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {type === 'google_sheets' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Spreadsheet ID</label>
              <input
                type="text"
                placeholder="ops_ledger_2026"
                value={config.spreadsheetId || ''}
                onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Range</label>
              <input
                type="text"
                placeholder="Sheet1!A:E"
                value={config.range || ''}
                onChange={(e) => handleConfigChange('range', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Delete Node Button */}
        <div className="pt-6 border-t border-slate-200 dark:border-surface-800">
          <button
            onClick={() => deleteNode(id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 py-2 font-medium text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove Node</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
