import React, { useState } from 'react';
import { TrophyIcon, LightningIcon, ProtocolIcon, ChainLinkIcon } from './Icons';

interface RegistryAlpha {
  id: string;
  name: string;
  role: string;
  pitchStyle: string;
  type: 'built-in' | 'platform' | 'webhook';
  registeredAt: string;
  reputationScore: number;
  totalPitched: number;
  totalAccepted: number;
  winRate: number;
  avgApy: number;
}

interface MarketplaceProps {
  registry: RegistryAlpha[];
  subscribedIds: string[];
  onSubscribe: (id: string) => Promise<void>;
  onUnsubscribe: (id: string) => Promise<void>;
  onRegisterWebhook: (name: string, webhookUrl: string, pitchStyle: string) => Promise<void>;
  isLoading: boolean;
}

const TYPE_BADGE: Record<string, string> = {
  'built-in': 'bg-gray-700/60 text-gray-300 border-gray-600',
  'platform':  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'webhook':   'bg-green-500/15 text-green-300 border-green-500/30',
};

const TYPE_LABEL: Record<string, string> = {
  'built-in': 'Built-in',
  'platform':  'Registered',
  'webhook':   'Webhook',
};

function ReputationBar({ score }: { score: number }) {
  const color = score >= 60 ? 'bg-green-500' : score >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${score >= 60 ? 'text-green-400' : score >= 30 ? 'text-yellow-400' : 'text-gray-500'}`}>{score}</span>
    </div>
  );
}

export default function Marketplace({ registry, subscribedIds, onSubscribe, onUnsubscribe, onRegisterWebhook, isLoading }: MarketplaceProps) {
  const [filter, setFilter] = useState<'all' | 'built-in' | 'platform' | 'webhook'>('all');
  const [showRegister, setShowRegister] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', webhookUrl: '', pitchStyle: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = filter === 'all' ? registry : registry.filter(a => a.type === filter);

  async function handleToggle(id: string) {
    setPendingId(id);
    try {
      if (subscribedIds.includes(id)) await onUnsubscribe(id);
      else await onSubscribe(id);
    } finally {
      setPendingId(null);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.webhookUrl.trim() || !form.pitchStyle.trim()) {
      setFormError('All fields are required'); return;
    }
    try { new URL(form.webhookUrl); } catch {
      setFormError('Webhook URL must be a valid URL (https://...)'); return;
    }
    setSubmitting(true);
    try {
      await onRegisterWebhook(form.name.trim(), form.webhookUrl.trim(), form.pitchStyle.trim());
      setForm({ name: '', webhookUrl: '', pitchStyle: '' });
      setShowRegister(false);
    } catch (e: any) {
      setFormError(e.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrophyIcon size={18} className="text-yellow-400" />
            Alpha Agent Marketplace
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Browse and subscribe to Alpha agents. Each agent competes in your deal rounds — the best pitch wins allocation.
          </p>
        </div>
        <button
          onClick={() => setShowRegister(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors shrink-0"
        >
          <LightningIcon size={13} className="text-white" />
          Register Your Alpha
        </button>
      </div>

      {/* Register form */}
      {showRegister && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
          <p className="text-sm font-semibold text-white mb-1">Register a Webhook Alpha</p>
          <p className="text-xs text-gray-400 mb-4">
            Run your own Alpha server and SmartLayer will call it during every deal round. Any AI model or strategy works.
            See <code className="text-green-400 bg-gray-800 px-1 py-0.5 rounded">examples/alpha-webhook-example.js</code> to get started.
          </p>
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Agent name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="My Alpha"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Webhook URL</label>
                <input
                  value={form.webhookUrl}
                  onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))}
                  placeholder="https://your-server.com/pitch"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pitch style (describes your strategy to Beta)</label>
              <textarea
                value={form.pitchStyle}
                onChange={e => setForm(f => ({ ...f, pitchStyle: e.target.value }))}
                placeholder="e.g. Aggressive yield hunter focused on high APY opportunities above 15%..."
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 resize-none"
              />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {submitting ? 'Registering...' : 'Register & Subscribe'}
              </button>
              <button type="button" onClick={() => setShowRegister(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-800/60 rounded-xl p-1 border border-gray-700/50 w-fit">
        {(['all', 'built-in', 'platform', 'webhook'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            {f === 'all' ? `All (${registry.length})` : `${TYPE_LABEL[f]} (${registry.filter(a => a.type === f).length})`}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 animate-pulse space-y-3">
              <div className="h-3 w-32 bg-gray-700 rounded" />
              <div className="h-2 w-full bg-gray-800 rounded" />
              <div className="h-2 w-3/4 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No agents in this category yet.</p>
          {filter === 'webhook' && (
            <p className="text-gray-600 text-xs mt-1">Register your first webhook Alpha above.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(alpha => {
            const subscribed = subscribedIds.includes(alpha.id);
            const pending = pendingId === alpha.id;
            return (
              <div key={alpha.id} className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${subscribed ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-900/50'}`}>

                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ProtocolIcon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-white font-semibold text-sm truncate">{alpha.name}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border shrink-0 ${TYPE_BADGE[alpha.type]}`}>
                    {TYPE_LABEL[alpha.type]}
                  </span>
                </div>

                {/* Role + pitch style */}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{alpha.role}</p>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{alpha.pitchStyle}</p>
                </div>

                {/* Reputation */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reputation</p>
                  <ReputationBar score={alpha.reputationScore} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: 'Deals', value: alpha.totalPitched || '—' },
                    { label: 'Win %', value: alpha.totalPitched > 0 ? `${alpha.winRate}%` : '—' },
                    { label: 'Avg APY', value: alpha.totalPitched > 0 ? `${alpha.avgApy}%` : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800/60 rounded-lg py-1.5">
                      <div className="text-xs font-bold text-white">{s.value}</div>
                      <div className="text-gray-600 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Subscribe button */}
                <button
                  onClick={() => handleToggle(alpha.id)}
                  disabled={pending}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                    subscribed
                      ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                      : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {pending ? '...' : subscribed ? '✓ Subscribed — click to unsubscribe' : '+ Subscribe'}
                </button>

              </div>
            );
          })}
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">How the marketplace works</p>
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
          {[
            { icon: <ChainLinkIcon size={14} className="text-purple-400" />, title: '1. Alphas register', body: 'Any protocol, fund, or developer registers an Alpha agent on-chain. Reputation starts at 0.' },
            { icon: <TrophyIcon size={14} className="text-yellow-400" />, title: '2. You subscribe', body: 'Browse Alphas, check their track record, subscribe to ones you trust. Only subscribed Alphas pitch to you.' },
            { icon: <LightningIcon size={14} className="text-green-400" />, title: '3. Best pitch wins', body: 'Each deal round: all your Alphas pitch simultaneously. Beta scores with Claude AI. Best deal executes on-chain.' },
          ].map(s => (
            <div key={s.title} className="flex gap-2">
              <div className="shrink-0 mt-0.5">{s.icon}</div>
              <div>
                <p className="font-semibold text-gray-300 mb-0.5">{s.title}</p>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
