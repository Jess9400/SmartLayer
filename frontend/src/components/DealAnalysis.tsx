import React from 'react';

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
  };
}

interface DealAnalysisProps {
  deal: Deal | null;
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
  { icon: '🏛️', label: 'Protocol', desc: 'Audits, track record, team credibility' },
  { icon: '📈', label: 'APY',      desc: 'Yield quality vs. market rate' },
  { icon: '💎', label: 'TVL',      desc: 'Liquidity depth, protocol adoption' },
  { icon: '🌍', label: 'Macro',    desc: 'Market conditions, timing risk' },
];

export default function DealAnalysis({ deal }: DealAnalysisProps) {
  if (!deal) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 h-full flex flex-col">
        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
          <span>📊</span> Deal Analysis
        </h3>
        <div className="flex-1 flex flex-col justify-center gap-3">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-1">How Beta scores each pitch</p>
          {RUBRIC.map(r => (
            <div key={r.label} className="flex items-start gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5">
              <span className="text-base shrink-0">{r.icon}</span>
              <div>
                <div className="text-white text-sm font-medium">{r.label}</div>
                <div className="text-gray-500 text-xs">{r.desc}</div>
              </div>
            </div>
          ))}
          <div className="mt-1 text-xs text-gray-600 text-center">
            Overall = 60% analysis score + 40% on-chain reputation
          </div>
        </div>
      </div>
    );
  }

  const decisionColor = deal.decision === 'accept' ? 'text-green-400' : deal.decision === 'reject' ? 'text-red-400' : 'text-yellow-400';
  const decisionBg = deal.decision === 'accept' ? 'bg-green-500/10 border-green-500/30' : deal.decision === 'reject' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30';
  const decisionIcon = deal.decision === 'accept' ? '✅' : deal.decision === 'reject' ? '❌' : '🔄';

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>📊</span> Deal Analysis
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
          deal.status === 'active' ? 'bg-green-500/20 border-green-500/40 text-green-400' :
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
          <ScoreBar label="APY" score={deal.analysisResult.apyScore} />
          <ScoreBar label="Risk" score={deal.analysisResult.tvlScore} />
          <ScoreBar label="Macro" score={deal.analysisResult.macroScore} />
          <div className="border-t border-gray-700 pt-2">
            <ScoreBar label="OVERALL" score={deal.analysisResult.overallScore} />
          </div>
        </div>
      )}

      {deal.decision && (
        <div className={`rounded-lg border p-3 ${decisionBg}`}>
          <div className={`font-bold text-sm ${decisionColor} mb-1`}>
            {decisionIcon} {deal.decision.toUpperCase()}
            {deal.investmentAmount && ` — ${deal.investmentAmount.toFixed(5)} XETH`}
          </div>
          <p className="text-gray-300 text-xs">{deal.decisionReasoning}</p>
          {deal.txHash && (
            <a
              href={`https://www.oklink.com/xlayer/tx/${deal.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 font-mono text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded px-2 py-1 break-all transition-colors"
            >
              <span>⛓️</span>
              <span className="truncate">TX: {deal.txHash.slice(0, 20)}...{deal.txHash.slice(-8)}</span>
              <span className="shrink-0 text-green-500/60">↗</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
