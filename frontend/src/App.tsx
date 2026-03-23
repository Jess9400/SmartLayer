import React, { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AgentCard from './components/AgentCard';
import ChatWindow from './components/ChatWindow';
import DealAnalysis from './components/DealAnalysis';
import LearningPanel from './components/LearningPanel';
import DepositModal from './components/DepositModal';
import Leaderboard from './components/Leaderboard';
import { useWebSocket, WSMessage } from './hooks/useWebSocket';
import { getAgents, startDealRound, runLearning, getLeaderboard } from './services/api';

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
    riskProfile?: 'conservative' | 'balanced' | 'aggressive';
    reputationScore?: number;
    totalFeesEarned?: number;
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
  const [showDeposit, setShowDeposit] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const { isConnected } = useAccount();

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

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch {}
  }

  useEffect(() => {
    loadAgents();
    loadLeaderboard();
    const interval = setInterval(() => { loadAgents(); loadLeaderboard(); }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleNewRound() {
    setIsRunning(true);
    setActiveAlpha(true);
    try {
      await startDealRound();
      await Promise.all([loadAgents(), loadLeaderboard()]);
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
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/SmartLayer/logo.png"
              alt="SmartLayer"
              className="h-8 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="text-2xl font-black text-white tracking-tight">
              Smart<span className="text-green-400">Layer</span>
            </div>
            <span className="text-xs text-gray-500 border border-gray-700 rounded-full px-2 py-0.5 hidden sm:inline">AI Agent Deal Network</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-xs ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {wsConnected ? 'Live' : 'Reconnecting...'}
            </div>
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">XLayer Mainnet</span>
            <ConnectButton chainStatus="none" showBalance={false} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-3 py-1">
                XLayer OnchainOS AI Hackathon
              </span>
            </div>
            <h1 className="text-4xl font-black text-white mb-4 leading-tight">
              Delegate Your Capital.<br />
              <span className="text-green-400">Your Agent Invests For You.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-3 leading-relaxed">
              Fund managers and protocols deploy <strong className="text-gray-200">Alpha agents</strong> to pitch investment opportunities. You delegate capital to your own <strong className="text-gray-200">Beta agent</strong> — a personal AI gatekeeper that evaluates every deal, learns your risk profile, and executes on-chain investments autonomously.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You don't evaluate deals anymore. <strong className="text-green-400">Your agent does.</strong>
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm max-w-xl mb-6">
              <div className="flex items-start gap-2 text-gray-400">
                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>Connect your wallet and delegate capital to your Beta agent</span>
              </div>
              <div className="flex items-start gap-2 text-gray-400">
                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Protocols pitch deals via Alpha agents</span>
              </div>
              <div className="flex items-start gap-2 text-gray-400">
                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>Beta scores every deal with Claude AI analysis</span>
              </div>
              <div className="flex items-start gap-2 text-gray-400">
                <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                <span>Accepted deals execute on XLayer — real TX, real funds</span>
              </div>
            </div>

            {/* Flow diagram */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-2 text-sm">
                <span>🏦</span>
                <div>
                  <div className="text-purple-300 font-semibold text-xs">Protocol / Fund</div>
                  <div className="text-purple-400/70 text-xs">Alpha Agent</div>
                </div>
              </div>
              <div className="text-gray-500 text-xs text-center">
                <div>→ pitches deals →</div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2 text-sm">
                <span>🛡️</span>
                <div>
                  <div className="text-green-300 font-semibold text-xs">Your Agent</div>
                  <div className="text-green-400/70 text-xs">Beta Agent</div>
                </div>
              </div>
              <div className="text-gray-500 text-xs text-center">
                <div>→ executes on-chain →</div>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2 text-sm">
                <span>⛓️</span>
                <div>
                  <div className="text-blue-300 font-semibold text-xs">XLayer</div>
                  <div className="text-blue-400/70 text-xs">Real TX on-chain</div>
                </div>
              </div>
            </div>

            {/* Delegate CTA */}
            {isConnected ? (
              <button
                onClick={() => setShowDeposit(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors text-sm"
              >
                💰 Delegate Capital to Your Agent
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <ConnectButton label="Connect Wallet to Get Started" />
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Agent Cards */}
        <div className="flex gap-4 items-stretch">
          <AgentCard
            name={alpha?.name || 'Agent Alpha'}
            role={alpha?.role || 'Deal Scout'}
            balance={alpha?.balance || '0'}
            walletAddress={alpha?.walletAddress || ''}
            dealsPitched={alphaPitched}
            successRate={alphaPitched > 0 ? Math.round((alphaAccepts / alphaPitched) * 100) : 0}
            isActive={activeAlpha}
            side="alpha"
            reputationScore={leaderboard[0]?.reputationScore}
            totalFeesEarned={leaderboard[0]?.totalFeesEarned}
          />
          <div className="flex flex-col items-center justify-center px-2 gap-2">
            <div className="text-purple-400 text-xs font-medium text-center">Pitches deal</div>
            <div className="text-gray-500 text-xl">→</div>
            <div className="text-gray-600 text-xs">evaluates</div>
            <div className="text-gray-500 text-xl">←</div>
            <div className="text-green-400 text-xs font-medium text-center">Accept / Reject</div>
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
            riskProfile={beta?.memory?.riskProfile}
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 flex-wrap">
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
            ) : '⚡ New Deal Round'}
          </button>
          {isConnected && beta?.walletAddress && (
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-colors border border-gray-700"
            >
              💰 Deposit to Agent
            </button>
          )}
          <span className="text-gray-500 text-sm">
            {messages.length > 0 ? `${messages.length} messages` : 'Click to start agent negotiation'}
          </span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
            <ChatWindow messages={messages} isRunning={isRunning} />
          </div>
          <div className="col-span-2">
            <DealAnalysis deal={activeDeal} />
          </div>
        </div>

        {/* Learning Panel */}
        <LearningPanel
          data={learningData}
          onRunLearning={handleRunLearning}
          isRunning={isLearning}
        />

        {/* Alpha Leaderboard */}
        <Leaderboard entries={leaderboard} />
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-gray-600 text-xs">
        SmartLayer — XLayer OnchainOS AI Hackathon 2026 · Powered by Claude AI + OKX OnchainOS
      </footer>

      {/* Deposit Modal */}
      {showDeposit && beta?.walletAddress && (
        <DepositModal
          agentAddress={beta.walletAddress}
          agentName="Agent Beta"
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { setShowDeposit(false); loadAgents(); }}
        />
      )}
    </div>
  );
}
