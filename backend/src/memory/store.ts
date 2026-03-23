import fs from 'fs';
import path from 'path';
import { Deal, AgentMemory } from '../types';

const MEMORY_FILE = path.join(__dirname, '../../data/memory.json');

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

  save(store);
}

export function getAllDeals(): Deal[] {
  return load().deals;
}

export function updateAgentMemory(agentId: string, updates: Partial<AgentMemory>): void {
  const store = load();
  store.agents[agentId] = { ...store.agents[agentId], ...updates };
  save(store);
}
