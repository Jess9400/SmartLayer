import React, { useState, useCallback } from 'react';
import { subscribeToAlpha, unsubscribeFromAlpha, getDealHistory } from '../services/api';
import { TrophyIcon, RankBadge, CheckCircleIcon, XCircleIcon, RefreshCwIcon, ChainLinkIcon } from './Icons';
import RegisterAlphaModal from './RegisterAlphaModal';

interface LeaderboardEntry {
  agentId: string;
  reputationScore: number;
  totalPitched: number;
  totalAccepted: number;
  winRate: number;
  avgApy: number;
  totalFeesEarned: number;
}

interface DealRecord {
  id: string;
  protocol: string;
  pool: string;
  apy: number;
  decision?: string;
  txHash?: string;
  alphaFeeTxHash?: string;
  alphaFeeAmount?: number;
  timestamp: string;
  investmentAmount?: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  subscribedIds: string[];
  onSubscriptionChange: (newIds: string[]) => void;
}

function ReputationBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">Elite</span>;
  if (score >= 60) return <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-2 py-0.5 font-bold">Trusted</span>;
  if (score >= 30) return <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 font-bold">Rising</span>;
  return <span className="text-xs bg-gray-700 text-gray-400 rounded-full px-2 py-0.5 font-bold">New</span>;
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://www.oklink.com/xlayer/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1 font-mono text-xs text-green-400 hover:text-green-300 hover:underline"
    >
      <ChainLinkIcon size={10} className="text-green-400" />
      {hash.slice(0, 10)}...{hash.slice(-6)}
    </a>
  );
}

export default function Leaderboard({ entries, subscribedIds, onSubscriptionChange }: LeaderboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, DealRecord[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const toggleExpand = useCallback(async (agentId: string) => {
    if (expandedId === agentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(agentId);
    if (!historyMap[agentId]) {
      setLoadingHistory(agentId);
      try {
        const history = await getDealHistory(agentId);
        setHistoryMap(prev => ({ ...prev, [agentId]: history }));
      } finally {
        setLoadingHistory(null);
      }
    }
  }, [expandedId, historyMap]);

  const toggleSubscription = useCallback(async (agentId: string) => {
    setTogglingId(agentId);
    try {
      const isSubscribed = subscribedIds.includes(agentId);
      const result = isSubscribed
        ? await unsubscribeFromAlpha(agentId)
        : await subscribeToAlpha(agentId);
      onSubscriptionChange(result.subscribedAlphaIds || []);
    } finally {
      setTogglingId(null);
    }
  }, [subscribedIds, onSubscriptionChange]);

  if (entries.length === 0) {
    return (
      <>
        {showRegister && <RegisterAlphaModal onClose={() => setShowRegister(false)} onRegistered={(ids) => { onSubscriptionChange(ids); setShowRegister(false); }} />}
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrophyIcon size={16} className="text-yellow-400" /> Alpha Agent Leaderboard
            </h3>
            <button onClick={() => setShowRegister(true)} className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 rounded-lg px-3 py-1.5 transition-colors">
              + Register Alpha
            </button>
          </div>
          <p className="text-gray-500 text-sm">Run deal rounds to build Alpha agent track records.</p>
        </div>
      </>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrophyIcon size={16} className="text-yellow-400" /> Alpha Agent Leaderboard
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Reputation built from on-chain track record · Subscribe to choose who pitches to your agent</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 text-right">
            <div>{subscribedIds.length} agent{subscribedIds.length !== 1 ? 's' : ''} active</div>
            <div>3% fee on accepted deals</div>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            + Register Alpha
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {entries.map((entry, i) => {
          const isSubscribed = subscribedIds.includes(entry.agentId);
          const isExpanded = expandedId === entry.agentId;
          const history = historyMap[entry.agentId] || [];

          return (
            <div key={entry.agentId} className={`rounded-xl border transition-colors ${isSubscribed ? 'border-purple-500/30 bg-purple-500/5' : 'border-gray-700/50 bg-gray-800/30'}`}>
              {/* Main row */}
              <div className="flex items-center gap-3 p-3">
                {/* Rank */}
                <RankBadge rank={i} />

                {/* Agent name + rep */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{entry.agentId.replace('agent-alpha-', 'Alpha ')}</span>
                    <ReputationBadge score={entry.reputationScore} />
                    {isSubscribed && (
                      <span className="text-xs text-green-400/70">● pitching to you</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        entry.reputationScore >= 70 ? 'bg-green-500' :
                        entry.reputationScore >= 40 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${entry.reputationScore}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 text-center shrink-0">
                  <div>
                    <div className="text-white font-bold text-sm">{entry.reputationScore}</div>
                    <div className="text-gray-500 text-xs">Score</div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{entry.winRate}%</div>
                    <div className="text-gray-500 text-xs">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{entry.avgApy > 0 ? `${entry.avgApy}%` : '—'}</div>
                    <div className="text-gray-500 text-xs">Avg APY</div>
                  </div>
                  <div>
                    <div className="text-yellow-400 font-bold text-sm">{entry.totalFeesEarned > 0 ? entry.totalFeesEarned.toFixed(5) : '—'}</div>
                    <div className="text-gray-500 text-xs">Fees (XETH)</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleExpand(entry.agentId)}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {isExpanded ? '▲ History' : '▼ History'}
                  </button>
                  <button
                    onClick={() => toggleSubscription(entry.agentId)}
                    disabled={togglingId === entry.agentId}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      isSubscribed
                        ? 'bg-purple-500/20 text-purple-300 hover:bg-red-500/20 hover:text-red-400 border border-purple-500/30'
                        : 'bg-gray-700 text-gray-400 hover:bg-purple-500/20 hover:text-purple-300 border border-gray-600'
                    }`}
                  >
                    {togglingId === entry.agentId ? '...' : isSubscribed ? '✓ Subscribed' : '+ Subscribe'}
                  </button>
                </div>
              </div>

              {/* Expandable TX history */}
              {isExpanded && (
                <div className="border-t border-gray-700/50 px-4 pb-3 pt-2">
                  <div className="text-xs text-gray-400 mb-2 font-medium">On-chain Deal History</div>
                  {loadingHistory === entry.agentId ? (
                    <div className="text-xs text-gray-500 py-2">Loading...</div>
                  ) : history.length === 0 ? (
                    <div className="text-xs text-gray-500 py-2">No deals yet. Run a deal round to build track record.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {history.map(deal => (
                        <div key={deal.id} className="flex items-center gap-3 text-xs">
                          <span className="shrink-0">
                            {deal.decision === 'accept'
                              ? <CheckCircleIcon size={12} className="text-green-400" />
                              : deal.decision === 'reject'
                              ? <XCircleIcon size={12} className="text-red-400" />
                              : <RefreshCwIcon size={12} className="text-yellow-400" />}
                          </span>
                          <span className="text-gray-300 font-medium shrink-0">{deal.protocol}</span>
                          <span className="text-gray-500 shrink-0">{deal.pool}</span>
                          <span className="text-blue-400 shrink-0">{deal.apy}% APY</span>
                          {deal.investmentAmount && deal.decision === 'accept' && (
                            <span className="text-green-400 shrink-0">{deal.investmentAmount.toFixed(5)} XETH</span>
                          )}
                          <span className="text-gray-600 shrink-0">{new Date(deal.timestamp).toLocaleDateString()}</span>
                          {deal.txHash && (
                            <span className="ml-auto shrink-0 flex items-center gap-1">
                              <span className="text-gray-600">TX:</span>
                              <TxLink hash={deal.txHash} />
                            </span>
                          )}
                          {deal.alphaFeeTxHash && (
                            <span className="shrink-0 flex items-center gap-1">
                              <span className="text-yellow-600">Fee:</span>
                              <TxLink hash={deal.alphaFeeTxHash} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        Score = win rate (50%) + deal volume (25%) + APY quality (15%) + recent activity (10%) · All deals verifiable on XLayer
      </p>

      {showRegister && (
        <RegisterAlphaModal
          onClose={() => setShowRegister(false)}
          onRegistered={(ids) => { onSubscriptionChange(ids); setShowRegister(false); }}
        />
      )}
    </div>
  );
}
