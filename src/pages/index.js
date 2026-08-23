import Link from 'next/link';
import { useThemeStore } from '../store/themeStore.js';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

export default function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();

  const agents = [
    {
      name: '1. Planner Agent',
      desc: 'Topological sort DAG engine using Kahn algorithm with confidence estimation (0.0 - 1.0).',
      color: 'border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10',
    },
    {
      name: '2. Execution Agent',
      desc: 'Interpolates {{node.field}} template parameters and dispatches requests to OAuth integrations or AI LLMs.',
      color: 'border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      name: '3. Validation Agent',
      desc: 'Validates node outputs against strict schema contracts with deep-field pattern verification.',
      color: 'border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      name: '4. Recovery Agent',
      desc: '5-tier failure taxonomy classification with intelligent exponential backoff and operator escalation.',
      color: 'border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
    },
    {
      name: '5. Monitoring Agent',
      desc: 'Real-time WebSocket event broadcaster and granular execution audit logger.',
      color: 'border-purple-300 dark:border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-surface-800/80 bg-white/80 dark:bg-surface-900/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Agentflow<span className="text-brand-600 dark:text-brand-400">_AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-surface-800 bg-slate-100 dark:bg-surface-850 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-surface-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-500/30 bg-brand-50/80 dark:bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Multi-Agent AI Operations Platform</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl sm:leading-tight">
            Turn Natural Language Into{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-brand-400 dark:via-indigo-300 dark:to-purple-400">
              Executable Visual Agent Graphs
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg leading-relaxed">
            Generate complex DAG workflows from plain English, render them on an interactive visual canvas, and execute through a 5-stage cooperating chain of specialized AI agents.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workflows/builder"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              <span>Prompt to Graph Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-surface-800"
            >
              <span>Operator Console</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5-Agent Pipeline Showcase */}
      <section className="py-16 bg-slate-100/70 dark:bg-surface-900/40 border-y border-slate-200 dark:border-surface-800/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Deterministic Orchestration
            </h2>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              The 5 Cooperating AI Agents
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="glass-panel flex flex-col justify-between rounded-xl border p-5 shadow-sm hover:shadow-md transition bg-white/90 dark:bg-surface-900/80"
              >
                <div>
                  <div className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${agent.color}`}>
                    {agent.name}
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{agent.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
              <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 p-3 text-brand-600 dark:text-brand-400 w-fit">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Interactive React Flow Canvas</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Drag and drop nodes from the palette, connect bezier curved edges, inspect properties, and trigger visual test runs in real time.
              </p>
            </div>

            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 text-emerald-600 dark:text-emerald-400 w-fit">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">AES-256 Encrypted Integrations</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                OAuth tokens for Gmail, Slack, Discord, and Google Sheets are securely encrypted at rest with randomized initialization vectors.
              </p>
            </div>

            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3 text-indigo-600 dark:text-indigo-400 w-fit">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Zero-Config Local Fallbacks</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Built-in high-performance in-memory database and async queue fallbacks ensure instant local execution without external MongoDB or Redis dependencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-surface-800/80 bg-white dark:bg-surface-950 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© 2026 Agentflow_AI. Autonomous Multi-Agent Operations Console.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">Operator Console</Link>
            <Link href="/workflows/builder" className="hover:underline">AI Studio</Link>
            <Link href="/settings" className="hover:underline">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
