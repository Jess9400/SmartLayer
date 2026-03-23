import { callClaude, parseJSON } from '../services/claude';
import { getAllDeals, updateAgentMemory } from './store';
import { LEARNING_PROMPT } from '../utils/prompts';
import { AGENT_IDS } from '../utils/constants';

interface LearningResult {
  successPatterns: string[];
  failurePatterns: string[];
  recommendedThresholds: {
    minApy: number;
    minTvl: number;
    preferredRisk: 'low' | 'medium' | 'high';
  };
  pitchingAdvice: string[];
  analysisAdvice: string[];
  keyInsight: string;
}

export async function runLearningCycle(): Promise<LearningResult> {
  const deals = getAllDeals();

  if (deals.length < 2) {
    return {
      successPatterns: ['Not enough deals yet to identify patterns'],
      failurePatterns: [],
      recommendedThresholds: { minApy: 5, minTvl: 500000, preferredRisk: 'low' },
      pitchingAdvice: ['Focus on audited protocols with proven TVL'],
      analysisAdvice: ['Prefer stable yields above market average'],
      keyInsight: 'Need more deal history to generate insights',
    };
  }

  const dealHistory = deals.map(d => ({
    protocol: d.protocol,
    apy: d.apy,
    tvl: d.tvl,
    audited: d.audited,
    riskLevel: d.riskLevel,
    decision: d.decision,
    reasoning: d.decisionReasoning,
    status: d.status,
  }));

  const prompt = LEARNING_PROMPT
    .replace('{dealHistory}', JSON.stringify(dealHistory, null, 2))
    .replace('{outcomes}', JSON.stringify(deals.map(d => ({ id: d.id, status: d.status, actualApy: d.actualApy })), null, 2));

  const raw = await callClaude(prompt);
  const result = parseJSON<LearningResult>(raw);

  // Apply learnings to Beta's memory
  updateAgentMemory(AGENT_IDS.BETA, {
    patterns: {
      acceptancePatterns: {
        minApy: result.recommendedThresholds.minApy,
        minTvl: result.recommendedThresholds.minTvl,
        preferredProtocols: [],
        riskTolerance: result.recommendedThresholds.preferredRisk,
      },
      successfulPitchPatterns: {
        emphasizeApy: result.pitchingAdvice.some(a => a.toLowerCase().includes('apy')),
        emphasizeSecurity: result.pitchingAdvice.some(a => a.toLowerCase().includes('audit')),
        useHistoricalData: result.pitchingAdvice.some(a => a.toLowerCase().includes('histor')),
      },
    },
  } as any);

  return result;
}
