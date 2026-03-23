import React from 'react';

interface AgentCardProps {
  name: string;
  role: string;
  balance: string;
  walletAddress: string;
  dealsPitched?: number;
  dealsAnalyzed?: number;
  acceptRate?: number;
  successRate?: number;
  isActive?: boolean;
  side: 'alpha' | 'beta';
  reputationScore?: number;
  riskProfile?: 'conservative' | 'balanced' | 'aggressive';
  totalFeesEarned?: number;
  tagline?: string;
  vaultBalance?: string;
}

export default function AgentCard({ name, role, balance, walletAddress, dealsPitched, dealsAnalyzed, acceptRate, successRate, isActive, side, reputationScore, riskProfile, totalFeesEarned, tagline, vaultBalance }: AgentCardProps) {
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'loading...';

  if (side === 'alpha') {
    return (
      <div className="rounded-xl border border-purple-500/40 bg-purple-500/5 p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
              🏦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-purple-300">{name}</h3>
                <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">External</span>
              </div>
              <p className="text-gray-400 text-xs">{role} · Protocol Agent</p>
              {tagline && <p className="text-purple-400/60 text-xs italic mt-0.5">{tagline}</p>}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
            {isActive ? 'Pitching...' : 'Idle'}
          </div>
        </div>

        <div className="text-xs text-purple-400/70 bg-purple-500/10 rounded-lg px-3 py-2 mb-3 border border-purple-500/20">
          Pitching deals to your agent
        </div>

        {/* Reputation Score */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Reputation Score</span>
            <span className={`text-xs font-bold ${(reputationScore ?? 0) >= 70 ? 'text-green-400' : (reputationScore ?? 0) >= 40 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {reputationScore ?? 0}/100
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${(reputationScore ?? 0) >= 70 ? 'bg-green-500' : (reputationScore ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-gray-500'}`}
              style={{ width: `${reputationScore ?? 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Balance</span>
            <span className="font-mono font-bold text-white">{parseFloat(balance || '0').toFixed(4)} XETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Wallet</span>
            <span className="font-mono text-xs text-purple-400">{shortAddr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Deals Pitched</span>
            <span className="font-bold text-white">{dealsPitched ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Acceptance Rate</span>
            <span className="font-bold text-white">{successRate ?? 0}%</span>
          </div>
          {(totalFeesEarned ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Fees Earned</span>
              <span className="font-bold text-yellow-400">{(totalFeesEarned ?? 0).toFixed(6)} XETH</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Beta — user's personal agent
  return (
    <div className="rounded-xl border border-green-500/50 bg-green-500/5 p-4 flex-1 relative overflow-hidden">
      {/* "Your Agent" corner badge */}
      <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
        YOUR AGENT
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-lg">
            🛡️
          </div>
          <div>
            <h3 className="font-bold text-lg text-green-400">{name}</h3>
            <p className="text-gray-400 text-xs">{role} · Personal AI</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
          {isActive ? 'Analyzing...' : 'Guarding'}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="text-xs text-green-400/80 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20 flex items-center gap-1.5 flex-1">
          <span>💰</span> Managing your delegated capital
        </div>
        {riskProfile && (
          <div className={`text-xs font-bold px-2 py-1 rounded-lg border shrink-0 ${
            riskProfile === 'aggressive' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
            riskProfile === 'balanced' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
            'bg-blue-500/10 text-blue-400 border-blue-500/30'
          }`}>
            {riskProfile === 'aggressive' ? '🔥' : riskProfile === 'balanced' ? '⚖️' : '🛡️'} {riskProfile}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        {vaultBalance !== undefined && (
          <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <span className="text-green-400 text-xs font-medium flex items-center gap-1">⛓️ Vault Balance</span>
            <span className="font-mono font-bold text-green-300">{parseFloat(vaultBalance || '0').toFixed(5)} XETH</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Wallet Balance</span>
          <span className="font-mono font-bold text-white">{parseFloat(balance || '0').toFixed(4)} XETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Wallet</span>
          <span className="font-mono text-xs text-green-400">{shortAddr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Deals Reviewed</span>
          <span className="font-bold text-white">{dealsAnalyzed ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Acceptance Rate</span>
          <span className="font-bold text-white">{acceptRate ?? 0}%</span>
        </div>
      </div>
    </div>
  );
}
