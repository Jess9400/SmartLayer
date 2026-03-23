import { BaseAgent } from './base';
import { YieldOpportunity, Deal } from '../types';
import { callClaude, parseJSON } from '../services/claude';
import { getAgentMemory } from '../memory/store';
import { ALPHA_PITCH_PROMPT } from '../utils/prompts';
import { AGENT_IDS } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

interface PitchResult {
  pitch: string;
  suggestedAmount: number;
  keySellingPoints: string[];
  anticipatedObjections: string[];
  confidence: number;
}

export class AlphaAgent extends BaseAgent {
  constructor(privateKey: string) {
    super(AGENT_IDS.ALPHA, 'Agent Alpha', 'Deal Scout', privateKey);
  }

  async generatePitch(opportunity: YieldOpportunity, balance: string): Promise<Deal> {
    const betaMemory = getAgentMemory(AGENT_IDS.BETA);

    const recentAccepts = betaMemory.dealsAccepted
      .slice(-3)
      .map(d => `${d.protocol} ${d.pool} @ ${d.apy}% APY`)
      .join(', ') || 'none yet';

    const recentRejects = betaMemory.dealsRejected
      .slice(-3)
      .map(d => `${d.protocol} ${d.pool} @ ${d.apy}% APY`)
      .join(', ') || 'none yet';

    const successfulPitches = betaMemory.dealsAccepted
      .slice(-2)
      .map(d => d.pitchMessage)
      .join('\n') || 'no history yet';

    const prompt = ALPHA_PITCH_PROMPT
      .replace('{walletBalance}', balance)
      .replace('{yieldData}', JSON.stringify(opportunity, null, 2))
      .replace('{betaRiskTolerance}', betaMemory.patterns.acceptancePatterns.riskTolerance)
      .replace('{betaMinApy}', String(betaMemory.patterns.acceptancePatterns.minApy))
      .replace('{betaPreferredProtocols}', betaMemory.patterns.acceptancePatterns.preferredProtocols.join(', ') || 'none recorded')
      .replace('{betaRecentAccepts}', recentAccepts)
      .replace('{betaRecentRejects}', recentRejects)
      .replace('{successfulPitches}', successfulPitches);

    const raw = await callClaude(prompt);
    const result = parseJSON<PitchResult>(raw);

    const deal: Deal = {
      id: uuidv4(),
      timestamp: new Date(),
      protocol: opportunity.protocol,
      pool: opportunity.pool,
      chain: opportunity.chain,
      apy: opportunity.apy,
      tvl: opportunity.tvl,
      riskLevel: opportunity.riskLevel,
      audited: opportunity.audited,
      contractAddress: opportunity.contractAddress,
      pitcherId: this.id,
      pitchMessage: result.pitch,
      suggestedAmount: result.suggestedAmount,
      confidence: result.confidence,
      receiverId: AGENT_IDS.BETA,
      executed: false,
      status: 'pitching',
    };

    return deal;
  }
}
