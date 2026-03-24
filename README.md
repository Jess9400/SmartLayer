<p align="center">
  <img src="logo.png" alt="SmartLayer" width="120" />
</p>

<h1 align="center">SmartLayer</h1>

<p align="center">
  <strong>AI agents compete to manage your capital — the best deal executes on-chain automatically.</strong>
</p>

<p align="center">
  <a href="https://s-layer.online"><img src="https://img.shields.io/badge/Live%20Demo-s--layer.online-blue?style=flat-square" /></a>
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
> 🐦 **[X Post](https://x.com/LayerSmart34250/status/2036383616553591092)** — official launch post
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
- **Goal-aware decision making** — set a target (e.g. 0.1 XETH in 6 months) and Beta calibrates deal selection to match the required APY
- **Deploys from user vault** — when your connected wallet has a vault balance, Beta uses it directly; falls back to demo wallet if no user deposit is present
- **One-click withdrawal** — withdraw USDC from ZeroLend positions back to your wallet at any time from the Active Deals panel

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

> **Capital routing:** When a user has deposited XETH into the vault, Beta automatically deploys from the user's vault balance (not its own demo wallet). The user's connected wallet address is resolved at round start — if it carries a vault balance, that balance funds the deal round and the budget is capped to 40% of the deposit. If no user deposit is present, Beta falls back to its own pre-funded demo wallet so deal rounds always work out-of-the-box.

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
      ├─ 1. SmartLayerVault.execute()  ──► atomic 97/3 XETH split on-chain
      │        ├─ 97% → Capital Router
      │        └─ 3%  → Alpha fee wallet  (Native Transfer)
      │
      ├─ 2. Capital Router
      │        ├─ OKX DEX Aggregator  ──► swap XETH → USDC (optimal route)
      │        └─ Protocol Adapter    ──► deposit USDC into yield protocol
      │
      ├─ 3. ZeroLend supply()  ──► USDC earning yield on XLayer Mainnet
      │
      └─ 4. ReputationRegistry.recordDeal()  ──► on-chain score updated
```

| API | Endpoint | Usage |
|-----|----------|-------|
| **DEX Aggregator v6** | `/api/v6/dex/aggregator/swap` | Swaps XETH → USDC after every accepted deal; HMAC-SHA256 signed |
| **Wallet / Balance** | XLayer RPC via OnchainOS | Live XETH balance queries before every deal round |
| **Native Transfer** | Direct XETH | Atomic 97/3 split in SmartLayerVault |

Every executed deal is verifiable on [OKLink XLayer Explorer](https://www.oklink.com/xlayer). The signed OKX API calls are in `backend/src/services/okx.ts`.

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

1. Connect your wallet (OKX Wallet or MetaMask) on the live app
2. Deposit XETH into SmartLayerVault — Beta will deploy from your balance automatically
3. **Set your investment goal** — target amount + timeline + risk tolerance (e.g. "0.5 XETH in 12 months, moderate risk")
4. Click **Run Deal Round** — Beta analyzes every Alpha pitch with Claude AI, calibrating to your required APY
5. Accepted deals execute on-chain automatically — 97% to the yield destination, 3% fee to the Alpha
6. Monitor active positions and **withdraw anytime** from the Active Deals panel (one click → ZeroLend withdrawal TX)

Your capital is non-custodial at all times — you can withdraw from `SmartLayerVault` or individual yield positions independently.

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
│            │                                                   │
│     Capital Router                                             │
│            ├─ OKX DEX  ──► XETH → USDC                        │
│            └─ AdapterRegistry                                  │
│                   └─ ZeroLendAdapter ──► supply() on-chain     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  SmartLayerVault · AgentRegistry · ReputationRegistry│      │
│  │  Position Manager · Rebalancer (30 min interval)     │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Autonomous Yield Infrastructure

SmartLayer implements a full protocol-agnostic yield routing stack:

```
Capital Router
      │
      ├─ AdapterRegistry  ──► maps protocol name → adapter at runtime
      │       ├─ ZeroLendAdapter  (live — USDC lending on XLayer)
      │       ├─ IzumiAdapter     (stub — falls back to ZeroLend)
      │       └─ [NewProtocol]    ──► add 1 file to support any future protocol
      │
      ├─ Position Manager  ──► persists open positions, reads aToken balance on-chain
      │
      └─ Rebalancer Agent  ──► runs every 30 min, exits positions if APY drops >40%
                                 or falls below 1%, then triggers a new deal round
```

**Adding a new protocol** when it launches on XLayer is one file:

```typescript
// adapters/AaveAdapter.ts — implement IYieldAdapter (deposit, withdraw, getBalance, getAPY)
registry.set('aave', new AaveAdapter()); // AdapterRegistry.ts — one line
```

The router, rebalancer, position manager, and execution flow all pick it up automatically.

---

## Future Roadmap

SmartLayer is early-stage infrastructure for an AI-powered investment marketplace:

| Phase | Feature |
|-------|---------|
| **V2** | Additional protocol adapters as XLayer DeFi ecosystem grows (Aave, Compound, new DEX LPs) |
| **V2** | Alpha webhook model — external Alphas bring their own AI model; SmartLayer calls their endpoint |
| **V2** | Per-protocol Alpha wallets — full economic isolation, no shared keys |
| **V2** | User-configurable Beta risk profiles (max APY, max allocation per deal, blocked protocols) |
| **V2** | Goal progress notifications — Beta proactively alerts when projected yield falls behind target |
| **V3** | Realized yield tracking — Beta verifies actual returns against projected APY on-chain |
| **V3** | Multi-chain support — Alphas on Ethereum, Arbitrum, Base pitching to XLayer Beta |
| **V3** | Alpha agent staking — Alphas stake to pitch, lose stake on repeated rejected deals |
| **V4** | Open Beta marketplace — any user deploys a personal Beta agent, subscribes to any Alpha |

The long-term vision: a **permissionless, reputation-gated investment network** where the best yield sources compete for user capital, and AI agents handle all execution — with the blockchain as the source of truth for every decision.

---

## Project Structure

```
SmartLayer/
├── backend/
│   └── src/
│       ├── adapters/        # IYieldAdapter + ZeroLendAdapter + IzumiAdapter + registry
│       ├── agents/          # Alpha (3 personas) + Beta + RebalancerAgent
│       ├── deals/           # Vault execution + capital router + 3% fee split
│       ├── memory/          # Deal store, position manager, learning, subscriptions
│       ├── services/        # Claude AI, OKX DEX, DeFiLlama, contracts, router
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
        ├── components/      # AgentCard, ChatWindow, DealAnalysis, Leaderboard,
        │                    # DepositModal, PerformanceDashboard, GoalModal,
        │                    # LearningPanel, Icons
        ├── hooks/           # WebSocket live updates
        └── services/        # API client (deals, positions, vault, learning)
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

### 5. Production deployment (Railway)

```bash
cd backend
railway up
```

The backend is deployed on Railway with a **persistent volume** mounted at `/app/data` — positions and agent memory survive redeployments. Use `.railwayignore` to prevent local data files from being uploaded.

> **Note:** On first deploy, run a deal round to populate positions. The Railway Volume ensures they persist across all future deploys.

---

## API Reference

```
GET  /api/agents                        Agent states (3 Alphas + Beta)
GET  /api/agents/subscriptions          Beta's current subscriptions
POST /api/agents/subscribe              Subscribe Beta to an Alpha
POST /api/agents/unsubscribe            Unsubscribe Beta from an Alpha

GET  /api/deals                         All deal history
GET  /api/deals/leaderboard             Alphas ranked by on-chain reputation score
GET  /api/deals/history/:agentId        Last 10 deals for a specific Alpha
GET  /api/deals/opportunities           Live yield data from DeFiLlama
POST /api/deals/round                   Run competitive deal round
                                        Body: { userAddress?, userGoal? }

GET  /api/positions                     All yield positions (active + closed)
GET  /api/positions/active              Active positions only
POST /api/positions/sync                Refresh APY + on-chain balances
POST /api/positions/:id/withdraw        Withdraw full balance from a yield position

GET  /api/rebalancer/status             Rebalancer running state + last check time
POST /api/rebalancer/check              Trigger manual rebalance check

GET  /api/vault/balance                 Beta vault balance
GET  /api/vault/balance?address=0x...   Any wallet's vault balance
GET  /api/vault/stats                   Aggregate on-chain stats (totalPitched, capitalDeployed, avgAPY)
GET  /api/vault/debug                   Full on-chain vault state

POST /api/memory/reset                  Clear Beta's deal memory (starts fresh)
POST /api/learning/analyze              Run Beta learning cycle
GET  /api/learning/patterns             Beta's learned patterns
```

---

## Hackathon Submission

| | |
|---|---|
| **Event** | XLayer OnchainOS AI Hackathon — March 2026 |
| **Track** | AI × DeFi |
| **Live Demo** | [s-layer.online](https://s-layer.online) |
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
