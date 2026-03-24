import React from 'react';
import {
  ChartBarIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon,
  ChainLinkIcon, BuildingIcon, QuantIcon, GemIcon, GlobeIcon, BrainIcon,
} from './Icons';

interface Deal {
  id: string;
  protocol: string;
  pool: string;
  apy: number;
  tvl: number;
  riskLevel: string;
  audited: boolean;
  decision?: string;
  decisionReasoning?: string;
  investmentAmount?: number;
  txHash?: string;
  status: string;
  analysisResult?: {
    protocolScore: number;
    apyScore: number;
    tvlScore: number;
    macroScore: number;
    overallScore: number;
    protocolAssessment: string;
    apyAssessment: string;
    riskAssessment: string;
    historyComparison?: string;
  };
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">{score}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

const RUBRIC = [
  { Icon: BuildingIcon, label: 'Protocol', desc: 'Audits, track record, team credibility',  color: 'text-purple-400' },
  { Icon: QuantIcon,    label: 'APY',      desc: 'Yield quality vs. market rate',            color: 'text-green-400'  },
  { Icon: GemIcon,      label: 'TVL',      desc: 'Liquidity depth, protocol adoption',       color: 'text-blue-400'   },
  { Icon: GlobeIcon,    label: 'Macro',    desc: 'Market conditions, timing risk',            color: 'text-cyan-400'   },
];

export default function DealAnalysis({ deal }: { deal: Deal | null }) {
  if (!deal) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 h-full flex flex-col">
        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
          <ChartBarIcon size={16} className="text-gray-400" />
          Deal Analysis
        </h3>
        <div className="flex-1 flex flex-col justify-center gap-3">
          <p className="text-gray-600 text-xs uppercase tracking-wider font-medium mb-1">
            How Beta scores each pitch
          </p>
          {RUBRIC.map(({ Icon, label, desc, color }) => (
            <div key={label} className="flex items-start gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5">
              <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
              <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-gray-500 text-xs">{desc}</div>
              </div>
            </div>
          ))}
          <div className="mt-1 text-xs text-gray-700 text-center">
            Overall = 60% analysis score + 40% on-chain reputation
          </div>
        </div>
      </div>
    );
  }

  const isAccept  = deal.decision === 'accept';
  const isReject  = deal.decision === 'reject';
  const decisionColor = isAccept ? 'text-green-400' : isReject ? 'text-red-400' : 'text-yellow-400';
  const decisionBg    = isAccept ? 'bg-green-500/10 border-green-500/30' : isReject ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30';

  const DecisionIcon = isAccept ? CheckCircleIcon : isReject ? XCircleIcon : RefreshCwIcon;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <ChartBarIcon size={16} className="text-gray-400" />
          Deal Analysis
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
          deal.status === 'active'    ? 'bg-green-500/20 border-green-500/40 text-green-400' :
          deal.status === 'executing' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
          'bg-gray-700 border-gray-600 text-gray-400'
        }`}>{deal.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Protocol</div>
          <div className="font-bold text-white">{deal.protocol}</div>
          <div className="text-gray-400 text-xs">{deal.pool}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">APY</div>
          <div className="font-bold text-green-400 text-xl">{deal.apy}%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">TVL</div>
          <div className="font-bold text-white">${(deal.tvl / 1000000).toFixed(2)}M</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Risk</div>
          <div className={`font-bold ${deal.riskLevel === 'low' ? 'text-green-400' : deal.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
            {deal.riskLevel} {deal.audited ? '✓ audited' : ''}
          </div>
        </div>
      </div>

      {deal.analysisResult && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Scores</p>
          <ScoreBar label="Protocol" score={deal.analysisResult.protocolScore} />
          <ScoreBar label="APY"      score={deal.analysisResult.apyScore} />
          <ScoreBar label="Risk"     score={deal.analysisResult.tvlScore} />
          <ScoreBar label="Macro"    score={deal.analysisResult.macroScore} />
          <div className="border-t border-gray-700 pt-2">
            <ScoreBar label="OVERALL" score={deal.analysisResult.overallScore} />
          </div>
        </div>
      )}

      {deal.analysisResult?.historyComparison && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 flex items-start gap-2">
          <BrainIcon size={13} className="text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-0.5">Memory</p>
            <p className="text-gray-300 text-xs leading-relaxed">{deal.analysisResult.historyComparison}</p>
          </div>
        </div>
      )}

      {deal.decision && (
        <div className={`rounded-lg border p-3 ${decisionBg}`}>
          <div className={`font-bold text-sm ${decisionColor} mb-1 flex items-center gap-1.5`}>
            <DecisionIcon size={14} className={decisionColor} />
            {deal.decision.toUpperCase()}
            {deal.investmentAmount && ` — ${deal.investmentAmount.toFixed(5)} XETH`}
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">{deal.decisionReasoning}</p>
          {deal.txHash && (
            <a
              href={`https://www.oklink.com/xlayer/tx/${deal.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 font-mono text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded px-2 py-1 transition-colors"
            >
              <ChainLinkIcon size={12} className="text-green-400" />
              <span className="truncate">TX: {deal.txHash.slice(0, 20)}...{deal.txHash.slice(-8)}</span>
              <span className="shrink-0 text-green-500/60">↗</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
