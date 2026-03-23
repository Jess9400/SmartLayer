# SmartLayer Architecture v2

> **AI Agents That Pitch, Analyze, and Invest in Deals Autonomously**
> XLayer OnchainOS AI Hackathon | Deadline: March 26, 23:59 UTC

---

## 1. Concept

### One-Liner
> "AI agents that discover yield opportunities, pitch deals to each other, analyze with memory + macro context, and execute investments on-chain."

### The Vision
Each agent is an autonomous fund manager with:
- Its own wallet with pre-approved capital
- Ability to discover yield/investment opportunities
- Ability to pitch deals to other agents
- AI-powered analysis (protocol risk, macro, past performance)
- Memory of past deals and their outcomes
- Learning system that improves decision-making over time

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SMARTLAYER NETWORK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────┐                    ┌───────────────────┐            │
│   │     AGENT ALPHA   │                    │     AGENT BETA    │            │
│   │   (Deal Finder)   │                    │   (Deal Analyst)  │            │
│   │                   │                    │                   │            │
│   │  Wallet: 0xAAA    │                    │  Wallet: 0xBBB    │            │
│   │  Balance: $500    │                    │  Balance: $300    │            │
│   │                   │                    │                   │            │
│   │  Role: Scouts     │    PITCH DEAL      │  Role: Evaluates  │            │
│   │  yield opps,      │ ─────────────────► │  deals, decides   │            │
│   │  pitches deals    │                    │  to invest or not │            │
│   │                   │ ◄───────────────── │                   │            │
│   │                   │  ACCEPT / REJECT   │                   │            │
│   └─────────┬─────────┘                    └─────────┬─────────┘            │
│             │                                        │                      │
│             │              ┌───────────┐             │                      │
│             └──────────────┤  MEMORY   ├─────────────┘                      │
│                            │  SYSTEM   │                                    │
│                            └─────┬─────┘                                    │
│                                  │                                          │
│                                  ▼                                          │
│                          ┌───────────────┐                                  │
│                          │   ANALYSIS    │                                  │
│                          │    ENGINE     │                                  │
│                          │  (Patterns,   │                                  │
│                          │   Learnings)  │                                  │
│                          └───────────────┘                                  │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        EXTERNAL DATA                                 │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │ Yield APIs  │  │ Market/Macro│  │  Protocol   │                  │   │
│   │  │ (DeFiLlama) │  │   Data      │  │   Info      │                  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EXECUTION LAYER                                 │   │
│   │              OKX OnchainOS + XLayer Mainnet                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Agent Design

### Agent Alpha: "The Scout"

**Role:** Finds yield opportunities and pitches them to other agents

**Capabilities:**
- Scans yield aggregators (DeFiLlama, protocol APIs)
- Evaluates basic risk metrics (TVL, audit status, APY sustainability)
- Crafts compelling pitch messages
- Tracks which pitches succeeded/failed
- Adapts pitching strategy based on what other agents respond to

**Personality:** Proactive, salesy, data-driven

**Wallet:** Pre-funded with USDC on XLayer

---

### Agent Beta: "The Analyst"

**Role:** Receives deal pitches, analyzes deeply, decides to invest or not

**Capabilities:**
- Deep analysis of pitched deals
- Cross-references with macro conditions
- Checks memory for similar past deals and outcomes
- Has configurable risk tolerance
- Explains reasoning for accept/reject
- Learns from outcomes (did accepted deals perform well?)

**Personality:** Skeptical, thorough, conservative

**Wallet:** Pre-funded with USDC on XLayer

---

## 4. Deal Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEAL LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DISCOVERY                                                    │
│     Agent Alpha scans for yield opportunities                    │
│     Sources: DeFiLlama API, protocol APIs                        │
│                                                                  │
│  2. PITCH                                                        │
│     Alpha crafts a deal pitch:                                   │
│     {                                                            │
│       protocol: "Curve",                                         │
│       pool: "USDC-USDT",                                         │
│       chain: "XLayer",                                           │
│       apy: 8.2,                                                  │
│       tvl: 2400000,                                              │
│       risk: "low",                                               │
│       audited: true,                                             │
│       pitch: "Solid stablecoin yield, battle-tested protocol"   │
│     }                                                            │
│                                                                  │
│  3. ANALYSIS                                                     │
│     Agent Beta receives pitch and analyzes:                      │
│     - Protocol reputation check                                  │
│     - APY vs market average                                      │
│     - TVL trend (growing or shrinking?)                          │
│     - Macro conditions (rate environment, market sentiment)      │
│     - Memory: similar deals in past, their outcomes              │
│                                                                  │
│  4. DECISION                                                     │
│     Beta decides:                                                │
│     - ACCEPT (with amount)                                       │
│     - COUNTER (different amount or terms)                        │
│     - REJECT (with reasoning)                                    │
│                                                                  │
│  5. EXECUTION                                                    │
│     If accepted:                                                 │
│     - Beta's wallet approves + sends funds                       │
│     - Funds deposited into yield protocol                        │
│     - TX hash recorded                                           │
│                                                                  │
│  6. MEMORY                                                       │
│     Deal stored with:                                            │
│     - All parameters                                             │
│     - Decision + reasoning                                       │
│     - Outcome (pending → later: actual returns)                  │
│                                                                  │
│  7. LEARNING                                                     │
│     Periodic analysis of deal history:                           │
│     - Which deal types performed well?                           │
│     - Which pitches got accepted?                                │
│     - Update agent strategies                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Models

### Deal
```typescript
interface Deal {
  id: string;
  timestamp: Date;
  
  // Opportunity details
  protocol: string;
  pool: string;
  chain: string;
  apy: number;
  tvl: number;
  riskLevel: 'low' | 'medium' | 'high';
  audited: boolean;
  contractAddress: string;
  
  // Pitch
  pitcherId: string;  // Agent who pitched
  pitchMessage: string;
  
  // Analysis
  receiverId: string;  // Agent who received
  analysisResult: AnalysisResult;
  
  // Decision
  decision: 'accept' | 'counter' | 'reject';
  decisionReasoning: string;
  investmentAmount?: number;
  
  // Execution
  executed: boolean;
  txHash?: string;
  
  // Outcome (filled in later)
  status: 'pending' | 'active' | 'completed' | 'failed';
  actualReturn?: number;
  actualApy?: number;
}

interface AnalysisResult {
  protocolScore: number;      // 0-100
  apyScore: number;           // vs market average
  tvlScore: number;           // size + trend
  macroScore: number;         // current conditions
  historyScore: number;       // similar deals performance
  overallScore: number;       // weighted average
  risks: string[];
  positives: string[];
}
```

### Agent Memory
```typescript
interface AgentMemory {
  agentId: string;
  
  // Deal history
  dealsPitched: Deal[];       // For pitching agent
  dealsReceived: Deal[];      // For receiving agent
  dealsAccepted: Deal[];
  dealsRejected: Deal[];
  
  // Learned patterns
  patterns: {
    // What deals does this agent accept?
    acceptancePatterns: {
      minApy: number;
      minTvl: number;
      preferredProtocols: string[];
      riskTolerance: 'low' | 'medium' | 'high';
    };
    
    // What pitches work?
    successfulPitchPatterns: {
      emphasizeApy: boolean;
      emphasizeSecurity: boolean;
      useHistoricalData: boolean;
    };
  };
  
  // Performance tracking
  performance: {
    totalInvested: number;
    totalReturns: number;
    winRate: number;  // % of deals that beat expectations
    avgApy: number;
  };
}
```

---

## 6. Claude Prompts

### Agent Alpha: Pitch Generation

```typescript
const ALPHA_PITCH_PROMPT = `You are Agent Alpha, an AI investment scout.

YOUR WALLET: {walletBalance} USDC on XLayer
YOUR GOAL: Find yield opportunities and pitch them to Agent Beta

YIELD OPPORTUNITY FOUND:
{yieldData}

AGENT BETA'S PROFILE (from memory):
- Risk tolerance: {betaRiskTolerance}
- Min APY threshold: {betaMinApy}%
- Preferred protocols: {betaPreferredProtocols}
- Recent accepts: {betaRecentAccepts}
- Recent rejects: {betaRecentRejects}

WHAT PITCHES WORKED BEFORE:
{successfulPitches}

Craft a compelling pitch for this opportunity.
Tailor it to what Beta responds to.

Respond in JSON:
{
  "pitch": "<your pitch message, 2-3 sentences>",
  "suggestedAmount": <suggested investment amount>,
  "keySellingPoints": ["...", "..."],
  "anticipatedObjections": ["...", "..."],
  "confidence": <0-100>
}`;
```

### Agent Beta: Deal Analysis

```typescript
const BETA_ANALYSIS_PROMPT = `You are Agent Beta, an AI investment analyst.

YOUR WALLET: {walletBalance} USDC on XLayer
YOUR RISK TOLERANCE: {riskTolerance}
YOUR MIN APY THRESHOLD: {minApyThreshold}%

INCOMING DEAL PITCH FROM AGENT ALPHA:
{pitchMessage}

DEAL DETAILS:
- Protocol: {protocol}
- Pool: {pool}
- Chain: {chain}
- APY: {apy}%
- TVL: ${tvl}
- Audited: {audited}
- Risk Level: {riskLevel}

MARKET CONTEXT:
- Average stablecoin yield: {avgStableYield}%
- Market sentiment: {marketSentiment}
- Recent news: {relevantNews}

YOUR MEMORY OF SIMILAR DEALS:
{similarDealsHistory}

Analyze this deal thoroughly. Consider:
1. Is the APY sustainable or too good to be true?
2. Is the protocol trustworthy?
3. How did similar deals perform in your history?
4. Does this fit your risk tolerance?
5. What's the macro environment?

Then decide: ACCEPT, COUNTER, or REJECT.

Respond in JSON:
{
  "analysis": {
    "protocolAssessment": "<1-2 sentences>",
    "apyAssessment": "<1-2 sentences>",
    "riskAssessment": "<1-2 sentences>",
    "macroAssessment": "<1-2 sentences>",
    "historyComparison": "<1-2 sentences>"
  },
  "scores": {
    "protocol": <0-100>,
    "apy": <0-100>,
    "risk": <0-100>,
    "macro": <0-100>,
    "history": <0-100>,
    "overall": <0-100>
  },
  "decision": "accept" | "counter" | "reject",
  "reasoning": "<2-3 sentences explaining decision>",
  "investmentAmount": <amount if accepting, null if rejecting>,
  "counterTerms": "<if countering, what terms>",
  "confidence": <0-100>
}`;
```

### Learning Analysis

```typescript
const LEARNING_PROMPT = `Analyze these past deals and extract patterns:

DEAL HISTORY:
{dealHistory}

OUTCOMES:
{outcomes}

Identify:
1. What types of deals performed best?
2. What types of deals underperformed?
3. What patterns predict success?
4. What should Agent Beta look for in future deals?
5. What should Agent Alpha emphasize in pitches?

Respond in JSON:
{
  "successPatterns": ["...", "..."],
  "failurePatterns": ["...", "..."],
  "recommendedThresholds": {
    "minApy": <number>,
    "minTvl": <number>,
    "preferredRisk": "low" | "medium" | "high"
  },
  "pitchingAdvice": ["...", "..."],
  "analysisAdvice": ["...", "..."],
  "keyInsight": "<most important learning>"
}`;
```

---

## 7. API Endpoints

### Backend Routes

```typescript
// Agent Management
POST   /api/agents/create          // Create new agent with wallet
GET    /api/agents/:id             // Get agent details + memory
GET    /api/agents/:id/balance     // Get wallet balance

// Deal Flow
POST   /api/deals/discover         // Agent scans for opportunities
POST   /api/deals/pitch            // Agent pitches deal to another
POST   /api/deals/analyze          // Agent analyzes received pitch
POST   /api/deals/decide           // Agent makes decision
POST   /api/deals/execute          // Execute accepted deal on-chain

// Memory & Learning
GET    /api/memory/:agentId        // Get agent's memory
GET    /api/memory/:agentId/deals  // Get deal history
POST   /api/learning/analyze       // Run learning analysis
GET    /api/learning/patterns      // Get learned patterns

// Yield Data
GET    /api/yields/opportunities   // Get current yield opps
GET    /api/yields/:protocol       // Get specific protocol data
```

---

## 8. External Integrations

### Yield Data Sources

```typescript
// DeFiLlama Yields API
const DEFILLAMA_YIELDS = 'https://yields.llama.fi/pools';

async function getYieldOpportunities(chain: string = 'X Layer') {
  const res = await fetch(DEFILLAMA_YIELDS);
  const data = await res.json();
  
  return data.data
    .filter(pool => pool.chain === chain)
    .filter(pool => pool.tvlUsd > 100000)  // Min TVL
    .map(pool => ({
      protocol: pool.project,
      pool: pool.symbol,
      chain: pool.chain,
      apy: pool.apy,
      tvl: pool.tvlUsd,
      apyBase: pool.apyBase,
      apyReward: pool.apyReward,
    }));
}
```

### OKX OnchainOS Integration

```typescript
// Wallet balance check
async function getAgentBalance(address: string) {
  const path = `/api/v5/wallet/asset/token-balances?address=${address}&chainIndex=196`;
  // ... OKX API call
}

// Execute deposit into yield protocol
async function executeDeposit(
  fromWallet: string,
  protocolAddress: string,
  amount: string
) {
  // 1. Approve token spending
  // 2. Call deposit function on protocol
  // 3. Return TX hash
}
```

---

## 9. Frontend Design

### Main Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  SMARTLAYER - Agent Deal Network                    [Connect]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │  🤖 AGENT ALPHA         │  │  🤖 AGENT BETA          │      │
│  │  Role: Deal Scout       │  │  Role: Deal Analyst     │      │
│  │  Balance: $487.50       │  │  Balance: $312.00       │      │
│  │  Deals Pitched: 12      │  │  Deals Analyzed: 12     │      │
│  │  Success Rate: 67%      │  │  Accept Rate: 42%       │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 LIVE NEGOTIATION                                     │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ALPHA: "Found a solid opportunity:                     │   │
│  │          Curve USDC pool on XLayer, 8.2% APY.           │   │
│  │          TVL is $2.4M, audited, low risk.               │   │
│  │          Want to put in $150?"                          │   │
│  │                                                          │   │
│  │  BETA:  [Analyzing...]                                  │   │
│  │         ✅ Protocol: Trusted (score: 92)                │   │
│  │         ✅ APY: Above average (score: 78)               │   │
│  │         ✅ Risk: Acceptable (score: 85)                 │   │
│  │         ⚠️  Macro: Neutral (score: 65)                  │   │
│  │                                                          │   │
│  │  BETA:  "Analysis complete. Overall score: 81/100.      │   │
│  │          This beats my threshold. I'll invest $120."    │   │
│  │                                                          │   │
│  │  [EXECUTING DEAL...]                                    │   │
│  │  ✅ TX: 0x1234...abcd                                   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 LEARNING INSIGHTS                                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  PATTERNS DETECTED:                                     │   │
│  │  • Beta accepts 85% of deals with APY > 7% + audited   │   │
│  │  • Beta rejects 90% of deals with TVL < $500k          │   │
│  │  • Deals mentioning "battle-tested" have 2x accept rate│   │
│  │                                                          │   │
│  │  PERFORMANCE:                                           │   │
│  │  • Accepted deals avg return: +7.2% APY                │   │
│  │  • Rejected deals would have returned: +3.1% APY       │   │
│  │  • Beta's selectivity is working ✅                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [🔄 New Deal Round]  [📜 View History]  [⚙️ Settings]         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. File Structure

```
smartlayer/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── agents/
│   │   │   ├── alpha.ts           # Deal scout agent
│   │   │   ├── beta.ts            # Deal analyst agent
│   │   │   └── base.ts            # Base agent class
│   │   ├── deals/
│   │   │   ├── discovery.ts       # Find yield opportunities
│   │   │   ├── pitch.ts           # Generate pitches
│   │   │   ├── analysis.ts        # Analyze deals
│   │   │   └── execution.ts       # Execute on-chain
│   │   ├── memory/
│   │   │   ├── store.ts           # Memory storage
│   │   │   ├── patterns.ts        # Pattern extraction
│   │   │   └── learning.ts        # Learning engine
│   │   ├── services/
│   │   │   ├── claude.ts          # Claude API
│   │   │   ├── okx.ts             # OKX OnchainOS
│   │   │   ├── defillama.ts       # Yield data
│   │   │   └── market.ts          # Market/macro data
│   │   ├── routes/
│   │   │   ├── agents.ts
│   │   │   ├── deals.ts
│   │   │   └── learning.ts
│   │   └── utils/
│   │       ├── prompts.ts         # All Claude prompts
│   │       └── constants.ts
│   ├── data/
│   │   └── memory.json            # Simple file-based memory
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── DealAnalysis.tsx
│   │   │   ├── LearningPanel.tsx
│   │   │   └── ExecutionStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useAgents.ts
│   │   │   ├── useDeals.ts
│   │   │   └── useWebSocket.ts
│   │   └── services/
│   │       └── api.ts
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

---

## 11. Build Timeline

### Day 1 (March 23): Core Agents

**Morning:**
- [ ] Project setup (backend + frontend scaffolds)
- [ ] Agent base class with wallet integration
- [ ] OKX OnchainOS connection
- [ ] DeFiLlama yield data integration

**Afternoon:**
- [ ] Agent Alpha: pitch generation logic
- [ ] Agent Beta: analysis logic
- [ ] Claude prompt integration
- [ ] Test agents talking to each other

**Evening:**
- [ ] Basic deal flow: pitch → analyze → decide
- [ ] Simple memory storage (JSON file)
- [ ] Test full flow with mock data

### Day 2 (March 24): Memory + Execution

**Morning:**
- [ ] Memory system: store deals with outcomes
- [ ] Pattern extraction from deal history
- [ ] Learning prompts: what worked, what didn't

**Afternoon:**
- [ ] On-chain execution via OKX DEX
- [ ] Test real swap on XLayer testnet
- [ ] Wire memory → agent context (agents use history)

**Evening:**
- [ ] Frontend: agent cards + chat window
- [ ] Frontend: deal analysis display
- [ ] Frontend: learning insights panel

### Day 3 (March 25): Polish + Submit

**Morning:**
- [ ] Execute 1 real deal on XLayer mainnet
- [ ] Get TX hash for submission
- [ ] Bug fixes from testing

**Afternoon:**
- [ ] Polish UI (loading states, animations)
- [ ] Record demo video (Loom)
- [ ] Create project X account + post

**Evening:**
- [ ] Write README
- [ ] Final code cleanup
- [ ] Submit form before deadline

---

## 12. MVP Simplifications

To ship in 3 days, we simplify:

| Full Version | MVP Version |
|--------------|-------------|
| Multiple agents | 2 agents (Alpha + Beta) |
| Complex yield protocols | Simple swap (USDC → yield token) |
| Real yield deposit | Swap as proof of execution |
| Sophisticated learning | Basic pattern detection |
| Multiple negotiation rounds | Single pitch → decision flow |
| Real-time yield tracking | Static APY from DeFiLlama |

---

## 13. Submission Checklist

| Requirement | How We Meet It |
|-------------|----------------|
| Project Name | SmartLayer |
| Track | AI DeFi |
| GitHub (public) | Full source code |
| X Layer TX Hash | Real deal execution on mainnet |
| Demo video | Screen recording of agent negotiation |
| Project X post | Demo + explanation thread |
| OnchainOS APIs | Wallet API, Trade API, Market API |
| AI Model | Claude Sonnet 4 |
| Prompt Design | Multi-agent negotiation + learning |

---

## 14. Key Addresses (XLayer Mainnet)

| Token | Address |
|-------|---------|
| USDC | 0x74b7f16337b8972027f6196a17a631ac6de26d22 |
| WETH | 0x5a77f1443d16ee5761d310e38b62f77f726bc71c |
| WOKB | 0xe538905cf8410324e03a5a23c1c177a474d59b2b |

---

## 15. Environment Variables

```bash
# backend/.env

# AI
ANTHROPIC_API_KEY=sk-ant-...

# OKX OnchainOS
OKX_API_KEY=your-key
OKX_SECRET_KEY=your-secret
OKX_PASSPHRASE=your-passphrase

# Agent Wallets (use separate wallets for demo)
AGENT_ALPHA_PRIVATE_KEY=0x...
AGENT_BETA_PRIVATE_KEY=0x...

# Chain
XLAYER_RPC=https://rpc.xlayer.tech
XLAYER_CHAIN_ID=196

# Data
DEFILLAMA_API=https://yields.llama.fi
```

---

## 16. Demo Script

```
[INTRO - 20 sec]
"What if AI agents could pitch investment deals to each other,
analyze them intelligently, and learn from every decision?
This is SmartLayer."

[SHOW AGENTS - 20 sec]
"Meet Agent Alpha, the deal scout with $500.
And Agent Beta, the analyst with $300.
Both have their own wallets on XLayer."

[DISCOVERY - 20 sec]
"Alpha just found a yield opportunity:
Curve USDC pool, 8.2% APY, $2.4M TVL.
Watch it pitch to Beta."

[PITCH + ANALYSIS - 60 sec]
"Alpha: 'Found a solid deal for you...'
Beta analyzes: protocol trust, APY vs market, 
macro conditions, and past deal history.
Score: 81/100. Above threshold."

[DECISION - 20 sec]
"Beta accepts and invests $120.
Watch the deal execute on XLayer..."

[EXECUTION - 20 sec]
"Transaction confirmed. TX hash on screen.
The deal is now active."

[LEARNING - 20 sec]
"SmartLayer remembers everything.
It's learning that Beta likes high-APY audited protocols.
Next time, Alpha will pitch smarter."

[CLOSE - 20 sec]
"SmartLayer: AI agents that find, pitch, analyze, 
and invest. Autonomously. The future of DeFi."
```

---

## 17. Why This Wins

| Criteria | How SmartLayer Delivers |
|----------|------------------------|
| **Innovation** | Agent-to-agent deal negotiation is novel |
| **Technical** | Memory + learning + on-chain execution |
| **Narrative** | "Autonomous fund managers" is VC-bait |
| **Demo** | Chat between agents is compelling |
| **XLayer** | Real TX on mainnet |
| **OnchainOS** | Uses Wallet, Trade, Market APIs |
| **AI Depth** | Multi-prompt system with learning |

---

*SmartLayer v2 | Agent Deal Network | XLayer Hackathon March 2026*
