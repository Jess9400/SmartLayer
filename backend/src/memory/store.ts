import fs from 'fs';
import path from 'path';
import { Deal, AgentMemory } from '../types';
import { ALPHA_AGENTS } from '../utils/constants';

const DATA_DIR = path.join(__dirname, '../../data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadSubscriptions(): Record<string, string[]> {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    // Default: Beta subscribes to all Alpha agents
    const defaults: Record<string, string[]> = {
      'agent-beta': ALPHA_AGENTS.map(a => a.id),
    };
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8'));
}

function saveSubscriptions(subs: Record<string, string[]>): void {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
}

export function getBetaSubscriptions(): string[] {
  return loadSubscriptions()['agent-beta'] || ALPHA_AGENTS.map(a => a.id);
}

export function subscribeToAlpha(betaId: string, alphaId: string): void {
  const subs = loadSubscriptions();
  if (!subs[betaId]) subs[betaId] = [];
  if (!subs[betaId].includes(alphaId)) subs[betaId].push(alphaId);
  saveSubscriptions(subs);
  // Mirror to chain asynchronously (fire-and-forget)
  _mirrorSubscribeToChain(alphaId).catch(e => console.warn('Chain subscribe failed (non-fatal):', e.message));
}

export function unsubscribeFromAlpha(betaId: string, alphaId: string): void {
  const subs = loadSubscriptions();
  if (!subs[betaId]) return;
  subs[betaId] = subs[betaId].filter(id => id !== alphaId);
  saveSubscriptions(subs);
  _mirrorUnsubscribeToChain(alphaId).catch(e => console.warn('Chain unsubscribe failed (non-fatal):', e.message));
}

async function _mirrorSubscribeToChain(alphaId: string): Promise<void> {
  const { contractsConfigured, subscribeOnChain } = await import('../services/contracts');
  if (!contractsConfigured()) return;
  const betaKey = process.env.AGENT_BETA_PRIVATE_KEY;
  if (!betaKey) return;
  const txHash = await subscribeOnChain(betaKey, alphaId);
  console.log(`[chain] Subscribed to ${alphaId}: ${txHash}`);
}

async function _mirrorUnsubscribeToChain(alphaId: string): Promise<void> {
  const { contractsConfigured, unsubscribeOnChain } = await import('../services/contracts');
  if (!contractsConfigured()) return;
  const betaKey = process.env.AGENT_BETA_PRIVATE_KEY;
  if (!betaKey) return;
  const txHash = await unsubscribeOnChain(betaKey, alphaId);
  console.log(`[chain] Unsubscribed from ${alphaId}: ${txHash}`);
}

export function getDealsByAlpha(alphaId: string): Deal[] {
  return load().deals.filter(d => d.pitcherId === alphaId);
}

export function computeReputationScore(memory: AgentMemory): number {
  const totalPitched = memory.dealsPitched.length;
  if (totalPitched === 0) return 0;

  const accepted = memory.dealsPitched.filter(d => d.decision === 'accept').length;
  const winRate = accepted / totalPitched; // 0-1

  // Avg APY of accepted deals (quality of pitches)
  const acceptedDeals = memory.dealsPitched.filter(d => d.decision === 'accept');
  const avgApy = acceptedDeals.length > 0
    ? acceptedDeals.reduce((sum, d) => sum + d.apy, 0) / acceptedDeals.length
    : 0;

  // Volume score: more deals = more track record (capped at 20)
  const volumeScore = Math.min(totalPitched, 20) / 20;

  // Recency score: any deal in last 10 rounds gets a boost
  const recentAccepted = memory.dealsPitched.slice(-10).filter(d => d.decision === 'accept').length;
  const recencyScore = recentAccepted / Math.min(memory.dealsPitched.slice(-10).length, 10);

  const score = Math.round(
    (winRate * 50) +           // 50 pts: win rate
    (volumeScore * 25) +       // 25 pts: deal volume
    (Math.min(avgApy, 20) / 20 * 15) + // 15 pts: APY quality
    (recencyScore * 10)        // 10 pts: recent activity
  );

  return Math.min(score, 100);
}

export function computeRiskProfile(memory: AgentMemory): 'conservative' | 'balanced' | 'aggressive' {
  const accepted = memory.dealsAccepted;
  if (accepted.length === 0) return 'conservative';

  const avgApy = accepted.reduce((sum, d) => sum + d.apy, 0) / accepted.length;
  const highRiskCount = accepted.filter(d => d.riskLevel === 'high').length;
  const highRiskRatio = highRiskCount / accepted.length;

  if (avgApy > 20 || highRiskRatio > 0.5) return 'aggressive';
  if (avgApy > 10 || highRiskRatio > 0.2) return 'balanced';
  return 'conservative';
}

const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

interface MemoryStore {
  agents: Record<string, AgentMemory>;
  deals: Deal[];
}

function load(): MemoryStore {
  if (!fs.existsSync(MEMORY_FILE)) {
    const initial: MemoryStore = { agents: {}, deals: [] };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
}

function save(store: MemoryStore): void {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2));
}

export function getAgentMemory(agentId: string): AgentMemory {
  const store = load();
  if (!store.agents[agentId]) {
    store.agents[agentId] = {
      agentId,
      dealsPitched: [],
      dealsReceived: [],
      dealsAccepted: [],
      dealsRejected: [],
      patterns: {
        acceptancePatterns: {
          minApy: 5,
          minTvl: 500000,
          preferredProtocols: [],
          riskTolerance: 'low',
        },
        successfulPitchPatterns: {
          emphasizeApy: true,
          emphasizeSecurity: true,
          useHistoricalData: false,
        },
      },
      performance: {
        totalInvested: 0,
        totalReturns: 0,
        winRate: 0,
        avgApy: 0,
      },
    };
    save(store);
  }
  return store.agents[agentId];
}

export function saveDeal(deal: Deal): void {
  const store = load();
  const existingIdx = store.deals.findIndex(d => d.id === deal.id);
  if (existingIdx >= 0) {
    store.deals[existingIdx] = deal;
  } else {
    store.deals.push(deal);
  }

  // Update agent memories
  if (!store.agents[deal.pitcherId]) {
    getAgentMemory(deal.pitcherId);
    return saveDeal(deal);
  }
  if (!store.agents[deal.receiverId]) {
    getAgentMemory(deal.receiverId);
    return saveDeal(deal);
  }

  const pitcher = store.agents[deal.pitcherId];
  const receiver = store.agents[deal.receiverId];

  // Update pitcher
  const pitchedIdx = pitcher.dealsPitched.findIndex(d => d.id === deal.id);
  if (pitchedIdx >= 0) pitcher.dealsPitched[pitchedIdx] = deal;
  else pitcher.dealsPitched.push(deal);

  // Update receiver
  const receivedIdx = receiver.dealsReceived.findIndex(d => d.id === deal.id);
  if (receivedIdx >= 0) receiver.dealsReceived[receivedIdx] = deal;
  else receiver.dealsReceived.push(deal);

  if (deal.decision === 'accept') {
    const accIdx = receiver.dealsAccepted.findIndex(d => d.id === deal.id);
    if (accIdx >= 0) receiver.dealsAccepted[accIdx] = deal;
    else receiver.dealsAccepted.push(deal);

    if (deal.investmentAmount) {
      receiver.performance.totalInvested += deal.investmentAmount;
    }
  } else if (deal.decision === 'reject') {
    const rejIdx = receiver.dealsRejected.findIndex(d => d.id === deal.id);
    if (rejIdx >= 0) receiver.dealsRejected[rejIdx] = deal;
    else receiver.dealsRejected.push(deal);
  }

  // Update Alpha reputation score after every deal decision
  pitcher.reputationScore = computeReputationScore(pitcher);
  const totalFees = pitcher.dealsPitched
    .filter(d => d.alphaFeeAmount)
    .reduce((sum, d) => sum + (d.alphaFeeAmount || 0), 0);
  pitcher.totalFeesEarned = totalFees;

  // Update Beta risk profile after every accepted/rejected deal
  if (deal.decision === 'accept' || deal.decision === 'reject') {
    receiver.riskProfile = computeRiskProfile(receiver);
  }

  save(store);
}

export function getAllDeals(): Deal[] {
  return load().deals;
}

export interface LeaderboardEntry {
  agentId: string;
  reputationScore: number;
  totalPitched: number;
  totalAccepted: number;
  winRate: number;
  avgApy: number;
  totalFeesEarned: number;
}

export function getAlphaLeaderboard(): LeaderboardEntry[] {
  const store = load();
  return Object.values(store.agents)
    .filter(a => a.dealsPitched.length > 0)
    .map(a => {
      const accepted = a.dealsPitched.filter(d => d.decision === 'accept');
      const avgApy = accepted.length > 0
        ? accepted.reduce((sum, d) => sum + d.apy, 0) / accepted.length
        : 0;
      return {
        agentId: a.agentId,
        reputationScore: a.reputationScore ?? computeReputationScore(a),
        totalPitched: a.dealsPitched.length,
        totalAccepted: accepted.length,
        winRate: a.dealsPitched.length > 0 ? Math.round((accepted.length / a.dealsPitched.length) * 100) : 0,
        avgApy: Math.round(avgApy * 10) / 10,
        totalFeesEarned: a.totalFeesEarned ?? 0,
      };
    })
    .sort((a, b) => b.reputationScore - a.reputationScore);
}

export function updateAgentMemory(agentId: string, updates: Partial<AgentMemory>): void {
  const store = load();
  store.agents[agentId] = { ...store.agents[agentId], ...updates };
  save(store);
}
