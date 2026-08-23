import { Workflow, PlayCircle, CheckCircle, Puzzle } from 'lucide-react';

export const MetricGrid = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel animate-pulse rounded-xl p-5">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-surface-800" />
            <div className="mt-3 h-8 w-16 rounded bg-slate-200 dark:bg-surface-800" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Total Workflows',
      value: stats?.totalWorkflows ?? 0,
      subtext: `${stats?.activeWorkflows ?? 0} active in production`,
      icon: Workflow,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/20',
    },
    {
      title: 'Total Runs',
      value: stats?.totalExecutions ?? 0,
      subtext: `${stats?.runningExecutions ?? 0} running currently`,
      icon: PlayCircle,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20',
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate ?? 100}%`,
      subtext: `${stats?.completedExecutions ?? 0} successful / ${stats?.failedExecutions ?? 0} failed`,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    },
    {
      title: 'Connected Integrations',
      value: stats?.connectedIntegrations ?? 0,
      subtext: 'Gmail, Slack, Discord, Sheets',
      icon: Puzzle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="glass-panel group relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.title}</span>
              <div className={`rounded-lg border p-2 ${item.bg}`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{item.value}</span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricGrid;
