import React, { useEffect, useRef } from 'react';
import { WSMessage } from '../hooks/useWebSocket';

interface ChatWindowProps {
  messages: WSMessage[];
  isRunning: boolean;
}

export default function ChatWindow({ messages, isRunning }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function isAlpha(msg: WSMessage) {
    return msg.agentName?.includes('Alpha') || msg.agentId === 'agent-alpha';
  }

  function isBeta(msg: WSMessage) {
    return msg.agentName?.includes('Beta') || msg.agentId === 'agent-beta';
  }

  function getIcon(type: string, msg: WSMessage) {
    if (type === 'deal_executed') return '⚡';
    if (type === 'learning_update') return '🧠';
    if (type === 'error') return '⚠️';
    if (isAlpha(msg)) return '🏦';
    if (isBeta(msg)) return '🛡️';
    return '💬';
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 flex flex-col h-[420px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>💬</span> Live Negotiation
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-purple-400"><span>🏦</span> External Agent</span>
          <span className="flex items-center gap-1 text-green-400"><span>🛡️</span> Your Agent</span>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Running...
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-8">
            Click "New Deal Round" to start agent negotiation
          </div>
        ) : (
          messages.map((msg, i) => {
            const alpha = isAlpha(msg);
            const beta = isBeta(msg);

            return (
              <div
                key={i}
                className={`flex gap-2 ${beta ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                  alpha ? 'bg-purple-500/20 border border-purple-500/30' :
                  beta ? 'bg-green-500/20 border border-green-500/30' :
                  'bg-gray-700'
                }`}>
                  {getIcon(msg.type, msg)}
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] rounded-xl border p-3 ${
                  alpha ? 'bg-purple-500/10 border-purple-500/30 rounded-tl-none' :
                  beta ? 'bg-green-500/10 border-green-500/30 rounded-tr-none' :
                  'bg-gray-800/50 border-gray-700'
                }`}>
                  <div className={`flex items-center gap-2 mb-1 ${beta ? 'flex-row-reverse' : ''}`}>
                    <span className={`font-bold text-xs ${
                      alpha ? 'text-purple-300' :
                      beta ? 'text-green-400' :
                      'text-gray-400'
                    }`}>
                      {msg.agentName || 'System'}
                      {beta && <span className="ml-1 text-green-500/60">(you)</span>}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{msg.message}</p>
                  {msg.type === 'deal_executed' && (msg.deal as any)?.txHash && (
                    <div className="mt-2 font-mono text-xs text-green-400 bg-green-500/10 rounded px-2 py-1">
                      TX: {(msg.deal as any).txHash}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
