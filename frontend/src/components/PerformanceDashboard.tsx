import React from 'react';
import { ChainLinkIcon, TrophyIcon, QuantIcon, CoinsIcon } from './Icons';

interface DealRecord {
  id: string;
  protocol: string;
  pool: string;
  apy: number;
  investmentAmount?: number;
  txHash?: string;
  timestamp: string;
  pitcherId?: string;
}

interface PerformanceDashboardProps {
  acceptedDeals: DealRecord[];
  totalDealsReceived: number;
  vaultBalance?: string;
}

const ALPHA_SHORT: Record<string, string> = {
  'agent-alpha-nexus': 'Nexus',
  'agent-alpha-citadel': 'Citadel',
  'agent-alpha-quant': 'Quant',
};

const ALPHA_COLOR: Record<string, string> = {
  'agent-alpha-nexus': 'text-orange-400',
  'agent-alpha-citadel': 'text-blue-400',
  'agent-alpha-quant': 'text-cyan-400',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PerformanceDashboard({ acceptedDeals, totalDealsReceived, vaultBalance }: PerformanceDashboardProps) {
  const totalInvested = acceptedDeals.reduce((s, d) => s + (d.investmentAmount ?? 0), 0);
  const avgApy = acceptedDeals.length > 0
    ? acceptedDeals.reduce((s, d) => s + d.apy, 0) / acceptedDeals.length
    : 0;
  const projectedAnnual = totalInvested * avgApy / 100;
  const winRate = totalDealsReceived > 0
    ? Math.round((acceptedDeals.length / totalDealsReceived) * 100)
    : 0;
  const recent = [...acceptedDeals]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  const hasData = acceptedDeals.length > 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <TrophyIcon size={16} className="text-yellow-400" />
          Portfolio Performance
        </h3>
        {hasData && (
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
            Live · XLayer Mainnet
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          {
            icon: <CoinsIcon size={14} className="text-green-400" />,
            value: hasData ? `${totalInvested.toFixed(5)}` : '—',
            unit: 'XETH',
            label: 'Capital Deployed',
            color: hasData ? 'text-green-400' : 'text-gray-600',
          },
          {
            icon: <QuantIcon size={14} className="text-blue-400" />,
            value: hasData ? `${avgApy.toFixed(1)}%` : '—',
            unit: 'avg',
            label: 'APY Secured',
            color: hasData ? 'text-blue-400' : 'text-gray-600',
          },
          {
            icon: <ChainLinkIcon size={14} className="text-purple-400" />,
            value: hasData ? `${projectedAnnual.toFixed(5)}` : '—',
            unit: 'XETH/yr',
            label: 'Projected Return',
            color: hasData ? 'text-purple-400' : 'text-gray-600',
          },
          {
            icon: <TrophyIcon size={14} className="text-yellow-400" />,
            value: hasData ? `${winRate}%` : '—',
            unit: `${acceptedDeals.length}/${totalDealsReceived}`,
            label: 'Deal Win Rate',
            color: hasData ? 'text-yellow-400' : 'text-gray-600',
          },
        ].map(s => (
          <div key={s.label} className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-lg font-black font-mono ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs">{s.unit}</div>
            <div className="text-gray-600 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {recent.length > 0 ? (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Recent Investments</p>
          <div className="space-y-1.5">
            {recent.map(deal => (
              <div key={deal.id} className="flex items-center gap-3 bg-gray-800/40 rounded-lg px-3 py-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-white font-medium shrink-0">{deal.protocol}</span>
                <span className="text-gray-500 shrink-0">{deal.pool}</span>
                <span className="text-green-400 font-bold shrink-0">{deal.apy}% APY</span>
                {deal.investmentAmount && (
                  <span className="text-gray-300 font-mono shrink-0">{deal.investmentAmount.toFixed(5)} XETH</span>
                )}
                {deal.pitcherId && (
                  <span className={`shrink-0 font-medium ${ALPHA_COLOR[deal.pitcherId] || 'text-gray-400'}`}>
                    via {ALPHA_SHORT[deal.pitcherId] || deal.pitcherId}
                  </span>
                )}
                <span className="text-gray-600 ml-auto shrink-0">{timeAgo(deal.timestamp)}</span>
                {deal.txHash && (
                  <a
                    href={`https://www.oklink.com/xlayer/tx/${deal.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-green-400 hover:text-green-300"
                  >
                    <ChainLinkIcon size={10} className="text-green-400" />
                    TX ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm text-center py-2">Run a deal round to see investments appear here.</p>
      )}
    </div>
  );
}
