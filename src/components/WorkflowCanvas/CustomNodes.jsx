import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  Disc,
  Table,
  Filter,
} from 'lucide-react';

const nodeTypeConfigs = {
  trigger: {
    icon: Zap,
    color: 'text-amber-500 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-500/40',
    bg: 'from-amber-50/90 to-white dark:from-amber-500/10 dark:to-surface-900',
    badge: 'Trigger',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  },
  ai_agent: {
    icon: Bot,
    color: 'text-brand-600 dark:text-brand-400',
    border: 'border-brand-300 dark:border-brand-500/40',
    bg: 'from-brand-50/90 to-white dark:from-brand-500/10 dark:to-surface-900',
    badge: 'AI Agent',
    badgeBg: 'bg-brand-100 text-brand-800 dark:bg-brand-500/20 dark:text-brand-300',
  },
  gmail: {
    icon: Mail,
    color: 'text-red-500 dark:text-red-400',
    border: 'border-red-300 dark:border-red-500/40',
    bg: 'from-red-50/90 to-white dark:from-red-500/10 dark:to-surface-900',
    badge: 'Gmail',
    badgeBg: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  },
  slack: {
    icon: MessageSquare,
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-500/40',
    bg: 'from-emerald-50/90 to-white dark:from-emerald-500/10 dark:to-surface-900',
    badge: 'Slack',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  },
  discord: {
    icon: Disc,
    color: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-300 dark:border-indigo-500/40',
    bg: 'from-indigo-50/90 to-white dark:from-indigo-500/10 dark:to-surface-900',
    badge: 'Discord',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300',
  },
  google_sheets: {
    icon: Table,
    color: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-300 dark:border-teal-500/40',
    bg: 'from-teal-50/90 to-white dark:from-teal-500/10 dark:to-surface-900',
    badge: 'Sheets',
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
  },
  logic_filter: {
    icon: Filter,
    color: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-500/40',
    bg: 'from-purple-50/90 to-white dark:from-purple-500/10 dark:to-surface-900',
    badge: 'Logic',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
  },
};

const GenericCustomNode = ({ data, selected, id, type }) => {
  const cfg = nodeTypeConfigs[type] || nodeTypeConfigs.ai_agent;
  const Icon = cfg.icon;
  const isTrigger = type === 'trigger';

  return (
    <div
      className={`min-w-[210px] rounded-xl border bg-gradient-to-b ${cfg.bg} p-3.5 shadow-md dark:shadow-xl backdrop-blur-md transition-all duration-200 ${
        selected
          ? 'border-brand-500 ring-2 ring-brand-500/50 shadow-brand-500/20'
          : `${cfg.border} hover:border-slate-400 dark:hover:border-slate-500`
      }`}
    >
      {/* Input Handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !bg-brand-500 !border-2 !border-white dark:!border-surface-900"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-surface-950/60 p-1.5 shadow-sm ${cfg.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
              {data.label || 'Action Node'}
            </h4>
          </div>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.badgeBg}`}>
          {cfg.badge}
        </span>
      </div>

      {/* Node Description */}
      {data.description && (
        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !bg-brand-500 !border-2 !border-white dark:!border-surface-900"
      />
    </div>
  );
};

export const TriggerNode = memo((props) => <GenericCustomNode {...props} type="trigger" />);
export const AIAgentNode = memo((props) => <GenericCustomNode {...props} type="ai_agent" />);
export const GmailNode = memo((props) => <GenericCustomNode {...props} type="gmail" />);
export const SlackNode = memo((props) => <GenericCustomNode {...props} type="slack" />);
export const DiscordNode = memo((props) => <GenericCustomNode {...props} type="discord" />);
export const GoogleSheetsNode = memo((props) => <GenericCustomNode {...props} type="google_sheets" />);
export const LogicFilterNode = memo((props) => <GenericCustomNode {...props} type="logic_filter" />);

export const customNodeTypes = {
  trigger: TriggerNode,
  ai_agent: AIAgentNode,
  gmail: GmailNode,
  slack: SlackNode,
  discord: DiscordNode,
  google_sheets: GoogleSheetsNode,
  logic_filter: LogicFilterNode,
};

export default customNodeTypes;
