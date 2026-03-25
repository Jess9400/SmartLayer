import React from 'react';
import {
  NexusIcon, CitadelIcon, QuantIcon, ShieldIcon, ProtocolIcon,
  ChainLinkIcon, ScaleIcon,
} from './Icons';

type ColorScheme = 'orange' | 'blue' | 'cyan' | 'purple';

const COLORS: Record<ColorScheme, {
  border: string; bg: string; iconBg: string; name: string; badge: string;
}> = {
  orange: {
    border: 'border-orange-500/40', bg: 'bg-orange-500/5',
    iconBg: 'bg-orange-500/20 border border-orange-500/30',
    name: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  blue: {
    border: 'border-blue-500/40', bg: 'bg-blue-500/5',
    iconBg: 'bg-blue-500/20 border border-blue-500/30',
    name: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  cyan: {
    border: 'border-cyan-500/40', bg: 'bg-cyan-500/5',
    iconBg: 'bg-cyan-500/20 border border-cyan-500/30',
    name: 'text-cyan-300', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  purple: {
    border: 'border-purple-500/40', bg: 'bg-purple-500/5',
    iconBg: 'bg-purple-500/20 border border-purple-500/30',
    name: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
};

const ICON_COLOR: Record<ColorScheme, string> = {
  orange: 'text-orange-400', blue: 'text-blue-400',
  cyan: 'text-cyan-400', purple: 'text-purple-400',
};

function AlphaIcon({ colorScheme, size = 22 }: { colorScheme: ColorScheme; size?: number }) {
  const cls = ICON_COLOR[colorScheme];
  if (colorScheme === 'orange') return <NexusIcon size={size} className={cls} />;
  if (colorScheme === 'blue')   return <CitadelIcon size={size} className={cls} />;
  if (colorScheme === 'cyan')   return <QuantIcon size={size} className={cls} />;
  return <ProtocolIcon size={size} className={cls} />;
}

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
  colorScheme?: ColorScheme;
  isConnected?: boolean;
}

export default function AgentCard({
  name, role, balance, walletAddress, dealsPitched, dealsAnalyzed,
  acceptRate, successRate, isActive, side, reputationScore, riskProfile,
  tagline, vaultBalance, colorScheme = 'purple', isConnected = true,
}: AgentCardProps) {
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'loading...';

  if (side === 'alpha') {
    const c = COLORS[colorScheme];
    const score = reputationScore ?? 0;
    const barColor = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-gray-500';

    return (
      <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex flex-col gap-3`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
              <AlphaIcon colorScheme={colorScheme} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className={`font-bold text-base ${c.name}`}>{name}</h3>
                <span className={`text-xs border rounded-full px-2 py-0.5 ${c.badge}`}>External</span>
              </div>
              <p className="text-gray-400 text-xs">{role}</p>
              {tagline && <p className={`text-xs italic mt-0.5 ${c.name} opacity-70`}>{tagline}</p>}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
            isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700/60 text-gray-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
            {isActive ? 'Pitching...' : 'Idle'}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Reputation</span>
            <span className={`text-xs font-bold ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {score}/100
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Win Rate</span>
          <span className="font-bold text-white">{dealsPitched ? `${successRate ?? 0}%` : '—'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Wallet</span>
          <a
            href={`https://www.oklink.com/xlayer/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-mono ${c.name} opacity-60 hover:opacity-100 transition-opacity`}
          >
            {shortAddr} ↗
          </a>
        </div>
      </div>
    );
  }

  // Beta
  return (
    <div className="rounded-xl border border-green-500/50 bg-green-500/5 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
        YOUR AGENT
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <ShieldIcon size={26} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-green-400">{name}</h3>
            <p className="text-gray-400 text-xs">{role} · Personal AI</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
            {isActive ? 'Analyzing...' : 'Guarding'}
          </div>
          {riskProfile && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${
              riskProfile === 'aggressive' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
              riskProfile === 'balanced'   ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
              'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {riskProfile === 'aggressive'
                ? <NexusIcon size={11} className="text-red-400" />
                : riskProfile === 'balanced'
                ? <ScaleIcon size={11} />
                : <ShieldIcon size={11} />}
              {riskProfile}
            </div>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
          <span className="text-yellow-400 text-xs font-medium">Connect wallet to view details</span>
        </div>
      )}
      <div className="space-y-2 text-sm">
        {vaultBalance !== undefined && (
          <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <span className="text-green-400 text-xs font-medium flex items-center gap-1.5">
              <ChainLinkIcon size={12} className="text-green-400" /> Vault Balance
            </span>
            <span className="font-mono font-bold text-green-300 text-base">
              {isConnected ? `${parseFloat(vaultBalance || '0').toFixed(5)} XETH` : '•••••'}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Wallet Balance</span>
          <span className="font-mono font-bold text-white">{isConnected ? `${parseFloat(balance || '0').toFixed(4)} XETH` : '•••••'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Wallet</span>
          <span className="font-mono text-xs text-green-400">{isConnected ? shortAddr : '••••••••••••'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Deals Reviewed</span>
          <span className="font-bold text-white">{isConnected ? (dealsAnalyzed ?? 0) : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Acceptance Rate</span>
          <span className="font-bold text-white">{isConnected ? `${acceptRate ?? 0}%` : '—'}</span>
        </div>
      </div>
    </div>
  );
}
