import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function ConnectWallet({ label = 'Connect Wallet' }: { label?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-mono rounded-xl transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-400" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
      >
        {isPending ? 'Connecting...' : label}
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {connectors.map(connector => (
            <button
              key={connector.uid}
              onClick={() => { connect({ connector }); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
