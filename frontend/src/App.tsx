import React, { useState, useEffect, useCallback } from 'react';
import AgentCard from './components/AgentCard';
import ChatWindow from './components/ChatWindow';
import DealAnalysis from './components/DealAnalysis';
import LearningPanel from './components/LearningPanel';
import { useWebSocket, WSMessage } from './hooks/useWebSocket';
import { getAgents, startDealRound, getAllDeals, runLearning } from './services/api';

interface AgentState {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
  balance: string;
  memory: {
    dealsPitched: unknown[];
    dealsAccepted: unknown[];
    dealsReceived: unknown[];
    dealsRejected: unknown[];
  };
}

export default function App() {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [alpha, setAlpha] = useState<AgentState | null>(null);
  const [beta, setBeta] = useState<AgentState | null>(null);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [activeAlpha, setActiveAlpha] = useState(false);
  const [activeBeta, setActiveBeta] = useState(false);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    setMessages(prev => [...prev, msg]);

    if (msg.agentId === 'agent-alpha') setActiveAlpha(true);
    if (msg.agentId === 'agent-beta') setActiveBeta(true);

    if (msg.type === 'deal_update' || msg.type === 'deal_executed' || msg.type === 'analysis_update') {
      setActiveDeal(msg.deal);
    }
    if (msg.type === 'learning_update' && msg.data) {
      setLearningData(msg.data);
    }
    if (msg.type === 'deal_update' && (msg.deal as any)?.status === 'decided') {
      setActiveAlpha(false);
      setActiveBeta(false);
    }
  }, []);

  const wsConnected = useWebSocket(handleWSMessage);

  async function loadAgents() {
    try {
      const data = await getAgents();
      setAlpha(data.alpha);
      setBeta(data.beta);
    } catch {}
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function handleNewRound() {
    setIsRunning(true);
    setActiveAlpha(true);
    try {
      await startDealRound();
      await loadAgents();
    } finally {
      setIsRunning(false);
      setActiveAlpha(false);
      setActiveBeta(false);
    }
  }

  async function handleRunLearning() {
    setIsLearning(true);
    try {
      const result = await runLearning();
      setLearningData(result);
    } finally {
      setIsLearning(false);
    }
  }

  const alphaAccepts = alpha?.memory?.dealsAccepted?.length ?? 0;
  const alphaPitched = alpha?.memory?.dealsPitched?.length ?? 0;
  const betaReceived = beta?.memory?.dealsReceived?.length ?? 0;
  const betaAccepted = beta?.memory?.dealsAccepted?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-white tracking-tight">
              Smart<span className="text-green-400">Layer</span>
            </div>
            <span className="text-xs text-gray-500 border border-gray-700 rounded-full px-2 py-0.5">AI Agent Deal Network</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-xs ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {wsConnected ? 'Live' : 'Reconnecting...'}
            </div>
            <span className="text-xs text-gray-500 font-mono">XLayer Mainnet</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Agent Cards */}
        <div className="flex gap-4">
          <AgentCard
            name={alpha?.name || 'Agent Alpha'}
            role={alpha?.role || 'Deal Scout'}
            balance={alpha?.balance || '0'}
            walletAddress={alpha?.walletAddress || ''}
            dealsPitched={alphaPitched}
            successRate={alphaPitched > 0 ? Math.round((alphaAccepts / alphaPitched) * 100) : 0}
            isActive={activeAlpha}
            side="alpha"
          />
          <div className="flex items-center justify-center px-4">
            <div className="text-center">
              <div className="text-gray-500 text-2xl">⇄</div>
              <div className="text-gray-600 text-xs mt-1">Negotiating</div>
            </div>
          </div>
          <AgentCard
            name={beta?.name || 'Agent Beta'}
            role={beta?.role || 'Deal Analyst'}
            balance={beta?.balance || '0'}
            walletAddress={beta?.walletAddress || ''}
            dealsAnalyzed={betaReceived}
            acceptRate={betaReceived > 0 ? Math.round((betaAccepted / betaReceived) * 100) : 0}
            isActive={activeBeta}
            side="beta"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewRound}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Deal Round...
              </>
            ) : (
              <> New Deal Round</>
            )}
          </button>
          <span className="text-gray-500 text-sm">
            {messages.length > 0 ? `${messages.length} messages` : 'Ready to start'}
          </span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* Chat — wider */}
          <div className="col-span-3">
            <ChatWindow messages={messages} isRunning={isRunning} />
          </div>

          {/* Deal Analysis */}
          <div className="col-span-2 space-y-4">
            <DealAnalysis deal={activeDeal} />
          </div>
        </div>

        {/* Learning Panel */}
        <LearningPanel
          data={learningData}
          onRunLearning={handleRunLearning}
          isRunning={isLearning}
        />
      </main>
    </div>
  );
}
