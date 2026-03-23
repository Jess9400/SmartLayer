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
}

export default function AgentCard({ name, role, balance, walletAddress, dealsPitched, dealsAnalyzed, acceptRate, successRate, isActive, side }: AgentCardProps) {
  const color = side === 'alpha' ? 'green' : 'blue';
  const borderColor = side === 'alpha' ? 'border-green-500' : 'border-blue-500';
  const textColor = side === 'alpha' ? 'text-green-400' : 'text-blue-400';
  const bgColor = side === 'alpha' ? 'bg-green-500/10' : 'bg-blue-500/10';

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'loading...';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex-1`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{side === 'alpha' ? '🤖' : '🔬'}</span>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{name}</h3>
              <p className="text-gray-400 text-sm">{role}</p>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
          {isActive ? 'Active' : 'Idle'}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Balance</span>
          <span className="font-mono font-bold text-white">{parseFloat(balance || '0').toFixed(4)} XETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Wallet</span>
          <span className={`font-mono text-xs ${textColor}`}>{shortAddr}</span>
        </div>
        {side === 'alpha' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Deals Pitched</span>
              <span className="font-bold text-white">{dealsPitched ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Success Rate</span>
              <span className="font-bold text-white">{successRate ?? 0}%</span>
            </div>
          </>
        )}
        {side === 'beta' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Deals Analyzed</span>
              <span className="font-bold text-white">{dealsAnalyzed ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Accept Rate</span>
              <span className="font-bold text-white">{acceptRate ?? 0}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
