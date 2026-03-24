import React, { useState } from 'react';
import { UserGoal } from '../services/api';

interface Props {
  currentGoal: UserGoal | null;
  currentDepositXETH: number;
  onSave: (goal: UserGoal) => void;
  onClose: () => void;
}

const RISK_OPTIONS: { value: UserGoal['riskTolerance']; label: string; desc: string; color: string }[] = [
  { value: 'conservative', label: 'Conservative', desc: 'Safety first, proven protocols', color: 'border-blue-500 bg-blue-500/10 text-blue-300' },
  { value: 'moderate',     label: 'Moderate',     desc: 'Balanced yield and safety',     color: 'border-green-500 bg-green-500/10 text-green-300' },
  { value: 'aggressive',   label: 'Aggressive',   desc: 'Max yield, higher risk',         color: 'border-orange-500 bg-orange-500/10 text-orange-300' },
];

export default function GoalModal({ currentGoal, currentDepositXETH, onSave, onClose }: Props) {
  const [target, setTarget] = useState(currentGoal?.targetAmountXETH?.toString() ?? '');
  const [months, setMonths] = useState(currentGoal?.timelineMonths?.toString() ?? '12');
  const [risk, setRisk] = useState<UserGoal['riskTolerance']>(currentGoal?.riskTolerance ?? 'moderate');

  const targetNum = parseFloat(target) || 0;
  const monthsNum = parseInt(months) || 12;

  // Compute required APY
  let requiredApy: number | null = null;
  if (currentDepositXETH > 0 && targetNum > currentDepositXETH && monthsNum > 0) {
    requiredApy = (Math.pow(targetNum / currentDepositXETH, 12 / monthsNum) - 1) * 100;
  }

  const apyFeasibility = requiredApy === null ? null
    : requiredApy < 20  ? { label: 'Achievable', color: 'text-green-400' }
    : requiredApy < 100 ? { label: 'Ambitious', color: 'text-yellow-400' }
    : { label: 'Unrealistic', color: 'text-red-400' };

  function handleSave() {
    if (!targetNum || !monthsNum) return;
    onSave({ targetAmountXETH: targetNum, timelineMonths: monthsNum, riskTolerance: risk });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Set Your Investment Goal</h2>
            <p className="text-gray-400 text-xs mt-0.5">Beta will calibrate deal selection to match your target</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl transition-colors">×</button>
        </div>

        <div className="space-y-5">
          {/* Target amount */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Target Amount (XETH)</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="e.g. 0.1"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
            {currentDepositXETH > 0 && (
              <p className="text-xs text-gray-500 mt-1">Current deposit: {currentDepositXETH.toFixed(5)} XETH</p>
            )}
          </div>

          {/* Timeline */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Timeline</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 6, 12, 24].map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(String(m))}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${months === String(m) ? 'border-green-500 bg-green-500/10 text-green-300' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>

          {/* Risk tolerance */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Risk Tolerance</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRisk(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-left ${risk === opt.value ? opt.color : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Required APY preview */}
          {targetNum > 0 && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Required APY to reach goal</div>
              {currentDepositXETH === 0 ? (
                <div className="text-yellow-400 text-sm font-medium">Deposit first to compute required APY</div>
              ) : targetNum <= currentDepositXETH ? (
                <div className="text-green-400 text-sm font-medium">Already reached — goal is below your deposit</div>
              ) : requiredApy !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-bold text-xl">{requiredApy.toFixed(1)}% APY</span>
                  {apyFeasibility && (
                    <span className={`text-xs font-medium ${apyFeasibility.color}`}>{apyFeasibility.label}</span>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!targetNum || !monthsNum}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            Set Goal
          </button>
        </div>
      </div>
    </div>
  );
}
