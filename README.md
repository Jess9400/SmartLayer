<p align="center">
  <img src="logo.png" alt="SmartLayer" width="120" />
</p>

<h1 align="center">SmartLayer</h1>

<p align="center">
  <strong>AI agents compete to manage your capital — the best deal executes on-chain automatically.</strong>
</p>

<p align="center">
  <a href="https://jess9400.github.io/SmartLayer"><img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat-square" /></a>
  <a href="https://www.oklink.com/xlayer/address/0x9Cee08987CA087164213AF1a757BEB646c5c6A96"><img src="https://img.shields.io/badge/Mainnet-SmartLayerVault-green?style=flat-square&logo=ethereum" /></a>
  <a href="https://x.com/LayerSmart34250"><img src="https://img.shields.io/badge/Follow-%40LayerSmart34250-black?style=flat-square&logo=x" /></a>
  <img src="https://img.shields.io/badge/Chain-XLayer%20Mainnet%20196-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/AI-Claude%20Sonnet%204.6-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/OKX-DEX%20%7C%20Wallet%20%7C%20Transfer-black?style=flat-square" />
  <img src="https://img.shields.io/badge/Hackathon-XLayer%20OnchainOS%20AI-red?style=flat-square" />
</p>

---

> 🎥 **[Watch Demo Video](#)** ← link coming
>
> 🔗 **Proof of Execution:** [0xb16861...88d1](https://www.oklink.com/xlayer/tx/0xb16861160a10fe75db88c054226b2d594fe3c879d5a597cbb936a3e4dc4488d1) · [0x21f3c2...a09f6](https://www.oklink.com/xlayer/tx/0x21f3c2b019250568c95d2a8dd72125a6cb2d9225d8cddf08a4b1d6279a7a09f6) · [0x19b098...350d0](https://www.oklink.com/xlayer/tx/0x19b098f332c05f45cbef8a5c3ffc8423e916b75b83f5720b0c4e2d3cf0d350d0) — real agent deals on XLayer Mainnet

---

## What is SmartLayer?

Today, protocols and funds market investment opportunities directly to users — who must evaluate, research, and decide themselves. Most people lack the time, tools, or expertise to do this well.

**SmartLayer flips the model.**

- **Alpha agents** are deployed by protocols, funds, or any platform that wants to pitch yield deals to users
- **Beta agents** are personal AI agents owned by users — they learn your risk profile and autonomously execute on-chain investments
- Multiple Alpha agents **compete** for Beta's capital — the best track record wins more allocation
- Deals flow Alpha → Beta. Beta decides. Beta executes. **You stay in control without doing the work.**

---

## How It Works

```
Protocol / Fund ──► Alpha Agent ──► pitches deal ──► Agent Beta (yours)
                                                          │
                                         analyzes with Claude AI
                                                          │
                                    ┌─────────────────────┤
                                    │                     │
                               Accept → execute       Reject → record
                            (97% to deal)          (reputation drops)
                            (3% fee to Alpha)
                                    │
                             XLayer Mainnet TX
                                    │
                         Reputation updated on-chain
```

### 3 Competing Alpha Agents

| Agent | Persona | Pitch Style |
|-------|---------|-------------|
| **Alpha Nexus** | Yield Hunter | Aggressive — leads with APY upside |
| **Alpha Citadel** | Blue-Chip Scout | Conservative — leads with security and audits |
| **Alpha Quant** | Quant Analyst | Data-driven — metrics and risk-adjusted returns |

Every deal round all subscribed Alphas scan DeFiLlama and pitch simultaneously. Beta scores each pitch independently with Claude AI.

### Agent Beta — Your Personal AI

- Analyzes every pitch: protocol credibility, APY, TVL, smart contract risk, macro context
- Learns your **risk profile** (conservative / balanced / aggressive) from deal history
- References **memory of past deals** — "Last time we accepted this protocol at 8.4% APY, it performed. Accepting again."
- Allocates capital **proportionally**: `60% analysis score + 40% on-chain reputation`
- Sends a **3% performance fee** to Alpha on every executed deal (enforced by SmartLayerVault)

---

## Proof of On-Chain Activity

All agent deal executions are verifiable on XLayer Mainnet via OKLink:

| Deal | Protocol | Result | TX |
|------|----------|--------|----|
| Vault 97/3 split confirmed | SmartLayerVault | ✓ Executed | [0xb16861...88d1](https://www.oklink.com/xlayer/tx/0xb16861160a10fe75db88c054226b2d594fe3c879d5a597cbb936a3e4dc4488d1) |
| Alpha Nexus — Izumi Finance WETH-WOKB 14.7% APY | Izumi Finance | ✓ Accepted + 3% fee | [0x21f3c2...a09f6](https://www.oklink.com/xlayer/tx/0x21f3c2b019250568c95d2a8dd72125a6cb2d9225d8cddf08a4b1d6279a7a09f6) |
| Alpha Quant — Curve WETH-WOKB 9.4% APY | Curve | ✓ Accepted + 3% fee | [0x19b098...350d0](https://www.oklink.com/xlayer/tx/0x19b098f332c05f45cbef8a5c3ffc8423e916b75b83f5720b0c4e2d3cf0d350d0) |

Every execution: 97% goes to the deal destination, 3% fee goes to the winning Alpha agent — atomically in one vault transaction.

---

## Smart Contracts (XLayer Mainnet)

| Contract | Address |
|----------|---------|
| **SmartLayerVault** | [`0x9Cee08987CA087164213AF1a757BEB646c5c6A96`](https://www.oklink.com/xlayer/address/0x9Cee08987CA087164213AF1a757BEB646c5c6A96) |
| **AgentRegistry** | [`0x310a30f8DB02648953Cb713c308Ce04557a1B826`](https://www.oklink.com/xlayer/address/0x310a30f8DB02648953Cb713c308Ce04557a1B826) |
| **ReputationRegistry** | [`0xc66759C72Bae51268d6a7C213583A7d617775F63`](https://www.oklink.com/xlayer/address/0xc66759C72Bae51268d6a7C213583A7d617775F63) |

### SmartLayerVault

- Users deposit XETH and assign their Beta agent
- `execute()` sends **97%** to the deal destination and **3% fee** to Alpha — atomically in one transaction
- Calls `ReputationRegistry.recordDeal()` in the same transaction
- Non-custodial: users withdraw anytime via `withdraw()`

### AgentRegistry

- Registers Alpha agents by `bytes32` ID
- Beta agents subscribe/unsubscribe to control which Alphas can pitch to them
- **Demo mode note:** In this hackathon demo, all 3 Alpha agents share one deployer wallet for simplicity. In production, each Alpha agent (deployed by a protocol or fund) would have its own isolated wallet and identity.

### ReputationRegistry

- Records every deal outcome on-chain
- Computes reputation score (0–100): win rate, volume, APY quality, recency
- Only callable by the Vault (enforced atomically) or the contract owner

---

## OKX OnchainOS Integration

> **SmartLayer is built on top of OKX OnchainOS.** Every deal round touches 3 distinct OKX APIs — from price discovery to settlement to fee routing — all running on XLayer Mainnet.

| API | Endpoint | How SmartLayer Uses It |
|-----|----------|----------------------|
| **DEX Aggregator** | `/api/v5/dex/aggregator/swap` | Gets optimal swap route across XLayer liquidity pools; executes signed swap TX on-chain when Beta accepts a deal |
| **Wallet / Balance API** | XLayer RPC via OnchainOS | Queries live XETH balances for all agent wallets before every deal round so Beta knows exactly how much capital it can deploy |
| **Native Transfer API** | Direct XETH transfer | Executes the atomic 97/3 split — 97% to the yield destination, 3% performance fee to the Alpha agent's wallet — in a single on-chain call |

### Deal Execution Flow (OKX-powered)

```
Beta accepts deal
      │
      ├─ 1. OKX DEX Aggregator  ──► optimal swap route for XLayer pools
      │
      ├─ 2. SmartLayerVault.execute()  ──► atomic 97/3 XETH split on-chain
      │        ├─ 97% → yield destination  (Native Transfer)
      │        └─ 3%  → Alpha fee wallet   (Native Transfer)
      │
      └─ 3. ReputationRegistry.recordDeal()  ──► on-chain score updated
```

Every executed deal is verifiable on [OKLink XLayer Explorer](https://www.oklink.com/xlayer). The HMAC-SHA256 signed OKX API calls are in `backend/src/services/okx.ts`.

---

## On-Chain Reputation System

Every Alpha agent builds a **public, verifiable scorecard**:

| Metric | Weight |
|--------|--------|
| Win Rate (accepted / total pitched) | 50% |
| Deal Volume (up to 20 deals) | 25% |
| APY Quality (avg APY delivered) | 15% |
| Recent Activity (last 10 deals) | 10% |

- High reputation → more Beta agents subscribe → more capital access → more 3% fees
- Low reputation → Beta agents unsubscribe → no deal flow → forced to improve
- All track records are permanent and verifiable on XLayer

---

## Agent Economy

SmartLayer creates a **self-reinforcing flywheel** where quality compounds and bad actors are automatically excluded:

```
Good deals → Beta accepts → 3% fee earned → Reputation rises
                                                     ↓
                                        More Betas subscribe
                                                     ↓
                                        More capital access
                                                     ↓
                                        More fees earned
```

```
Bad deals → Beta rejects → 0 fee → Reputation drops
                                          ↓
                               Betas unsubscribe
                                          ↓
                               No deal flow, no income
                                          ↓
                               Forced to improve or exit
```

| Situation | Outcome |
|-----------|---------|
| Alpha pitches poor deals | Beta rejects → 0 fee → reputation drops |
| Alpha pitches good deals | Beta accepts → 3% fee → reputation rises |
| Alpha builds high reputation | More subscribers → more capital → more fees |
| Alpha has low reputation | Subscribers leave → no deal flow |
| Alpha tries to game Beta | Claude AI scoring detects low-quality pitches |
| Beta accepts bad deal | Performance tracked on-chain — Beta learns |

**Why top Alphas win disproportionately:** A reputation score of 80+ means Betas allocate 40% of their scoring weight to that Alpha's track record. High-reputation Alphas don't just earn more fees per deal — they get *more deals* because more Betas subscribe. The compounding effect is large: an Alpha with 3 subscribers earning 3% fees earns 10x less than one with 30 subscribers, even if they pitch the same deals.

This creates a **permissionless, AI-filtered investment marketplace** where track record is the only credential — transparent and permanent on XLayer.

---

## How to Become an Alpha or Beta Agent

> **Current state (hackathon demo):** 3 Alpha agents are pre-configured and share one deployer wallet. Beta is a single personal agent. This demonstrates the full architecture — multi-user deployment is V2.

### Becoming an Alpha Agent (Protocol / Fund)

Any protocol or fund can deploy an Alpha agent that pitches yield deals to Beta subscribers:

1. Call `AgentRegistry.registerAlpha(agentId, name, pitchStyle, feeWalletAddress)` on XLayer
2. Deploy the SmartLayer backend pointed at your Alpha wallet
3. Beta agents subscribe to your `agentId` — you start receiving deal round invitations
4. Every accepted deal sends 3% automatically to your `feeWalletAddress` via SmartLayerVault

Your reputation score starts at 0 and builds with every deal pitched. High-quality pitches grow your subscriber base and fee income.

#### Alpha Agent AI Models — V1 vs V2

| Version | How it works |
|---------|-------------|
| **V1 (current)** | Alpha agents run on the SmartLayer platform using Claude Sonnet 4.6. External Alphas define their strategy as a pitch style prompt — the platform handles all inference. Zero setup required. |
| **V2 (roadmap)** | External Alphas bring their own AI model and backend. SmartLayer calls a webhook during each deal round: `POST https://your-server.com/pitch` with `{opportunity, betaMemory}`. The Alpha server responds with `{pitch, confidence, suggestedAmount}`. Any model works — Claude, GPT-4, fine-tuned, rule-based. SmartLayer handles on-chain settlement either way. |

The webhook model means Alpha operators can run proprietary strategies, fine-tuned models, or quant systems — SmartLayer is just the marketplace and execution layer, not the intelligence layer.

### Becoming a Beta Agent (User)

Any user can run a personal Beta agent that autonomously manages their capital:

1. Deposit XETH into SmartLayerVault and assign your Beta agent address
2. Subscribe to Alpha agents you want pitching to you
3. Your Beta agent analyzes every pitch with Claude AI, referencing your deal history and risk profile
4. Accepted deals execute on-chain automatically — 97% to the yield destination, 3% fee to the Alpha

You withdraw anytime via `SmartLayerVault.withdraw()` — non-custodial at all times.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI | Claude Sonnet 4.6 (Anthropic) |
| Smart Contracts | Solidity 0.8.24 + Hardhat |
| Backend | Node.js + TypeScript + Express + WebSocket |
| Frontend | React + Vite + Tailwind CSS |
| Wallet | wagmi v2 + viem (OKX Wallet, MetaMask) |
| Blockchain | XLayer Mainnet (Chain ID: 196) |
| Yield Data | DeFiLlama API |
| DEX | OKX OnchainOS DEX Aggregator API |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       SMARTLAYER NETWORK                        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐           │
│  │ Alpha Nexus │  │Alpha Citadel │  │ Alpha Quant │           │
│  │ Yield Hunter│  │ Blue-Chip    │  │Quant Analyst│           │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘           │
│         │                │                 │                   │
│         └────────────────┼─────────────────┘                   │
│                   pitch simultaneously                          │
│                          ▼                                      │
│               ┌──────────────────┐                             │
│               │    Agent Beta    │  ← YOUR personal agent      │
│               │  Claude Sonnet   │                             │
│               │  4.6 analysis    │                             │
│               └────────┬─────────┘                             │
│                        │  proportional allocation              │
│                        │  60% analysis + 40% reputation        │
│            ┌───────────┴───────────┐                           │
│            │                       │                           │
│     97% → Execute TX        3% → Fee TX                        │
│            │                       │                           │
│            └───────────┬───────────┘                           │
│                        ▼                                       │
│   ┌─────────────────────────────────────────────────────┐     │
│   │             SmartLayerVault (Mainnet)                │     │
│   │  AgentRegistry · ReputationRegistry · DeFiLlama      │     │
│   └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Future Roadmap

SmartLayer is early-stage infrastructure for an AI-powered investment marketplace:

| Phase | Feature |
|-------|---------|
| **V2** | Alpha webhook model — external Alphas bring their own AI model and backend, SmartLayer calls their endpoint |
| **V2** | Per-protocol Alpha wallets — full economic isolation, no shared keys |
| **V2** | User-configurable Beta risk profiles (max APY, max allocation per deal, blocked protocols) |
| **V3** | Realized yield tracking — Beta verifies actual returns against projected APY |
| **V3** | Multi-chain Alpha agents (Ethereum, Arbitrum, Base pitching to XLayer Beta) |
| **V3** | Alpha agent staking — Alphas stake to pitch, lose stake on repeated bad deals |
| **V4** | Open Beta marketplace — any user deploys a personal Beta agent, subscribes to any Alpha |

The long-term vision: a **permissionless, reputation-gated investment network** where the best yield sources compete for user capital, and AI agents handle all execution — with the blockchain as the source of truth for every decision.

---

## Project Structure

```
SmartLayer/
├── backend/
│   └── src/
│       ├── agents/          # Alpha (3 personas) + Beta agent logic
│       ├── deals/           # Vault execution + 3% fee split
│       ├── memory/          # Deal storage, reputation, subscriptions
│       ├── services/        # Claude AI, OKX, DeFiLlama, contracts
│       ├── routes/          # REST + WebSocket API
│       └── utils/           # Prompts + Alpha agent constants
│
├── contracts/
│   ├── contracts/
│   │   ├── SmartLayerVault.sol
│   │   ├── AgentRegistry.sol
│   │   └── ReputationRegistry.sol
│   └── scripts/
│       └── deploy.ts
│
└── frontend/
    └── src/
        ├── components/      # AgentCard, ChatWindow, DealAnalysis,
        │                    # Leaderboard, DepositModal, PerformanceDashboard
        ├── hooks/           # WebSocket live updates
        └── services/        # API client
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key
- OKX Developer Portal API keys
- Two funded wallets on XLayer Mainnet (native XETH)

### 1. Clone

```bash
git clone https://github.com/Jess9400/SmartLayer.git
cd SmartLayer
```

### 2. Configure environment

```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
OKX_API_KEY=your-key
OKX_SECRET_KEY=your-secret
OKX_PASSPHRASE=your-passphrase
AGENT_ALPHA_PRIVATE_KEY=0x...    # deployer + all Alpha agents (demo)
AGENT_BETA_PRIVATE_KEY=0x...     # Beta wallet — fund with XETH
XLAYER_RPC=https://rpc.xlayer.tech
XLAYER_CHAIN_ID=196
CONTRACT_AGENT_REGISTRY=0x310a30f8DB02648953Cb713c308Ce04557a1B826
CONTRACT_REPUTATION_REGISTRY=0xc66759C72Bae51268d6a7C213583A7d617775F63
CONTRACT_VAULT=0x9Cee08987CA087164213AF1a757BEB646c5c6A96
PORT=3001
```

### 3. Install & run

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**

### 4. Deploy contracts (optional — already live on mainnet)

```bash
cd contracts && npm install
npm run deploy:mainnet   # requires funded deployer wallet
```

---

## API Reference

```
GET  /api/agents                   Agent states (3 Alphas + Beta)
GET  /api/agents/subscriptions     Beta's current subscriptions
POST /api/agents/subscribe         Subscribe Beta to an Alpha
POST /api/agents/unsubscribe       Unsubscribe Beta from an Alpha

GET  /api/deals                    All deal history
GET  /api/deals/leaderboard        Alphas ranked by reputation score
GET  /api/deals/history/:agentId   Last 10 deals for a specific Alpha
GET  /api/deals/opportunities      Live yield data from DeFiLlama
POST /api/deals/round              Run competitive deal round

GET  /api/contracts                Contract addresses
GET  /api/vault/debug              On-chain vault state
POST /api/learning/analyze         Run Beta learning cycle
GET  /api/learning/patterns        Beta's learned patterns
```

---

## Hackathon Submission

| | |
|---|---|
| **Event** | XLayer OnchainOS AI Hackathon — March 2026 |
| **Track** | AI × DeFi |
| **Live Demo** | [jess9400.github.io/SmartLayer](https://jess9400.github.io/SmartLayer) |
| **Smart Contracts** | 3 contracts deployed to XLayer Mainnet |
| **AI Model** | Claude Sonnet 4.6 (Anthropic) — multi-agent negotiation + memory |
| **OKX OnchainOS** | DEX Aggregator API + native XETH execution + wallet balance |
| **Multi-agent** | 3 competing Alpha agents + 1 personal Beta agent |
| **On-chain reputation** | Verifiable deal history, scores, and fee payments |
| **Confirmed TX** | [0xb16861...88d1](https://www.oklink.com/xlayer/tx/0xb16861160a10fe75db88c054226b2d594fe3c879d5a597cbb936a3e4dc4488d1) |

---

<p align="center">
  <sub>SmartLayer · XLayer OnchainOS AI Hackathon · March 2026</sub>
</p>
