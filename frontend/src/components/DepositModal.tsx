import React, { useState } from 'react';
import { useAccount, useSendTransaction, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';

interface DepositModalProps {
  agentAddress: string;
  agentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DepositModal({ agentAddress, agentName, onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState('0.001');
  const [step, setStep] = useState<'input' | 'pending' | 'success'>('input');
  const [txHash, setTxHash] = useState('');

  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { sendTransaction } = useSendTransaction();

  async function handleDeposit() {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep('pending');
    try {
      sendTransaction(
        {
          to: agentAddress as `0x${string}`,
          value: parseEther(amount),
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            setStep('success');
            setTimeout(onSuccess, 2000);
          },
          onError: () => setStep('input'),
        }
      );
    } catch {
      setStep('input');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Deposit to {agentName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {step === 'input' && (
          <>
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-400 mb-1">Agent Wallet</div>
              <div className="font-mono text-green-400 text-sm break-all">{agentAddress}</div>
            </div>

            {balance && (
              <div className="text-xs text-gray-500 mb-3">
                Your balance: {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Amount (ETH)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  step="0.0001"
                  min="0.0001"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-green-500"
                />
                <div className="flex gap-1">
                  {['0.001', '0.005', '0.01'].map(v => (
                    <button key={v} onClick={() => setAmount(v)} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-xs text-blue-300">
              Your ETH will be delegated to {agentName}, who will autonomously invest it in the best yield opportunities on XLayer.
            </div>

            <button
              onClick={handleDeposit}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
            >
              Delegate Capital to Agent
            </button>
          </>
        )}

        {step === 'pending' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Waiting for confirmation...</p>
            <p className="text-gray-400 text-sm mt-1">Approve in your wallet</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white font-bold text-lg mb-1">Capital Delegated!</p>
            <p className="text-gray-400 text-sm mb-3">{agentName} is now managing your funds</p>
            {txHash && (
              <a
                href={`https://www.oklink.com/xlayer/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-green-400 hover:underline break-all"
              >
                {txHash}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
