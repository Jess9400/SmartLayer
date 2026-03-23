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
import { getAgents, startDealRound, runLearning, getLeaderboard, getSubscriptions, getVaultBalance } from './services/api';

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

interface RoundResult {
  alphaName: string;
  alphaId: string;
  protocol: string;
  apy: number;
  investmentAmount?: number;
  txHash?: string;
}

const ALPHA_TAGLINES: Record<string, string> = {
  'agent-alpha-nexus':   'Aggressive · leads with yield upside',
  'agent-alpha-citadel': 'Conservative · audits and capital safety first',
  'agent-alpha-quant':   'Data-driven · risk-adjusted metrics only',
};

const ALPHA_ICONS: Record<string, string> = {
  'agent-alpha-nexus': '🔥',
  'agent-alpha-citadel': '🏛️',
  'agent-alpha-quant': '📈',
};

const ALPHA_COLORS: Record<string, 'orange' | 'blue' | 'cyan'> = {
  'agent-alpha-nexus':   'orange',
  'agent-alpha-citadel': 'blue',
  'agent-alpha-quant':   'cyan',
};

export default function App() {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [alphas, setAlphas] = useState<AgentState[]>([]);
  const [beta, setBeta] = useState<AgentState | null>(null);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [activeAlphaIds, setActiveAlphaIds] = useState<Set<string>>(new Set());
  const [activeBeta, setActiveBeta] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [vaultBalance, setVaultBalance] = useState<string | undefined>(undefined);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { isConnected } = useAccount();

  const handleWSMessage = useCallback((msg: WSMessage) => {
    setMessages(prev => [...prev, msg]);
    if (msg.agentId?.includes('alpha')) {
      setActiveAlphaIds(prev => new Set([...prev, msg.agentId!]));
    }
    if (msg.agentId === 'agent-beta') setActiveBeta(true);
    if (msg.type === 'deal_update' || msg.type === 'deal_executed' || msg.type === 'analysis_update') {
      setActiveDeal(msg.deal);
    }
    if (msg.type === 'deal_executed') {
      const deal = msg.deal as any;
      setTxCount(prev => prev + 1);
      setRoundResult({
        alphaName: msg.agentName || deal?.alphaId || 'Alpha',
        alphaId: msg.agentId || '',
        protocol: deal?.protocol || '',
        apy: deal?.apy || 0,
        investmentAmount: deal?.investmentAmount,
        txHash: deal?.txHash,
      });
    }
    if (msg.type === 'learning_update' && msg.data) {
      setLearningData(msg.data);
    }
    if (msg.type === 'deal_update' && (msg.deal as any)?.status === 'decided') {
      setActiveAlphaIds(new Set());
      setActiveBeta(false);
    }
  }, []);

  const wsConnected = useWebSocket(handleWSMessage);

  async function loadAgents() {
    try {
      const data = await getAgents();
      setAlphas(data.alphas || []);
      setBeta(data.beta);
    } catch {}
  }

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch {}
  }

  async function loadSubscriptions() {
    try {
      const data = await getSubscriptions();
      setSubscribedIds(data.subscribedAlphaIds || []);
    } catch {}
  }

  async function loadVaultBalance() {
    try {
      const data = await getVaultBalance();
      setVaultBalance(data.vaultBalance || '0');
    } catch {}
  }

  useEffect(() => {
    loadAgents();
    loadLeaderboard();
    loadSubscriptions();
    loadVaultBalance();
    const interval = setInterval(() => {
      loadAgents();
      loadLeaderboard();
      loadVaultBalance();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleNewRound() {
    setIsRunning(true);
    setRoundResult(null);
    setActiveAlphaIds(new Set(alphas.map(a => a.id)));
    setRoundCount(prev => prev + 1);
    try {
      await startDealRound();
      await Promise.all([loadAgents(), loadLeaderboard(), loadVaultBalance()]);
    } finally {
      setIsRunning(false);
      setActiveAlphaIds(new Set());
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

  const betaReceived = beta?.memory?.dealsReceived?.length ?? 0;
  const betaAccepted = beta?.memory?.dealsAccepted?.length ?? 0;
  const totalFeesCollected = leaderboard.reduce((sum, e) => sum + (e.totalFeesEarned ?? 0), 0);

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

      {/* Round Result Banner */}
      {roundResult && (
        <div className="sticky top-[57px] z-10 bg-green-950/95 border-b border-green-500/30 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3">
            <span className="text-green-400 text-lg shrink-0">✅</span>
            <div className="flex items-center gap-2 flex-wrap flex-1 text-sm">
              <span className="font-bold text-green-300">
                {ALPHA_ICONS[roundResult.alphaId] || '🏦'} {roundResult.alphaName} won this round
              </span>
              {roundResult.protocol && (
                <><span className="text-green-700">·</span><span className="text-green-400/80">{roundResult.protocol}</span></>
              )}
              {roundResult.apy > 0 && (
                <><span className="text-green-700">·</span><span className="text-green-300 font-bold">{roundResult.apy}% APY</span></>
              )}
              {roundResult.investmentAmount && (
                <><span className="text-green-700">·</span><span className="text-green-400/80">{roundResult.investmentAmount.toFixed(5)} XETH invested</span></>
              )}
              {roundResult.txHash && (
                <><span className="text-green-700">·</span>
                <a
                  href={`https://www.oklink.com/xlayer/tx/${roundResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-green-400 hover:text-green-300 underline text-xs"
                >
                  TX: {roundResult.txHash.slice(0, 14)}...{roundResult.txHash.slice(-6)} ↗
                </a></>
              )}
            </div>
            <button onClick={() => setRoundResult(null)} className="text-green-700 hover:text-green-400 text-xl shrink-0 transition-colors">×</button>
          </div>
        </div>
      )}

      {/* Compressed Hero */}
      <div className="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-8 flex-wrap">

            {/* Left: headline + CTA */}
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-3 py-1">
                  XLayer OnchainOS AI Hackathon
                </span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">
                Delegate Your Capital.<br />
                <span className="text-green-400">Your Agent Invests For You.</span>
              </h1>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed max-w-lg">
                3 competing Alpha agents pitch yield deals. Your personal Beta agent — powered by Claude AI — scores every deal and executes the best ones on XLayer. <strong className="text-gray-200">You stay in control without doing the work.</strong>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {isConnected ? (
                  <button
                    onClick={() => setShowDeposit(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    💰 Delegate Capital
                  </button>
                ) : (
                  <ConnectButton label="Connect Wallet to Get Started" />
                )}
                <button
                  onClick={() => setShowHowItWorks(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <span>{showHowItWorks ? '▲' : '▼'}</span>
                  How it works
                </button>
              </div>
            </div>

            {/* Right: live stats */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { label: 'Deal Rounds', value: roundCount || '—', color: roundCount > 0 ? 'text-white' : 'text-gray-600' },
                { label: 'On-Chain TXs', value: txCount || '—', color: txCount > 0 ? 'text-green-400' : 'text-gray-600' },
                { label: 'Deals Evaluated', value: betaReceived || '—', color: betaReceived > 0 ? 'text-purple-400' : 'text-gray-600' },
                { label: 'XETH Fees Paid', value: totalFeesCollected > 0 ? totalFeesCollected.toFixed(5) : '—', color: totalFeesCollected > 0 ? 'text-yellow-400' : 'text-gray-600' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-3 text-center min-w-[110px]">
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works — collapsible */}
          {showHowItWorks && (
            <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[
                { n: '1', text: 'Connect your wallet and delegate capital to your Beta agent' },
                { n: '2', text: '3 Alpha agents compete — each pitching a different yield opportunity' },
                { n: '3', text: 'Beta scores every pitch: protocol credibility, APY, TVL, macro risk' },
                { n: '4', text: 'Best deals execute on XLayer — real TX, 97% invested, 3% fee to Alpha' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{s.n}</span>
                  <span>{s.text}</span>
                </div>
              ))}
              <div className="col-span-2 lg:col-span-4 flex items-center gap-3 flex-wrap pt-2">
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs">
                  <span>🏦</span>
                  <span className="text-purple-300 font-semibold">3 Alpha Agents</span>
                  <span className="text-purple-400/60">competing for capital</span>
                </div>
                <span className="text-gray-600 text-xs">→ pitch deals →</span>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5 text-xs">
                  <span>🛡️</span>
                  <span className="text-green-300 font-semibold">Beta Agent</span>
                  <span className="text-green-400/60">your personal AI</span>
                </div>
                <span className="text-gray-600 text-xs">→ executes →</span>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-1.5 text-xs">
                  <span>⛓️</span>
                  <span className="text-blue-300 font-semibold">XLayer</span>
                  <span className="text-blue-400/60">real TX on-chain</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* PRIMARY: Action + Live Activity */}
        <div className="space-y-4">
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
            {messages.length > 0 && (
              <span className="text-gray-600 text-xs">{messages.length} messages</span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <ChatWindow messages={messages} isRunning={isRunning} onStartRound={handleNewRound} />
            </div>
            <div className="col-span-2">
              <DealAnalysis deal={activeDeal} />
            </div>
          </div>
        </div>

        {/* SECONDARY: 3 Alpha Agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Competing Alpha Agents</span>
            <span className="text-xs text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">3 agents · best pitch wins</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {alphas.length > 0 ? alphas.map((a, i) => {
              const lb = leaderboard.find(e => e.id === a.id) || leaderboard[i] || {};
              const pitched = a.memory?.dealsPitched?.length ?? 0;
              const accepted = a.memory?.dealsAccepted?.length ?? 0;
              return (
                <AgentCard
                  key={a.id}
                  name={a.name}
                  role={a.role}
                  balance={a.balance || '0'}
                  walletAddress={a.walletAddress || ''}
                  dealsPitched={pitched}
                  successRate={pitched > 0 ? Math.round((accepted / pitched) * 100) : 0}
                  isActive={activeAlphaIds.has(a.id)}
                  side="alpha"
                  reputationScore={lb.reputationScore}
                  tagline={ALPHA_TAGLINES[a.id]}
                  colorScheme={ALPHA_COLORS[a.id] || 'purple'}
                />
              );
            }) : ['Alpha Nexus', 'Alpha Citadel', 'Alpha Quant'].map((name, i) => (
              <AgentCard
                key={name}
                name={name}
                role="Loading..."
                balance="0"
                walletAddress=""
                isActive={false}
                side="alpha"
                colorScheme={(['orange', 'blue', 'cyan'] as const)[i]}
              />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-800" />
          <span className="text-gray-700 text-xs">60% AI score + 40% on-chain reputation → best pitch wins allocation</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Beta Agent + Learning Panel side by side */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Your Personal Agent</div>
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
              vaultBalance={vaultBalance}
            />
          </div>
          <div className="col-span-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Beta Learning</div>
            <LearningPanel
              data={learningData}
              onRunLearning={handleRunLearning}
              isRunning={isLearning}
            />
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard
          entries={leaderboard}
          subscribedIds={subscribedIds}
          onSubscriptionChange={setSubscribedIds}
        />
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-gray-600 text-xs">
        SmartLayer — XLayer OnchainOS AI Hackathon 2026 · Powered by Claude AI + OKX OnchainOS
      </footer>

      {showDeposit && beta?.walletAddress && (
        <DepositModal
          agentAddress={beta.walletAddress}
          agentName="Agent Beta"
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { setShowDeposit(false); loadAgents(); loadVaultBalance(); }}
        />
      )}
    </div>
  );
}
