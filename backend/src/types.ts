export interface YieldOpportunity {
  protocol: string;
  pool: string;
  chain: string;
  apy: number;
  tvl: number;
  apyBase: number;
  apyReward: number;
  audited: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  contractAddress?: string;
}

export interface AnalysisResult {
  protocolScore: number;
  apyScore: number;
  tvlScore: number;
  macroScore: number;
  historyScore: number;
  overallScore: number;
  risks: string[];
  positives: string[];
  protocolAssessment: string;
  apyAssessment: string;
  riskAssessment: string;
  macroAssessment: string;
  historyComparison: string;
}

export interface Deal {
  id: string;
  timestamp: Date;

  // Opportunity
  protocol: string;
  pool: string;
  chain: string;
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high';
  audited: boolean;
  contractAddress?: string;

  // Pitch
  pitcherId: string;
  pitchMessage: string;
  suggestedAmount: number;
  confidence: number;

  // Analysis
  receiverId: string;
  analysisResult?: AnalysisResult;

  // Decision
  decision?: 'accept' | 'counter' | 'reject';
  decisionReasoning?: string;
  investmentAmount?: number;
  counterTerms?: string;

  // Execution
  executed: boolean;
  txHash?: string;

  // Outcome
  status: 'pitching' | 'analyzing' | 'decided' | 'executing' | 'active' | 'completed' | 'failed';
  actualReturn?: number;
  actualApy?: number;
}

export interface AgentMemory {
  agentId: string;
  dealsPitched: Deal[];
  dealsReceived: Deal[];
  dealsAccepted: Deal[];
  dealsRejected: Deal[];
  patterns: {
    acceptancePatterns: {
      minApy: number;
      minTvl: number;
      preferredProtocols: string[];
      riskTolerance: 'low' | 'medium' | 'high';
    };
    successfulPitchPatterns: {
      emphasizeApy: boolean;
      emphasizeSecurity: boolean;
      useHistoricalData: boolean;
    };
  };
  performance: {
    totalInvested: number;
    totalReturns: number;
    winRate: number;
    avgApy: number;
  };
}

export interface AgentState {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
  balance: string;
  memory: AgentMemory;
}

export interface WSMessage {
  type: 'agent_message' | 'deal_update' | 'deal_executed' | 'analysis_update' | 'learning_update' | 'error';
  agentId?: string;
  agentName?: string;
  message?: string;
  deal?: Deal;
  data?: unknown;
  timestamp: string;
}
