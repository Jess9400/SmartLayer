import { BaseAgent } from './base';
import { Deal, AnalysisResult, UserGoal } from '../types';
import { callClaude, parseJSON } from '../services/claude';
import { getAgentMemory } from '../memory/store';
import { BETA_ANALYSIS_PROMPT } from '../utils/prompts';
import { AGENT_IDS } from '../utils/constants';
import { getAvgStableYield } from '../services/defillama';

interface AnalysisResponse {
  analysis: {
    protocolAssessment: string;
    apyAssessment: string;
    riskAssessment: string;
    macroAssessment: string;
    historyComparison: string;
  };
  scores: {
    protocol: number;
    apy: number;
    risk: number;
    macro: number;
    history: number;
    overall: number;
  };
  decision: 'accept' | 'counter' | 'reject';
  reasoning: string;
  investmentAmount: number | null;
  counterTerms: string | null;
  confidence: number;
}

export class BetaAgent extends BaseAgent {
  riskTolerance: 'low' | 'medium' | 'high' = 'low';
  minApyThreshold: number = 5;

  constructor(privateKey: string) {
    super(AGENT_IDS.BETA, 'Agent Beta', 'Deal Analyst', privateKey);
  }

  async analyzeDeal(deal: Deal, balance: string, userGoal?: UserGoal): Promise<Deal> {
    const memory = getAgentMemory(this.id);

    // Update thresholds from learned patterns — not hardcoded anymore
    const patterns = memory.patterns?.acceptancePatterns;
    if (patterns) {
      this.minApyThreshold = patterns.minApy ?? this.minApyThreshold;
      this.riskTolerance = (patterns.riskTolerance as 'low' | 'medium' | 'high') ?? this.riskTolerance;
    }

    const avgYield = await getAvgStableYield();

    const similarDeals = memory.dealsReceived
      .filter(d => d.protocol === deal.protocol || Math.abs(d.apy - deal.apy) < 3)
      .slice(-3)
      .map(d => `${d.protocol} @ ${d.apy}% — ${d.decision || 'pending'}: ${d.decisionReasoning || 'n/a'}`)
      .join('\n') || 'No similar deals in history yet.';

    // Build goal section for prompt
    let userGoalSection = '';
    if (userGoal) {
      const current = parseFloat(balance) || 0;
      const target = userGoal.targetAmountXETH;
      const months = userGoal.timelineMonths;
      let requiredApy = 0;
      if (current > 0 && target > current && months > 0) {
        requiredApy = (Math.pow(target / current, 12 / months) - 1) * 100;
      }
      const apyStr = requiredApy > 0 ? `${requiredApy.toFixed(1)}%` : 'N/A (target ≤ current deposit or no deposit yet)';
      const feasibility = requiredApy <= 0 ? '' : requiredApy < 20 ? '(achievable with quality DeFi protocols)' : requiredApy < 100 ? '(ambitious — accept only high-APY deals)' : '(unrealistic — maximize best available yield and flag this to the user)';
      userGoalSection = `\nUSER INVESTMENT GOAL:
- Target: ${target} XETH in ${months} months
- Current deposit: ${current.toFixed(5)} XETH
- Required APY to reach goal: ${apyStr} ${feasibility}
- User risk preference: ${userGoal.riskTolerance}
Adjust your scoring: weight APY match to the required rate. If the required APY is realistic, be strict about accepting only deals in that range. If unrealistic, focus on best available yield and note in reasoning that the goal may need revision.
`;
    }

    const prompt = BETA_ANALYSIS_PROMPT
      .replace('{userGoalSection}', userGoalSection)
      .replace('{walletBalance}', balance)
      .replace('{riskTolerance}', this.riskTolerance)
      .replace('{minApyThreshold}', String(this.minApyThreshold))
      .replace('{pitchMessage}', deal.pitchMessage)
      .replace('{protocol}', deal.protocol)
      .replace('{pool}', deal.pool)
      .replace('{chain}', deal.chain)
      .replace('{apy}', String(deal.apy))
      .replace('{tvl}', String(deal.tvl))
      .replace('{audited}', String(deal.audited))
      .replace('{riskLevel}', deal.riskLevel)
      .replace('{avgStableYield}', String(avgYield))
      .replace('{marketSentiment}', 'neutral — crypto market consolidating')
      .replace('{similarDealsHistory}', similarDeals);

    const raw = await callClaude(prompt);
    const result = parseJSON<AnalysisResponse>(raw);

    const analysisResult: AnalysisResult = {
      protocolScore: result.scores.protocol,
      apyScore: result.scores.apy,
      tvlScore: result.scores.risk,
      macroScore: result.scores.macro,
      historyScore: result.scores.history,
      overallScore: result.scores.overall,
      risks: [],
      positives: [],
      protocolAssessment: result.analysis.protocolAssessment,
      apyAssessment: result.analysis.apyAssessment,
      riskAssessment: result.analysis.riskAssessment,
      macroAssessment: result.analysis.macroAssessment,
      historyComparison: result.analysis.historyComparison,
    };

    return {
      ...deal,
      analysisResult,
      decision: result.decision,
      decisionReasoning: result.reasoning,
      investmentAmount: result.investmentAmount || undefined,
      counterTerms: result.counterTerms || undefined,
      status: 'decided',
    };
  }
}
