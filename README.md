# SmartLayer — Your Personal AI Investment Agent

> Fund managers and protocols pitch deals to your AI agent. It analyzes, decides, and invests on-chain — autonomously.

Built for the **XLayer OnchainOS AI Hackathon** | March 2026

---

## The Vision

Today, protocols and funds market investment opportunities directly to users — who have to evaluate, research, and decide themselves. Most people don't have the time, tools, or expertise to do this well.

**SmartLayer flips the model.**

- **Alpha agents** are deployed by any fund manager, DeFi protocol, or platform that wants to pitch deals
- **Beta agents** are personal AI agents owned by users — they know your risk profile, learn from every deal, and protect your capital
- Deals flow from Alpha → Beta. Beta decides. Beta executes. You stay in control without doing the work.

This is the infrastructure for **permissioned, AI-filtered, on-chain investing at scale.**

### In this demo:
- **Agent Alpha ("The Scout")** — represents a protocol pitching a yield opportunity on XLayer
- **Agent Beta ("The Analyst")** — represents a user's personal agent: analyzes the pitch with Claude AI, checks macro context and deal history, then accepts or rejects
- Both agents have real wallets on **XLayer Mainnet** and execute real on-chain transactions via **OKX OnchainOS**
- A **memory + learning system** means Beta gets smarter with every deal

---

## Demo Flow

```
1. Alpha scans DeFiLlama for yield opportunities on XLayer
2. Alpha crafts a pitch tailored to Beta's known risk profile
3. Beta analyzes the deal: protocol score, APY, TVL, macro, history
4. Beta decides: ACCEPT / COUNTER / REJECT
5. If accepted → Beta's wallet executes a swap on XLayer via OKX DEX
6. TX hash recorded on-chain
7. Memory updated → agents learn and adapt
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI | Claude Sonnet 4.6 (Anthropic) |
| Backend | Node.js + TypeScript + Express |
| Frontend | React + Vite + Tailwind CSS |
| Blockchain | XLayer Mainnet (Chain ID: 196) |
| DEX / Execution | OKX OnchainOS DEX API |
| Yield Data | DeFiLlama API |
| Real-time | WebSocket |
| Memory | JSON file-based (persistent deal history) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SMARTLAYER NETWORK                       │
│                                                              │
│   Agent Alpha (Scout)    ──pitch──►   Agent Beta (Analyst)  │
│   Wallet: 0xAAA                        Wallet: 0xBBB         │
│        │                                      │              │
│        └──────────────┬───────────────────────┘              │
│                       │                                      │
│               Memory & Learning                              │
│           (patterns, deal history)                           │
│                       │                                      │
│   ┌───────────────────┼───────────────────────┐              │
│   │ DeFiLlama API  Market Data  OKX OnchainOS │              │
│   └───────────────────────────────────────────┘              │
│                                                              │
│              XLayer Mainnet (Chain ID: 196)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
smartlayer/
├── backend/
│   ├── src/
│   │   ├── agents/         # Alpha (scout) + Beta (analyst) agent logic
│   │   ├── deals/          # On-chain execution via OKX DEX
│   │   ├── memory/         # Deal storage + learning cycle
│   │   ├── services/       # Claude API, OKX, DeFiLlama
│   │   ├── routes/         # REST API endpoints
│   │   └── utils/          # Claude prompts + constants
│   └── data/memory.json    # Persistent agent memory
│
├── frontend/
│   └── src/
│       ├── components/     # AgentCard, ChatWindow, DealAnalysis, LearningPanel
│       ├── hooks/          # WebSocket hook for live updates
│       └── services/       # API client
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- OKX Developer Portal API keys (with DEX API access)
- Anthropic API key
- Two funded wallets on XLayer Mainnet (USDC)

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
AGENT_ALPHA_PRIVATE_KEY=0x...
AGENT_BETA_PRIVATE_KEY=0x...
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

Open **http://localhost:3000**

---

## API Endpoints

```
GET  /api/agents                 — Get both agent states + balances
GET  /api/agents/:id/balance     — Get specific agent balance
GET  /api/deals                  — Get all deals history
GET  /api/deals/opportunities    — Get live yield opportunities
POST /api/deals/round            — Run a full deal round (pitch → analyze → execute)
POST /api/learning/analyze       — Run learning cycle
GET  /api/learning/patterns      — Get learned patterns
```

---

## 📊 Performance Intelligence

SmartLayer tracks every decision and its outcome:

- **PnL across all agent decisions** — which deals made money, which didn't
- **Winning vs losing strategies** — patterns in what Beta accepts and what performs
- **Largest losses and why they happened** — so agents don't repeat mistakes
- **APY vs expectations** — did the deal deliver what Alpha pitched?

Agents adapt based on real performance — not just theory. Every deal round makes Beta smarter.

---

## 🪙 Future: Agent Economy

The current demo is two agents. The vision is a network:

- **Users allocate capital** to Beta agents with different risk profiles
- **Top-performing agents earn more capital** — a reputation-based allocation system
- **Agents build on-chain reputation** based on verified PnL history
- **Fee model** distributes rewards to participants — Alpha agents earn for successful deals, Beta agents earn for capital performance
- **Anyone can deploy an Alpha** — protocols, funds, DAOs pitching to the network of Beta agents

This creates a permissionless, AI-powered investment marketplace where performance is transparent and on-chain.

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
| GitHub (public) | ✅ |
| XLayer TX Hash | ✅ Real execution on mainnet |
| AI Model | Claude Sonnet 4.6 |
| OnchainOS APIs | Wallet API + DEX API |
| Prompt Design | Multi-agent negotiation + memory + learning |

---

*SmartLayer v2 | XLayer OnchainOS AI Hackathon | March 2026*
