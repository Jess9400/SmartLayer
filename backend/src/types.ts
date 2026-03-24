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
  pitcherAddress?: string;
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

  // Alpha 3% performance fee
  alphaFeeAmount?: number;
  alphaFeeTxHash?: string;

  // OKX DEX swap (real yield deployment)
  swapTxHash?: string;
  swapToAmount?: string;  // USDC received

  // On-chain yield deposit (via adapter)
  depositTxHash?: string;
  adapterUsed?: string;

  // Outcome
  status: 'pitching' | 'analyzing' | 'decided' | 'executing' | 'active' | 'completed' | 'failed';
  actualReturn?: number;
  actualApy?: number;
}

export interface Position {
  id: string;
  dealId: string;
  alphaId: string;
  alphaName: string;
  protocol: string;
  adapterUsed: string;
  token: { address: string; symbol: string; decimals: number };
  amountDeposited: string;       // human-readable (e.g. "12.5")
  amountDepositedRaw: string;    // bigint serialized as string
  entryAPY: number;
  depositTxHash: string;
  openedAt: string;
  status: 'active' | 'withdrawn' | 'rebalancing';
  onBehalfOf: string;
  currentAPY?: number;
  onChainBalance?: string;       // raw bigint as string
  lastCheckedAt?: string;
  withdrawTxHash?: string;
  closedAt?: string;
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
  // Alpha agent reputation (computed from on-chain track record)
  reputationScore?: number;
  totalFeesEarned?: number;
  // Beta agent risk profile (learned from deal history)
  riskProfile?: 'conservative' | 'balanced' | 'aggressive';
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
  type: 'agent_message' | 'deal_update' | 'deal_executed' | 'analysis_update' | 'learning_update' | 'rebalance_update' | 'position_update' | 'error';
  agentId?: string;
  agentName?: string;
  message?: string;
  deal?: Deal;
  data?: unknown;
  timestamp: string;
}
