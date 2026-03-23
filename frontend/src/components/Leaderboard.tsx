import React from 'react';

interface LeaderboardEntry {
  agentId: string;
  reputationScore: number;
  totalPitched: number;
  totalAccepted: number;
  winRate: number;
  avgApy: number;
  totalFeesEarned: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

function ReputationBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">Elite</span>;
  if (score >= 60) return <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-2 py-0.5 font-bold">Trusted</span>;
  if (score >= 30) return <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 font-bold">Rising</span>;
  return <span className="text-xs bg-gray-700 text-gray-400 rounded-full px-2 py-0.5 font-bold">New</span>;
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-6">
        <h3 className="font-bold text-white mb-1 flex items-center gap-2">
          <span>🏆</span> Alpha Agent Leaderboard
        </h3>
        <p className="text-gray-500 text-sm">Run deal rounds to build Alpha agent track records.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>🏆</span> Alpha Agent Leaderboard
          <span className="text-xs text-gray-500 font-normal">· Reputation built from on-chain track record</span>
        </h3>
        <span className="text-xs text-gray-500">3% fee on accepted deals</span>
      </div>

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={entry.agentId} className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
            {/* Rank */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
              i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              i === 1 ? 'bg-gray-400/20 text-gray-300' :
              i === 2 ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-700 text-gray-500'
            }`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </div>

            {/* Agent info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm truncate">{entry.agentId}</span>
                <ReputationBadge score={entry.reputationScore} />
              </div>
              {/* Reputation bar */}
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
            <div className="grid grid-cols-4 gap-4 text-center shrink-0">
              <div>
                <div className="text-white font-bold text-sm">{entry.reputationScore}</div>
                <div className="text-gray-500 text-xs">Score</div>
              </div>
              <div>
                <div className="text-white font-bold text-sm">{entry.winRate}%</div>
                <div className="text-gray-500 text-xs">Win Rate</div>
              </div>
              <div>
                <div className="text-white font-bold text-sm">{entry.avgApy}%</div>
                <div className="text-gray-500 text-xs">Avg APY</div>
              </div>
              <div>
                <div className="text-yellow-400 font-bold text-sm">{entry.totalFeesEarned > 0 ? `${entry.totalFeesEarned.toFixed(5)}` : '—'}</div>
                <div className="text-gray-500 text-xs">Fees (XETH)</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        Reputation = win rate (50%) + deal volume (25%) + APY quality (15%) + recent activity (10%) · All verifiable on XLayer
      </p>
    </div>
  );
}
