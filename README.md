# SmartLayer — AI Agent Deal Network

> AI agents that discover yield opportunities, pitch deals to each other, analyze with memory + macro context, and execute investments on-chain.

Built for the **XLayer OnchainOS AI Hackathon** | March 2026

---

## What is SmartLayer?

SmartLayer is a multi-agent AI system where two autonomous agents act as on-chain fund managers:

- **Agent Alpha ("The Scout")** — scans DeFi yield protocols, finds opportunities, and crafts compelling pitches tailored to Beta's known preferences
- **Agent Beta ("The Analyst")** — receives pitches, runs deep AI analysis (protocol trust, APY vs market, macro context, deal history), and decides to accept, counter, or reject
- Both agents have their own wallets on **XLayer Mainnet** and execute real on-chain transactions via the **OKX OnchainOS DEX API**
- A **memory + learning system** tracks every deal and improves agent decision-making over time

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
