import { useState } from 'react';
import { registerAlpha } from '../services/api';

const PITCH_STYLES = [
  { label: 'Yield Hunter — aggressive, lead with APY upside', value: 'You are an aggressive high-yield hunter. Lead with returns, emphasize upside and APY, be bold and confident. Your edge is finding the best rates before anyone else.' },
  { label: 'Blue-Chip Scout — conservative, lead with security', value: 'You are a conservative blue-chip advocate. Lead with security, audits, and track record. Emphasize capital preservation and protocol credibility over raw yield.' },
  { label: 'Quant Analyst — data-driven, lead with metrics', value: 'You are a data-driven quantitative analyst. Lead with metrics: TVL, risk-adjusted returns, and specific numbers. Be precise and analytical.' },
  { label: 'Custom — write your own pitch style', value: '' },
];

interface Props {
  onClose: () => void;
  onRegistered: (subscribedAlphaIds: string[]) => void;
}

export default function RegisterAlphaModal({ onClose, onRegistered }: Props) {
  const [name, setName] = useState('');
  const [styleIndex, setStyleIndex] = useState(0);
  const [customStyle, setCustomStyle] = useState('');
  const [feeAddress, setFeeAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ alphaId: string; txHash: string | null } | null>(null);
  const [error, setError] = useState('');

  const pitchStyle = styleIndex === 3 ? customStyle : PITCH_STYLES[styleIndex].value;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !pitchStyle.trim() || !feeAddress.trim()) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await registerAlpha(name.trim(), pitchStyle.trim(), feeAddress.trim());
      if (data.error) { setError(data.error); return; }
      setResult({ alphaId: data.alphaId, txHash: data.txHash });
      onRegistered(data.subscribedAlphaIds || []);
    } catch {
      setError('Registration failed. Check the fee address and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">Register Alpha Agent</h2>
            <p className="text-xs text-gray-400 mt-0.5">Deploy your agent to pitch deals to Beta subscribers</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {result ? (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
              <div className="text-green-400 font-bold text-lg mb-1">Agent Registered!</div>
              <p className="text-gray-300 text-sm">Your Alpha agent is live and subscribed to Beta.</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Agent ID</span><span className="text-white font-mono text-xs">{result.alphaId}</span></div>
              {result.txHash && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">On-chain TX</span>
                  <a href={`https://www.oklink.com/xlayer/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline font-mono text-xs">{result.txHash.slice(0, 16)}…</a>
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl py-2.5 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Agent Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alpha Meridian"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pitch Style</label>
              <select
                value={styleIndex}
                onChange={e => setStyleIndex(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {PITCH_STYLES.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
              </select>
              {styleIndex === 3 && (
                <textarea
                  value={customStyle}
                  onChange={e => setCustomStyle(e.target.value)}
                  placeholder="Describe your agent's pitch personality and strategy..."
                  rows={3}
                  className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fee Wallet Address <span className="text-gray-500">(receives 3% on accepted deals)</span></label>
              <input
                value={feeAddress}
                onChange={e => setFeeAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-400 space-y-1">
              <p>• Your agent will compete in every deal round alongside the 3 built-in Alphas</p>
              <p>• Beta subscribes to your agent automatically on registration</p>
              <p>• 3% performance fee goes to your fee wallet on every accepted deal</p>
              <p>• Reputation score builds on-chain from your deal track record</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 transition-colors"
            >
              {loading ? 'Registering on XLayer...' : 'Register Alpha Agent'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
