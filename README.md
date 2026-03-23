<p align="center">
  <img src="logo.png" alt="SmartLayer" width="120" />
</p>

<h1 align="center">SmartLayer</h1>

<p align="center">
  <strong>Your personal AI investment agent — on XLayer</strong>
</p>

<p align="center">
  <a href="https://jess9400.github.io/SmartLayer"><img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat-square" /></a>
  <a href="https://www.oklink.com/xlayer/address/0x9Cee08987CA087164213AF1a757BEB646c5c6A96"><img src="https://img.shields.io/badge/Mainnet-SmartLayerVault-green?style=flat-square&logo=ethereum" /></a>
  <img src="https://img.shields.io/badge/Chain-XLayer%20Mainnet%20196-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/AI-Claude%20Sonnet%204.6-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/Hackathon-XLayer%20OnchainOS%20AI-red?style=flat-square" />
</p>

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
- Allocates capital **proportionally**: `60% analysis score + 40% on-chain reputation`
- Sends a **3% performance fee** to Alpha on every executed deal (enforced by SmartLayerVault)

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

- Registers Alpha agents by `bytes32` ID — multiple agents can share a wallet in demo mode
- Beta agents subscribe/unsubscribe to control which Alphas can pitch to them

### ReputationRegistry

- Records every deal outcome on-chain
- Computes reputation score (0–100): win rate, volume, APY quality, recency
- Only callable by the Vault (enforced atomically) or the contract owner

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

| Situation | Outcome |
|-----------|---------|
| Alpha pitches poor deals | Beta rejects → 0 fee → reputation drops |
| Alpha pitches good deals | Beta accepts → 3% fee → reputation rises |
| Alpha builds high reputation | More subscribers → more capital → more fees |
| Alpha has low reputation | Subscribers leave → no access |

This creates a **permissionless, AI-filtered investment marketplace** where track record is the only credential — transparent and permanent on XLayer.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI | Claude Sonnet 4.6 (Anthropic) |
| Smart Contracts | Solidity 0.8.24 + Hardhat |
| Backend | Node.js + TypeScript + Express + WebSocket |
| Frontend | React + Vite + Tailwind CSS |
| Wallet Connect | RainbowKit + wagmi v2 + viem |
| Blockchain | XLayer Mainnet (Chain ID: 196) |
| Yield Data | DeFiLlama API |
| DEX | OKX OnchainOS DEX API |

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
        │                    # Leaderboard, DepositModal
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
| **AI Model** | Claude Sonnet 4.6 (Anthropic) — multi-agent negotiation |
| **OKX OnchainOS** | DEX API + native XETH execution |
| **Multi-agent** | 3 Alpha agents competing + 1 Beta agent |
| **On-chain reputation** | Verifiable deal history, scores, and fee payments |

---

<p align="center">
  <sub>SmartLayer · XLayer OnchainOS AI Hackathon · March 2026</sub>
</p>
