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

  function getAgentColor(agentName?: string) {
    if (!agentName) return 'text-gray-400';
    if (agentName.includes('Alpha')) return 'text-green-400';
    if (agentName.includes('Beta')) return 'text-blue-400';
    return 'text-gray-400';
  }

  function getAgentBubble(agentName?: string) {
    if (agentName?.includes('Alpha')) return 'bg-green-500/10 border-green-500/30';
    if (agentName?.includes('Beta')) return 'bg-blue-500/10 border-blue-500/30';
    return 'bg-gray-800/50 border-gray-700';
  }

  function getIcon(type: string, agentName?: string) {
    if (type === 'deal_executed') return '⚡';
    if (type === 'learning_update') return '🧠';
    if (type === 'error') return '⚠️';
    if (agentName?.includes('Alpha')) return '🤖';
    if (agentName?.includes('Beta')) return '🔬';
    return '💬';
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 flex flex-col h-[420px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>💬</span> Live Negotiation
        </h3>
        {isRunning && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Running...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-8">
            Click "New Deal Round" to start agent negotiation
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`rounded-lg border p-3 ${getAgentBubble(msg.agentName)}`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{getIcon(msg.type, msg.agentName)}</span>
                <span className={`font-bold text-sm ${getAgentColor(msg.agentName)}`}>
                  {msg.agentName || 'System'}
                </span>
                <span className="text-gray-600 text-xs ml-auto">
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
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
