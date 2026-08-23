import React from 'react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  Disc,
  Table,
  Filter,
  Layers,
  GripVertical,
} from 'lucide-react';

const nodePaletteCategories = [
  {
    category: 'Triggers',
    items: [
      {
        type: 'trigger',
        label: 'Webhook Trigger',
        description: 'Initiate flow on external HTTP POST webhook',
        icon: Zap,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20',
        config: { type: 'webhook' },
      },
      {
        type: 'trigger',
        label: 'Manual Trigger',
        description: 'Initiate flow manually on demand',
        icon: Zap,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20',
        config: { type: 'manual' },
      },
    ],
  },
  {
    category: 'AI & Agents',
    items: [
      {
        type: 'ai_agent',
        label: 'AI Reasoning Agent',
        description: 'Analyzes inputs and decomposes goals with LLMs',
        icon: Bot,
        color: 'text-brand-600 dark:text-brand-400',
        bg: 'bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/20',
        config: { role: 'Reasoning Specialist', model: 'gemini-2.0-flash' },
      },
      {
        type: 'ai_agent',
        label: 'AI Invoice Extractor',
        description: 'Extracts line items, vendor, and amounts',
        icon: Bot,
        color: 'text-brand-600 dark:text-brand-400',
        bg: 'bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/20',
        config: { role: 'Financial Parser', promptTemplate: 'Extract invoice fields from input.' },
      },
    ],
  },
  {
    category: 'Third-Party Tools',
    items: [
      {
        type: 'gmail',
        label: 'Gmail Send Email',
        description: 'Dispatches emails via authenticated Google OAuth',
        icon: Mail,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20',
        config: { action: 'send_email', to: 'recipient@example.com', subject: 'Automated Notification' },
      },
      {
        type: 'slack',
        label: 'Slack Post Message',
        description: 'Sends messages and structured blocks to Slack',
        icon: MessageSquare,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20',
        config: { action: 'post_message', channel: '#general', text: 'Workflow alert' },
      },
      {
        type: 'discord',
        label: 'Discord Post Message',
        description: 'Dispatches notifications to Discord channels',
        icon: Disc,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20',
        config: { action: 'post_message', content: 'Agentflow event triggered' },
      },
      {
        type: 'google_sheets',
        label: 'Google Sheets Append',
        description: 'Appends rows into spreadsheets in real-time',
        icon: Table,
        color: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20',
        config: { action: 'append_row', spreadsheetId: 'default_sheet', range: 'Sheet1!A:E' },
      },
    ],
  },
  {
    category: 'Logic & Flow',
    items: [
      {
        type: 'logic_filter',
        label: 'Condition Filter',
        description: 'Branches or gates workflow execution',
        icon: Filter,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20',
        config: { condition: 'status', operator: 'equals', value: 'approved' },
      },
    ],
  },
];

export const NodePalette = () => {
  const onDragStart = (event, item) => {
    event.dataTransfer.setData('application/agentflow-nodetype', item.type);
    event.dataTransfer.setData('application/agentflow-nodelabel', item.label);
    event.dataTransfer.setData('application/agentflow-nodedesc', item.description);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 dark:border-surface-800/80 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 dark:border-surface-800 px-4">
        <Layers className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Node Palette</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {nodePaletteCategories.map((cat) => (
          <div key={cat.category} className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              {cat.category}
            </h4>
            <div className="space-y-1.5">
              {cat.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    draggable
                    onDragStart={(e) => onDragStart(e, item)}
                    className="group flex cursor-grab items-center justify-between rounded-lg border border-slate-200 dark:border-surface-800 bg-slate-50/80 dark:bg-surface-850 p-2.5 shadow-sm transition hover:border-brand-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-surface-800 active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`rounded-md border p-1.5 ${item.bg} ${item.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                      </div>
                    </div>
                    <GripVertical className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 shrink-0 ml-1" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
