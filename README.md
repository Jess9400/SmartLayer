# SmartLayer — Your Personal AI Investment Agent

> Protocols and fund managers deploy Alpha agents to pitch deals. You own a Beta agent — it analyzes every pitch, learns your risk profile, and executes on-chain investments autonomously.

Built for the **XLayer OnchainOS AI Hackathon** | March 2026

---

## The Vision

Today, protocols and funds market investment opportunities directly to users — who have to evaluate, research, and decide themselves. Most people don't have the time, tools, or expertise to do this well.

**SmartLayer flips the model.**

- **Alpha agents** are deployed by any fund manager, DeFi protocol, or platform that wants to pitch deals to users
- **Beta agents** are personal AI agents owned by users — they know your risk profile, learn from every deal, and protect your capital
- Multiple Alpha agents **compete** for access to Beta agents — the best track record wins more capital
- Deals flow from Alpha → Beta. Beta decides. Beta executes. **You stay in control without doing the work.**

This is the infrastructure for **permissioned, AI-filtered, on-chain investing at scale.**

---

## What's Live in This Demo

### 3 Competing Alpha Agents

| Agent | Persona | Strategy |
|-------|---------|----------|
| **Alpha Nexus** | Yield Hunter | Aggressive — leads with returns and APY upside |
| **Alpha Citadel** | Blue-Chip Scout | Conservative — leads with security and audits |
| **Alpha Quant** | Quant Analyst | Data-driven — leads with metrics and risk-adjusted returns |

Each has a distinct pitching style. Every deal round, all subscribed Alphas pitch simultaneously against each other.

### Beta Agent — Your Personal AI

- Analyzes every pitch using Claude AI: protocol credibility, APY, TVL, macro context, deal history
- Learns your **risk profile** (conservative / balanced / aggressive) from accepted and rejected deals
- Allocates capital **proportionally** across accepted deals: `60% analysis score + 40% reputation score`
- Sends a **3% performance fee** (real on-chain TX) to Alpha on every executed deal

### On-Chain Reputation System

Every Alpha agent builds a public scorecard from their on-chain track record:

- **Reputation Score (0–100)**: win rate (50%) + deal volume (25%) + APY quality (15%) + recent activity (10%)
- **TX history**: every deal and fee payment is a real XLayer transaction — verifiable by anyone
- **Leaderboard**: Alphas ranked by reputation — protocols compete to get more Beta agents subscribing to them
- **Fee earnings**: Alphas that consistently deliver accepted deals earn XETH — permissionless income

### Beta Subscribes to Alpha

Beta agents choose which Alpha agents can pitch to them. It's an on-chain allowlist:

- Subscribe or unsubscribe from any Alpha directly from the leaderboard UI
- Only subscribed Alphas participate in deal rounds
- Default: subscribed to all 3 Alphas
- As the network grows, this becomes **permissioned deal flow** — Alphas with better reputation get more subscribers, more capital access, more fees

---

## Demo Flow

```
1. Beta chooses which Alpha agents to subscribe to (leaderboard UI)
2. Deal round starts — all subscribed Alphas scan DeFiLlama and pitch simultaneously
3. Beta analyzes all pitches in parallel with Claude AI
4. Proportional capital allocation: analysis score × reputation score
5. Accepted deals execute on XLayer Mainnet (real TX)
6. 3% performance fee sent to Alpha's wallet (real TX)
7. Alpha reputation score updates from on-chain track record
8. Beta risk profile updates from deal history
9. Both agents learn and adapt for the next round
```

---

## Agent Economy

The 3% fee mechanism creates real economic alignment:

| Situation | Outcome |
|-----------|---------|
| Alpha pitches bad deals | Beta rejects → Alpha earns nothing → reputation drops |
| Alpha pitches good deals | Beta accepts → Alpha earns 3% fee → reputation rises |
| Alpha has high reputation | More Beta agents subscribe → more deal flow → more fees |
| Alpha has low reputation | Beta agents unsubscribe → no access → forced to improve |

This is a **decentralized hedge fund** where track record is verifiable on-chain. No opaque fund managers — just performance, transparent and permanent on XLayer.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI | Claude Sonnet 4.6 (Anthropic) |
| Backend | Node.js + TypeScript + Express |
| Frontend | React + Vite + Tailwind CSS |
| Wallet Connect | RainbowKit + wagmi v2 + viem |
| Blockchain | XLayer Mainnet (Chain ID: 196) |
| DEX / Execution | OKX OnchainOS DEX API |
| Yield Data | DeFiLlama API |
| Real-time | WebSocket |
| Memory | JSON file-based (persistent deal history + subscriptions) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        SMARTLAYER NETWORK                        │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │ Alpha Nexus │  │Alpha Citadel│  │ Alpha Quant │  (+ any     │
│   │ Yield Hunter│  │Blue-Chip    │  │ Quant Analyst│   protocol) │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│          │                │                │                    │
│          └────────────────┼────────────────┘                    │
│                    pitch simultaneously                          │
│                           ▼                                      │
│                  ┌────────────────┐                              │
│                  │   Agent Beta   │  ← YOUR personal agent      │
│                  │ (subscribed to │                              │
│                  │  Nexus+Citadel)│                              │
│                  └───────┬────────┘                              │
│                          │ proportional allocation               │
│                          │ analysis score × reputation           │
│              ┌───────────┴───────────┐                          │
│              │                       │                          │
│       Execute deal TX           Pay 3% fee TX                   │
│              │                       │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
│              XLayer Mainnet (Chain ID: 196)                     │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │  DeFiLlama API · Claude AI · OKX OnchainOS · Memory │      │
│   └──────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
smartlayer/
├── backend/
│   ├── src/
│   │   ├── agents/          # Alpha (3 personas) + Beta agent logic
│   │   ├── deals/           # On-chain execution + 3% fee payment
│   │   ├── memory/          # Deal storage, reputation, subscriptions, learning
│   │   ├── services/        # Claude API, OKX, DeFiLlama
│   │   ├── routes/          # REST API endpoints
│   │   └── utils/           # Prompts + constants (Alpha personas)
│   └── data/
│       ├── memory.json       # Persistent agent memory + reputation
│       └── subscriptions.json # Beta's Alpha subscriptions
│
├── frontend/
│   └── src/
│       ├── components/      # AgentCard, ChatWindow, DealAnalysis,
│       │                    # LearningPanel, Leaderboard (+ TX history)
│       ├── hooks/           # WebSocket hook for live updates
│       └── services/        # API client
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- OKX Developer Portal API keys (DEX API access)
- Anthropic API key
- Two funded wallets on XLayer Mainnet (native XETH)

### 1. Clone the repo

```bash
git clone https://github.com/Jess9400/SmartLayer.git
cd SmartLayer
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
OKX_API_KEY=your-key
OKX_SECRET_KEY=your-secret
OKX_PASSPHRASE=your-passphrase
AGENT_ALPHA_PRIVATE_KEY=0x...   # All 3 Alpha agents share this wallet (demo)
AGENT_BETA_PRIVATE_KEY=0x...    # Beta agent wallet — fund this one
XLAYER_RPC=https://rpc.xlayer.tech
XLAYER_CHAIN_ID=196
PORT=3001
```

### 3. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## API Endpoints

```
GET  /api/agents                   — All agent states (3 Alphas + Beta)
GET  /api/agents/subscriptions     — Beta's current Alpha subscriptions
POST /api/agents/subscribe         — Subscribe Beta to an Alpha { alphaId }
POST /api/agents/unsubscribe       — Unsubscribe Beta from an Alpha { alphaId }
GET  /api/agents/:id               — Get specific agent state

GET  /api/deals                    — All deal history
GET  /api/deals/leaderboard        — Alpha agents ranked by reputation score
GET  /api/deals/history/:agentId   — Last 10 deals for a specific Alpha (with TX hashes)
GET  /api/deals/opportunities      — Live yield opportunities from DeFiLlama
POST /api/deals/round              — Run competitive deal round (all Alphas pitch → Beta decides)

POST /api/learning/analyze         — Run learning cycle (Claude analyzes patterns)
GET  /api/learning/patterns        — Get Beta's learned patterns
```

---

## 📊 Performance Intelligence

SmartLayer tracks every decision and outcome:

- **PnL across all agent decisions** — which deals made money, which didn't
- **Alpha reputation score** — computed from win rate, deal volume, APY quality, recency
- **Beta risk profile** — learned from accepted/rejected deal patterns (conservative / balanced / aggressive)
- **Fees earned per Alpha** — transparent on-chain income from successful deals
- **APY vs expectations** — did the deal deliver what Alpha pitched?

Agents adapt based on real performance. Every round makes both agents smarter.

---

## 🪙 Agent Economy

The current demo shows the full economic loop:

- **Alpha earns 3% of every deal Beta executes** — incentive to pitch quality over quantity
- **Alpha reputation is public and on-chain** — no opaque track records
- **Beta controls access via subscriptions** — bad Alpha agents lose deal flow
- **Capital routes proportionally to reputation** — proven performers get more

The vision beyond this demo:
- Any protocol or fund deploys an Alpha agent and pitches to the network
- Users delegate capital to their Beta agent with a chosen risk profile
- Alpha agents with the best on-chain history attract the most Beta subscribers
- A permissionless, AI-powered investment marketplace where performance is the only credential

---

## Key Addresses (XLayer Mainnet)

| Token | Address |
|-------|---------|
| USDC | `0x74b7f16337b8972027f6196a17a631ac6de26d22` |
| WETH | `0x5a77f1443d16ee5761d310e38b62f77f726bc71c` |
| WOKB | `0xe538905cf8410324e03a5a23c1c177a474d59b2b` |

---

## Hackathon Submission

| Requirement | Status |
|-------------|--------|
| Project Name | SmartLayer |
| Track | AI DeFi |
| GitHub (public) | ✅ github.com/Jess9400/SmartLayer |
| Live Demo | ✅ jess9400.github.io/SmartLayer |
| XLayer TX Hash | ✅ Real execution on mainnet |
| AI Model | Claude Sonnet 4.6 (Anthropic) |
| OnchainOS APIs | OKX DEX API + native XETH transfers |
| Prompt Design | Multi-agent negotiation + memory + learning + reputation |
| Multi-agent | ✅ 3 Alpha agents competing + 1 Beta agent |
| On-chain reputation | ✅ Verifiable deal history + fee payments |

---

*SmartLayer · XLayer OnchainOS AI Hackathon · March 2026*
