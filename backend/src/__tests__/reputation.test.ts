import { computeReputationScore, computeRiskProfile } from '../memory/store';
import { AgentMemory } from '../types';

function makeMemory(overrides: Partial<AgentMemory> = {}): AgentMemory {
  return {
    agentId: 'test-agent',
    dealsPitched: [],
    dealsReceived: [],
    dealsAccepted: [],
    dealsRejected: [],
    patterns: {
      acceptancePatterns: { minApy: 5, minTvl: 500000, preferredProtocols: [], riskTolerance: 'low' },
      successfulPitchPatterns: { emphasizeApy: true, emphasizeSecurity: true, useHistoricalData: false },
    },
    performance: { totalInvested: 0, totalReturns: 0, winRate: 0, avgApy: 0 },
    ...overrides,
  };
}

function makeDeal(id: string, apy: number, decision: 'accept' | 'reject', riskLevel: 'low' | 'medium' | 'high' = 'low') {
  return { id, apy, decision, riskLevel, protocol: 'ZeroLend', pool: 'USDC' } as any;
}

// ── computeReputationScore ──────────────────────────────────────────────────

describe('computeReputationScore', () => {
  it('returns 0 for an agent with no deals', () => {
    expect(computeReputationScore(makeMemory())).toBe(0);
  });

  it('scores higher for a higher win rate', () => {
    const highWinRate = makeMemory({
      dealsPitched: [makeDeal('1', 10, 'accept'), makeDeal('2', 10, 'accept'), makeDeal('3', 10, 'reject')],
    });
    const lowWinRate = makeMemory({
      dealsPitched: [makeDeal('1', 10, 'reject'), makeDeal('2', 10, 'reject'), makeDeal('3', 10, 'accept')],
    });
    expect(computeReputationScore(highWinRate)).toBeGreaterThan(computeReputationScore(lowWinRate));
  });

  it('scores higher for more deal volume (up to 20)', () => {
    const manyDeals = makeMemory({
      dealsPitched: Array.from({ length: 20 }, (_, i) => makeDeal(`${i}`, 10, 'accept')),
    });
    const fewDeals = makeMemory({
      dealsPitched: [makeDeal('1', 10, 'accept'), makeDeal('2', 10, 'accept')],
    });
    expect(computeReputationScore(manyDeals)).toBeGreaterThan(computeReputationScore(fewDeals));
  });

  it('never exceeds 100', () => {
    const perfect = makeMemory({
      dealsPitched: Array.from({ length: 20 }, (_, i) => makeDeal(`${i}`, 20, 'accept')),
    });
    expect(computeReputationScore(perfect)).toBeLessThanOrEqual(100);
  });

  it('returns a number between 0 and 100 for any input', () => {
    const mixed = makeMemory({
      dealsPitched: [
        makeDeal('1', 5, 'accept'), makeDeal('2', 30, 'reject'),
        makeDeal('3', 12, 'accept'), makeDeal('4', 8, 'reject'),
      ],
    });
    const score = computeReputationScore(mixed);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── computeRiskProfile ──────────────────────────────────────────────────────

describe('computeRiskProfile', () => {
  it('returns conservative for an agent with no accepted deals', () => {
    expect(computeRiskProfile(makeMemory())).toBe('conservative');
  });

  it('returns aggressive for high-APY / high-risk deal history', () => {
    const memory = makeMemory({
      dealsAccepted: [makeDeal('1', 25, 'accept', 'high'), makeDeal('2', 30, 'accept', 'high')],
    });
    expect(computeRiskProfile(memory)).toBe('aggressive');
  });

  it('returns balanced for moderate-APY deal history', () => {
    const memory = makeMemory({
      dealsAccepted: [makeDeal('1', 12, 'accept', 'low'), makeDeal('2', 15, 'accept', 'medium')],
    });
    expect(computeRiskProfile(memory)).toBe('balanced');
  });

  it('returns conservative for low-APY / low-risk deal history', () => {
    const memory = makeMemory({
      dealsAccepted: [makeDeal('1', 4, 'accept', 'low'), makeDeal('2', 5, 'accept', 'low')],
    });
    expect(computeRiskProfile(memory)).toBe('conservative');
  });
});
