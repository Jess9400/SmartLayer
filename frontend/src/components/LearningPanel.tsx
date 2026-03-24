import React from 'react';
import { BrainIcon } from './Icons';

interface LearningData {
  successPatterns: string[];
  failurePatterns: string[];
  recommendedThresholds: {
    minApy: number;
    minTvl: number;
    preferredRisk: string;
  };
  pitchingAdvice: string[];
  keyInsight: string;
}

interface LearningPanelProps {
  data: LearningData | null;
  onRunLearning: () => void;
  onResetMemory: () => void;
  isRunning: boolean;
}

export default function LearningPanel({ data, onRunLearning, onResetMemory, isRunning }: LearningPanelProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <BrainIcon size={16} className="text-purple-400" /> Learning Insights
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetMemory}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-colors"
            title="Clear Beta's deal memory and start fresh"
          >
            Reset Memory
          </button>
          <button
            onClick={onRunLearning}
            disabled={isRunning}
            className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {isRunning ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {!data ? (
        <p className="text-gray-500 text-sm">Run a learning cycle after a few deals to see patterns emerge.</p>
      ) : (
        <div className="space-y-4">
          {data.keyInsight && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-1">Key Insight</p>
              <p className="text-white text-sm">{data.keyInsight}</p>
            </div>
          )}

          {data.successPatterns.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Success Patterns</p>
              <ul className="space-y-1">
                {data.successPatterns.map((p, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.failurePatterns.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Failure Patterns</p>
              <ul className="space-y-1">
                {data.failurePatterns.map((p, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-green-400 font-bold">{data.recommendedThresholds.minApy}%</div>
              <div className="text-gray-400 text-xs">Min APY</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-blue-400 font-bold">${(data.recommendedThresholds.minTvl / 1000).toFixed(0)}k</div>
              <div className="text-gray-400 text-xs">Min TVL</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-yellow-400 font-bold capitalize">{data.recommendedThresholds.preferredRisk}</div>
              <div className="text-gray-400 text-xs">Risk</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
