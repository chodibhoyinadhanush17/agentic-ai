import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../components/AppShell/AppShell.jsx';
import api from '../services/api.js';
import {
  Mail,
  MessageSquare,
  Disc,
  Table,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  ShieldCheck,
  Key,
} from 'lucide-react';

const integrationCards = [
  {
    provider: 'gmail',
    name: 'Gmail Workspace',
    description: 'Send automated emails, read inbox alerts, and manage customer threads.',
    icon: Mail,
    color: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-500/30',
    bg: 'bg-red-50 dark:bg-red-500/10',
    scopes: ['gmail.send', 'gmail.readonly'],
  },
  {
    provider: 'slack',
    name: 'Slack Bot & Channels',
    description: 'Post automated channel alerts, interactive messages, and team notifications.',
    icon: MessageSquare,
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    scopes: ['chat:write', 'channels:read', 'incoming-webhook'],
  },
  {
    provider: 'discord',
    name: 'Discord Bot & Webhooks',
    description: 'Dispatch real-time rich embeds and incident updates to Discord servers.',
    icon: Disc,
    color: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-500/30',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    scopes: ['bot', 'incoming-webhook'],
  },
  {
    provider: 'google-sheets',
    name: 'Google Sheets & Drive',
    description: 'Append live execution records, update financial ledgers, and query data ranges.',
    icon: Table,
    color: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-500/30',
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    scopes: ['spreadsheets', 'drive.readonly'],
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/integrations');
      setIntegrations(res.data || []);
    } catch (err) {
      console.warn('[Integrations] Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();

    if (router.query.success) {
      setStatusMessage({ type: 'success', text: `Successfully connected ${router.query.success}!` });
    } else if (router.query.error) {
      setStatusMessage({ type: 'error', text: `Authentication error: ${router.query.error}` });
    }
  }, [router.query]);

  const handleConnect = async (provider) => {
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      alert(`OAuth initiation failed: ${err.message}`);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider}?`)) return;
    try {
      await api.post(`/integrations/${provider}/disconnect`, {});
      fetchIntegrations();
      setStatusMessage({ type: 'info', text: `${provider} has been disconnected.` });
    } catch (err) {
      alert(`Disconnect failed: ${err.message}`);
    }
  };

  const isProviderConnected = (provider) => {
    const found = integrations.find((i) => i.provider === provider);
    return found?.isConnected;
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Integrations & Credentials</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Connect external accounts via OAuth. Credentials are automatically encrypted at rest using AES-256.
              </p>
            </div>

            <button
              onClick={fetchIntegrations}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-800 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`flex items-center justify-between rounded-xl border p-4 text-xs ${
                statusMessage.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                  : 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Integration Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {integrationCards.map((card) => {
              const Icon = card.icon;
              const connected = isProviderConnected(card.provider);

              return (
                <div
                  key={card.provider}
                  className="glass-panel flex flex-col justify-between rounded-xl border border-slate-200 dark:border-surface-800 p-6 transition hover:border-brand-400 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl border p-3 ${card.bg} ${card.border} ${card.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{card.name}</h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                            />
                            <span className={`text-[11px] font-semibold ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {connected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{card.description}</p>

                    {/* Scopes */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {card.scopes.map((s) => (
                        <span
                          key={s}
                          className="rounded bg-slate-100 dark:bg-surface-850 border border-slate-200 dark:border-surface-800 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-400 font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-surface-800 pt-4">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>AES-256 Encrypted</span>
                    </span>

                    {connected ? (
                      <button
                        onClick={() => handleDisconnect(card.provider)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                      >
                        <Power className="h-3.5 w-3.5" />
                        <span>Disconnect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(card.provider)}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-500"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span>Connect OAuth</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
