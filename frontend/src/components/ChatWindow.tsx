import React, { useEffect, useRef } from 'react';
import { WSMessage } from '../hooks/useWebSocket';

interface ChatWindowProps {
  messages: WSMessage[];
  isRunning: boolean;
  onStartRound: () => void;
}

const AGENT_STYLES: Record<string, { bubble: string; avatar: string; name: string; icon: string }> = {
  'agent-alpha-nexus':   { bubble: 'bg-orange-500/10 border-orange-500/30 rounded-tl-none', avatar: 'bg-orange-500/20 border border-orange-500/30', name: 'text-orange-300', icon: '🔥' },
  'agent-alpha-citadel': { bubble: 'bg-blue-500/10 border-blue-500/30 rounded-tl-none',     avatar: 'bg-blue-500/20 border border-blue-500/30',   name: 'text-blue-300',   icon: '🏛️' },
  'agent-alpha-quant':   { bubble: 'bg-cyan-500/10 border-cyan-500/30 rounded-tl-none',     avatar: 'bg-cyan-500/20 border border-cyan-500/30',   name: 'text-cyan-300',   icon: '📈' },
  'agent-beta':          { bubble: 'bg-green-500/10 border-green-500/30 rounded-tr-none',   avatar: 'bg-green-500/20 border border-green-500/30', name: 'text-green-400',  icon: '🛡️' },
};

const DEFAULT_ALPHA = { bubble: 'bg-purple-500/10 border-purple-500/30 rounded-tl-none', avatar: 'bg-purple-500/20 border border-purple-500/30', name: 'text-purple-300', icon: '🏦' };
const SYSTEM_STYLE  = { bubble: 'bg-gray-800/50 border-gray-700', avatar: 'bg-gray-700 border border-gray-600', name: 'text-gray-400', icon: '💬' };

function getStyle(msg: WSMessage) {
  if (msg.agentId && AGENT_STYLES[msg.agentId]) return AGENT_STYLES[msg.agentId];
  if (msg.agentId?.includes('alpha')) return DEFAULT_ALPHA;
  if (msg.type === 'deal_executed') return { ...SYSTEM_STYLE, icon: '⚡' };
  if (msg.type === 'learning_update') return { ...SYSTEM_STYLE, icon: '🧠' };
  if (msg.type === 'error') return { ...SYSTEM_STYLE, icon: '⚠️' };
  return SYSTEM_STYLE;
}

export default function ChatWindow({ messages, isRunning, onStartRound }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isBeta = (msg: WSMessage) => msg.agentId === 'agent-beta' || msg.agentName?.includes('Beta');

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 flex flex-col h-[460px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>💬</span> Live Negotiation
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-orange-300">🔥 Nexus</span>
          <span className="flex items-center gap-1 text-blue-300">🏛️ Citadel</span>
          <span className="flex items-center gap-1 text-cyan-300">📈 Quant</span>
          <span className="flex items-center gap-1 text-green-400">🛡️ Beta</span>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Live
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="text-5xl">⚡</div>
            <div>
              <p className="text-white text-base font-bold mb-1">Ready to negotiate</p>
              <p className="text-gray-500 text-sm">3 Alpha agents will compete for your capital using live DeFi data</p>
            </div>
            <button
              onClick={onStartRound}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : '⚡ Start First Deal Round'}
            </button>
          </div>
        ) : (
          messages.map((msg, i) => {
            const beta = isBeta(msg);
            const style = getStyle(msg);
            const txHash = (msg.deal as any)?.txHash;

            return (
              <div key={i} className={`flex gap-2 ${beta ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 ${style.avatar}`}>
                  {style.icon}
                </div>
                <div className={`max-w-[80%] rounded-xl border p-3 ${style.bubble}`}>
                  <div className={`flex items-center gap-2 mb-1 ${beta ? 'flex-row-reverse' : ''}`}>
                    <span className={`font-bold text-xs ${style.name}`}>
                      {msg.agentName || 'System'}
                      {beta && <span className="ml-1 text-green-500/50">(you)</span>}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">{msg.message}</p>
                  {msg.type === 'deal_executed' && txHash && (
                    <a
                      href={`https://www.oklink.com/xlayer/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 font-mono text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded px-2 py-1 transition-colors"
                    >
                      <span>⛓️</span>
                      <span>TX: {txHash.slice(0, 18)}...{txHash.slice(-6)}</span>
                      <span className="text-green-500/50 ml-auto">↗</span>
                    </a>
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
