import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import ConnectWallet from './components/ConnectWallet';
import AgentCard from './components/AgentCard';
import ChatWindow from './components/ChatWindow';
import DealAnalysis from './components/DealAnalysis';
import LearningPanel from './components/LearningPanel';
import DepositModal from './components/DepositModal';
import GoalModal from './components/GoalModal';
import Leaderboard from './components/Leaderboard';
import PerformanceDashboard from './components/PerformanceDashboard';
import Marketplace from './components/Marketplace';
import {
  NexusIcon, CitadelIcon, QuantIcon, ShieldIcon, ChainLinkIcon,
  LightningIcon, CoinsIcon, CheckCircleIcon,
} from './components/Icons';
import { useWebSocket, WSMessage } from './hooks/useWebSocket';
import { getAgents, startDealRound, runLearning, getLeaderboard, getSubscriptions, getVaultBalance, getVaultStats, getUserVaultBalance, getActivePositions, syncPositions, getRebalancerStatus, triggerRebalancerCheck, resetMemory, withdrawPosition, getRegistry, subscribeToAlpha, unsubscribeFromAlpha, registerWebhookAlpha, getWalletTokens, UserGoal } from './services/api';

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
  swapTxHash?: string;
  depositTxHash?: string;
}

interface Deal {
  id: string;
  protocol: string;
  pool: string;
  apy: number;
  decision?: string;
  txHash?: string;
  investmentAmount?: number;
  pitcherId?: string;
  pitchMessage?: string;
  analysisResult?: unknown;
  status?: string;
  tvl?: number;
  riskLevel?: string;
  audited?: boolean;
  [key: string]: unknown;
}

interface Position {
  id: string;
  protocol: string;
  adapterUsed: string;
  token: { symbol: string; decimals: number };
  amountDeposited: string;
  entryAPY: number;
  currentAPY?: number;
  depositTxHash: string;
  openedAt: string;
  status: 'active' | 'withdrawn' | 'rebalancing';
  onChainBalance?: string;
  lastCheckedAt?: string;
  withdrawTxHash?: string;
}

interface LeaderboardEntry {
  agentId: string;
  reputationScore: number;
  totalPitched: number;
  totalAccepted: number;
  winRate: number;
  avgApy: number;
  totalFeesEarned: number;
}

const ALPHA_TAGLINES: Record<string, string> = {
  'agent-alpha-nexus':   'Aggressive · leads with yield upside',
  'agent-alpha-citadel': 'Conservative · audits and capital safety first',
  'agent-alpha-quant':   'Data-driven · risk-adjusted metrics only',
};

const ALPHA_ICONS: Record<string, React.ReactNode> = {
  'agent-alpha-nexus':   <NexusIcon size={14} className="text-orange-400" />,
  'agent-alpha-citadel': <CitadelIcon size={14} className="text-blue-400" />,
  'agent-alpha-quant':   <QuantIcon size={14} className="text-cyan-400" />,
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
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [learningData, setLearningData] = useState<unknown>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [activeAlphaIds, setActiveAlphaIds] = useState<Set<string>>(new Set());
  const [activeBeta, setActiveBeta] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [txCount, setTxCount] = useState(0); // seeded from on-chain after load
  const [vaultBalance, setVaultBalance] = useState<string | undefined>(undefined);
  const [userVaultBalance, setUserVaultBalance] = useState<string | undefined>(undefined);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [activePage, setActivePage] = useState<'dashboard' | 'agents' | 'marketplace'>('dashboard');
  const [registry, setRegistry] = useState<any[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [rebalancerStatus, setRebalancerStatus] = useState<{ running: boolean; lastRunAt?: string; rebalanceCount?: number; activePositions?: number } | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [onChainStats, setOnChainStats] = useState<{ capitalDeployedEth: number; avgApy: number; projectedAnnualEth: number; winRate: number; totalAccepted: number; totalPitched: number } | null>(null);
  const [userGoal, setUserGoal] = useState<UserGoal | null>(() => {
    try { return JSON.parse(localStorage.getItem('smartlayer_goal') || 'null'); } catch { return null; }
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [walletTokens, setWalletTokens] = useState<{ symbol: string; balance: string }[]>([]);

  const { isConnected, address: connectedAddress } = useAccount();

  const handleWSMessage = useCallback((msg: WSMessage) => {
    setMessages(prev => [...prev.slice(-199), msg]);
    if (msg.agentId?.includes('alpha')) {
      setActiveAlphaIds(prev => new Set([...prev, msg.agentId!]));
    }
    if (msg.agentId === 'agent-beta') setActiveBeta(true);
    if (msg.type === 'deal_update' || msg.type === 'deal_executed' || msg.type === 'analysis_update') {
      setActiveDeal(msg.deal as Deal);
    }
    if (msg.type === 'deal_executed') {
      const deal = msg.deal as Deal;
      setTxCount(prev => prev + 1);
      setRoundResult({
        alphaName: msg.agentName || (deal?.alphaId as string) || 'Alpha',
        alphaId: msg.agentId || '',
        protocol: deal?.protocol || '',
        apy: deal?.apy || 0,
        investmentAmount: deal?.investmentAmount,
        txHash: deal?.txHash,
        swapTxHash: deal?.swapTxHash as string | undefined,
        depositTxHash: deal?.depositTxHash as string | undefined,
      });
    }
    if (msg.type === 'learning_update' && msg.data) {
      setLearningData(msg.data);
    }
    if (msg.type === 'rebalance_update' || msg.type === 'position_update') {
      loadPositions();
      loadRebalancerStatus();
    }
    if (msg.type === 'deal_update' && (msg.deal as Deal)?.status === 'decided') {
      setActiveAlphaIds(new Set());
      setActiveBeta(false);
    }
  }, []);

  const wsConnected = useWebSocket(handleWSMessage);

  // Load user's own vault balance when wallet connects
  useEffect(() => {
    if (connectedAddress) loadUserVaultBalance(connectedAddress);
  }, [connectedAddress]);

  async function loadAgents() {
    try {
      const data = await getAgents();
      setAlphas(data.alphas || []);
      setBeta(data.beta);
    } catch (e) {
      console.error('[loadAgents]', e);
    }
  }

  async function loadRegistry() {
    setRegistryLoading(true);
    try {
      const data = await getRegistry();
      if (Array.isArray(data)) {
        setRegistry(data);
      } else {
        console.error('[loadRegistry] unexpected response:', data);
        setRegistry([]);
      }
    } catch (e) {
      console.error('[loadRegistry] fetch failed:', e);
      setRegistry([]);
    } finally {
      setRegistryLoading(false);
    }
  }

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[loadLeaderboard]', e);
    }
  }

  async function loadSubscriptions() {
    try {
      const data = await getSubscriptions();
      setSubscribedIds(data.subscribedAlphaIds || []);
    } catch (e) {
      console.error('[loadSubscriptions]', e);
    }
  }

  async function loadVaultBalance() {
    try {
      const data = await getVaultBalance();
      setVaultBalance(data.vaultBalance || '0');
    } catch (e) {
      console.error('[loadVaultBalance]', e);
    }
  }

  async function loadUserVaultBalance(address: string) {
    try {
      const data = await getUserVaultBalance(address);
      setUserVaultBalance(data.vaultBalance || '0');
    } catch (e) {
      console.error('[loadUserVaultBalance]', e);
    }
  }

  async function loadWalletTokens() {
    try {
      const data = await getWalletTokens();
      setWalletTokens(data.tokens || []);
    } catch (e) {
      console.error('[loadWalletTokens]', e);
    }
  }

  async function loadPositions() {
    try {
      const data = await getActivePositions();
      setPositions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[loadPositions]', e);
    }
  }

  async function loadOnChainStats() {
    try {
      const data = await getVaultStats();
      if (!data.error) {
        setOnChainStats(data);
        // Seed counters from on-chain totals so they survive page refresh
        if (data.totalPitched > 0) setRoundCount(r => Math.max(r, Math.ceil(data.totalPitched / 3)));
        if (data.totalAccepted > 0) setTxCount(t => Math.max(t, data.totalAccepted));
      }
    } catch (e) {
      console.error('[loadOnChainStats]', e);
    }
  }

  async function loadRebalancerStatus() {
    try {
      const data = await getRebalancerStatus();
      setRebalancerStatus(data);
    } catch (e) {
      console.error('[loadRebalancerStatus]', e);
    }
  }

  async function handleManualRebalance() {
    setIsRebalancing(true);
    try {
      await triggerRebalancerCheck();
      await Promise.all([loadPositions(), loadRebalancerStatus()]);
    } finally {
      setIsRebalancing(false);
    }
  }

  async function handleSyncPositions() {
    setIsSyncing(true);
    try {
      const updated = await syncPositions();
      setPositions(Array.isArray(updated) ? updated : []);
    } catch (e) {
      console.error('[syncPositions]', e);
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    Promise.all([loadAgents(), loadLeaderboard(), loadSubscriptions(), loadVaultBalance(), loadPositions(), loadRebalancerStatus(), loadOnChainStats(), loadWalletTokens()])
      .finally(() => setIsLoading(false));
    const interval = setInterval(() => {
      loadAgents();
      loadLeaderboard();
      loadVaultBalance();
      loadPositions();
      loadRebalancerStatus();
      loadOnChainStats();
      loadWalletTokens();
      if (connectedAddress) loadUserVaultBalance(connectedAddress);
    }, 30000);
    return () => clearInterval(interval);
  }, [connectedAddress]);

  function handleSaveGoal(goal: UserGoal) {
    setUserGoal(goal);
    localStorage.setItem('smartlayer_goal', JSON.stringify(goal));
  }

  async function handleNewRound() {
    setIsRunning(true);
    setRoundResult(null);
    setActiveAlphaIds(new Set(alphas.map(a => a.id)));
    setRoundCount(prev => prev + 1);
    try {
      await startDealRound(connectedAddress, userGoal ?? undefined);
      await Promise.all([loadAgents(), loadLeaderboard(), loadVaultBalance(), loadPositions(), loadOnChainStats()]);
      if (connectedAddress) loadUserVaultBalance(connectedAddress);
    } finally {
      setIsRunning(false);
      setActiveAlphaIds(new Set());
      setActiveBeta(false);
    }
  }

  async function handleResetMemory() {
    await resetMemory();
    setLearningData(null);
    await Promise.all([loadAgents(), loadLeaderboard()]);
  }

  async function handleWithdraw(positionId: string) {
    setWithdrawingId(positionId);
    try {
      const result = await withdrawPosition(positionId);
      await loadPositions();
      if (connectedAddress) loadUserVaultBalance(connectedAddress);
      return result;
    } finally {
      setWithdrawingId(null);
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

  const betaReceived = onChainStats?.totalPitched ?? beta?.memory?.dealsReceived?.length ?? 0;
  const betaAccepted = onChainStats?.totalAccepted ?? beta?.memory?.dealsAccepted?.length ?? 0;
  const totalFeesCollected = leaderboard.reduce((sum, e) => sum + (e.totalFeesEarned ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
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
            {/* Page tabs */}
            <div className="flex items-center bg-gray-800/60 rounded-xl p-1 border border-gray-700/50">
              <button
                onClick={() => setActivePage('dashboard')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activePage === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                My Portfolio
              </button>
              <button
                onClick={() => setActivePage('agents')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activePage === 'agents' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Execute Strategy
              </button>
              <button
                onClick={() => { setActivePage('marketplace'); loadRegistry(); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activePage === 'marketplace' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Marketplace
              </button>
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {wsConnected ? 'Live' : 'Reconnecting...'}
            </div>
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">XLayer Mainnet</span>
            <a href="https://x.com/LayerSmart34250" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Round Result Banner */}
      {roundResult && (
        <div className="sticky top-[57px] z-10 bg-green-950/95 border-b border-green-500/30 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3">
            <CheckCircleIcon size={18} className="text-green-400 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap flex-1 text-sm">
              <span className="font-bold text-green-300 flex items-center gap-1.5">
                {ALPHA_ICONS[roundResult.alphaId] || <NexusIcon size={14} className="text-green-400" />}
                {roundResult.alphaName} won this round
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
              <span className="text-green-700">·</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-0.5 font-medium">via OKX DEX</span>
              {roundResult.swapTxHash && (
                <><span className="text-green-700">·</span>
                <a
                  href={`https://www.oklink.com/xlayer/tx/${roundResult.swapTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-500/20 text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-full px-2 py-0.5 font-medium hover:underline"
                >
                  XETH→USDC ↗
                </a></>
              )}
              {roundResult.depositTxHash && (
                <><span className="text-green-700">·</span>
                <a
                  href={`https://www.oklink.com/xlayer/tx/${roundResult.depositTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 rounded-full px-2 py-0.5 font-medium hover:underline"
                >
                  ZeroLend yield ↗
                </a></>
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

      {/* Hero — My Portfolio only */}
      {activePage === 'dashboard' && <div className="border-b border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
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
                AI Agents Compete For Your Capital.<br />
                <span className="text-green-400">The Best Deal Executes On-Chain.</span>
              </h1>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed max-w-lg">
                Competing AI agents pitch the best <strong className="text-gray-200">DeFi yield farming</strong> opportunities. Your personal Beta agent — powered by Claude AI — scores every pitch and automatically executes the winner on XLayer. <strong className="text-gray-200">Real transactions. Real yield. Zero manual work.</strong>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {isConnected ? (
                  <button
                    onClick={() => setActivePage('agents')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    <LightningIcon size={15} className="text-white" /> Go to Live Round →
                  </button>
                ) : (
                  <ConnectWallet label="Connect Wallet to Get Started" />
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
                  <NexusIcon size={13} className="text-purple-400" />
                  <span className="text-purple-300 font-semibold">3 Alpha Agents</span>
                  <span className="text-purple-400/60">competing for capital</span>
                </div>
                <span className="text-gray-600 text-xs">→ pitch deals →</span>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5 text-xs">
                  <ShieldIcon size={13} className="text-green-400" />
                  <span className="text-green-300 font-semibold">Beta Agent</span>
                  <span className="text-green-400/60">your personal AI</span>
                </div>
                <span className="text-gray-600 text-xs">→ executes →</span>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-1.5 text-xs">
                  <ChainLinkIcon size={13} className="text-blue-400" />
                  <span className="text-blue-300 font-semibold">XLayer</span>
                  <span className="text-blue-400/60">real TX on-chain</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {activePage === 'dashboard' && (<>

        {/* ONBOARDING NUDGE — shown until first deal round runs */}
        {betaReceived === 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                <LightningIcon size={15} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">No data yet — run your first deal round</p>
                <p className="text-xs text-gray-400 mt-0.5">Alpha agents will pitch yield opportunities, Beta scores them and executes the best deal on XLayer.</p>
              </div>
            </div>
            <button
              onClick={() => setActivePage('agents')}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
            >
              Execute Strategy →
            </button>
          </div>
        )}

        {/* PERFORMANCE DASHBOARD */}
        <PerformanceDashboard
          acceptedDeals={(beta?.memory?.dealsAccepted ?? []) as any[]}
          totalDealsReceived={betaReceived}
          vaultBalance={vaultBalance}
          onChainStats={onChainStats ?? undefined}
          userGoal={userGoal}
          currentDepositXETH={parseFloat(userVaultBalance || vaultBalance || '0')}
          onSetGoal={() => setShowGoalModal(true)}
        />

        {/* ACTIVE POSITIONS */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CoinsIcon size={16} className="text-purple-400" />
              <span className="text-white font-semibold text-sm">Active Yield Positions</span>
              {positions.length > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full px-2 py-0.5">{positions.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {rebalancerStatus && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${rebalancerStatus.running ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-700/50 text-gray-500 border-gray-700'}`}>
                  {rebalancerStatus.running ? '● Rebalancer active' : '○ Rebalancer off'}
                </span>
              )}
              <button
                onClick={handleSyncPositions}
                disabled={isSyncing}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 disabled:opacity-50 transition-colors"
                title="Sync on-chain balances — recovers orphaned positions"
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
              <button
                onClick={handleManualRebalance}
                disabled={isRebalancing}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 disabled:opacity-50 transition-colors"
              >
                {isRebalancing ? 'Checking...' : 'Check Now'}
              </button>
            </div>
          </div>

          {walletTokens.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/30 border border-gray-700/40 mb-2">
              <span className="text-xs text-gray-500 shrink-0">Agent Wallet</span>
              <div className="flex items-center gap-4 flex-wrap">
                {walletTokens.map(t => (
                  <span key={t.symbol} className="text-xs font-mono">
                    <span className="text-gray-400">{t.symbol} </span>
                    <span className={parseFloat(t.balance) > 0 ? 'text-green-300' : 'text-gray-600'}>{t.balance}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {positions.length === 0 ? (
            <div className="border border-dashed border-gray-700 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm font-medium mb-1">No active positions</p>
              <p className="text-gray-600 text-xs">Capital will be deployed here after a successful deal round</p>
            </div>
          ) : (
            <div className="space-y-2">
              {positions.map(pos => {
                const apyDiff = pos.currentAPY !== undefined ? pos.currentAPY - pos.entryAPY : 0;
                const apyColor = apyDiff >= 0 ? 'text-green-400' : 'text-red-400';
                const statusColor = pos.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/30' : pos.status === 'rebalancing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-gray-700/50 text-gray-500 border-gray-600';
                return (
                  <div key={pos.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm font-medium">{pos.adapterUsed || pos.protocol}</span>
                        <span className="text-gray-500 text-xs">{pos.token.symbol}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${statusColor}`}>{pos.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{pos.amountDeposited} {pos.token.symbol} deposited</span>
                        <span className="text-gray-600">·</span>
                        <span>Entry APY: <span className="text-white">{pos.entryAPY.toFixed(1)}%</span></span>
                        {pos.currentAPY !== undefined && (
                          <><span className="text-gray-600">·</span><span>Now: <span className={apyColor}>{pos.currentAPY.toFixed(1)}%</span>{apyDiff !== 0 && <span className={apyColor}> ({apyDiff > 0 ? '+' : ''}{apyDiff.toFixed(1)}%)</span>}</span></>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://www.oklink.com/xlayer/tx/${pos.depositTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 font-mono"
                      >
                        TX ↗
                      </a>
                      {pos.status === 'active' && (
                        <button
                          onClick={() => handleWithdraw(pos.id)}
                          disabled={withdrawingId === pos.id}
                          className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {withdrawingId === pos.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                      {pos.status === 'withdrawn' && pos.withdrawTxHash && (
                        <a
                          href={`https://www.oklink.com/xlayer/tx/${pos.withdrawTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-400 font-mono"
                        >
                          Withdrawn ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {rebalancerStatus?.lastRunAt && (
                <p className="text-xs text-gray-600 text-right pt-1">
                  Last checked: {new Date(rebalancerStatus.lastRunAt).toLocaleTimeString()} · {rebalancerStatus.rebalanceCount ?? 0} rebalance(s)
                </p>
              )}
            </div>
          )}
        </div>

        {/* LEARNING PANEL */}
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Learning Insights</div>
          <LearningPanel
            data={learningData as never}
            onRunLearning={handleRunLearning}
            onResetMemory={handleResetMemory}
            isRunning={isLearning}
          />
        </div>

      </>)}

      {activePage === 'agents' && (<>

        {/* Beta Agent Card */}
        <div>
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

        {/* PRIMARY: Action + Live Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-0.5">
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
                ) : <><LightningIcon size={15} className="text-white" /> Run Strategy Selection</>}
              </button>
              {!isRunning && (
                <span className="text-xs text-gray-600 px-1">Alphas pitch · Beta scores · best deal executes on-chain</span>
              )}
            </div>
            {isConnected && beta?.walletAddress && (
              <button
                onClick={() => setShowDeposit(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition-colors border border-gray-700"
              >
                <CoinsIcon size={15} className="text-white" /> Deposit to Agent
              </button>
            )}
            {isConnected && userVaultBalance !== undefined && parseFloat(userVaultBalance) > 0 && (
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2.5">
                <ChainLinkIcon size={12} className="text-green-400" />
                <span className="text-xs text-green-400 font-medium">Your vault:</span>
                <span className="text-sm font-mono font-bold text-green-300">{parseFloat(userVaultBalance).toFixed(5)} XETH</span>
              </div>
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
              <DealAnalysis deal={activeDeal as never} />
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
            {isLoading ? [0, 1, 2].map(i => (
              <div key={i} className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-gray-700 rounded" />
                    <div className="h-2 w-16 bg-gray-800 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-gray-800 rounded" />
                  <div className="h-2 w-3/4 bg-gray-800 rounded" />
                </div>
              </div>
            )) : alphas.map((a, i) => {
              const lb = leaderboard.find(e => e.agentId === a.id) || leaderboard[i] || {};
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
            })}
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-800" />
          <span className="text-gray-700 text-xs">60% AI score + 40% on-chain reputation → best pitch wins allocation</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Leaderboard */}
        <Leaderboard
          entries={leaderboard}
          subscribedIds={subscribedIds}
          onSubscriptionChange={setSubscribedIds}
        />
      </>)}

      {activePage === 'marketplace' && (
        <Marketplace
          registry={registry}
          subscribedIds={subscribedIds}
          onSubscribe={async (id) => { await subscribeToAlpha(id); setSubscribedIds(prev => [...prev, id]); }}
          onUnsubscribe={async (id) => { await unsubscribeFromAlpha(id); setSubscribedIds(prev => prev.filter(s => s !== id)); }}
          onRegisterWebhook={async (name, webhookUrl, pitchStyle) => { await registerWebhookAlpha(name, webhookUrl, pitchStyle); await loadRegistry(); }}
          isLoading={registryLoading}
        />
      )}

      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-gray-600 text-xs">
        SmartLayer — XLayer OnchainOS AI Hackathon 2026 · Powered by Claude AI + OKX OnchainOS
      </footer>

      {showDeposit && beta?.walletAddress && (
        <DepositModal
          agentAddress={beta.walletAddress}
          agentName="Agent Beta"
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { setShowDeposit(false); loadAgents(); loadVaultBalance(); if (connectedAddress) loadUserVaultBalance(connectedAddress); }}
        />
      )}

      {showGoalModal && (
        <GoalModal
          currentGoal={userGoal}
          currentDepositXETH={parseFloat(userVaultBalance || '0')}
          onSave={handleSaveGoal}
          onClose={() => setShowGoalModal(false)}
        />
      )}
    </div>
  );
}
