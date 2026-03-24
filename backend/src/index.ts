import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { AlphaAgent } from './agents/alpha';
import { BetaAgent } from './agents/beta';
import { createAgentRoutes } from './routes/agents';
import { createDealRoutes } from './routes/deals';
import { createLearningRoutes } from './routes/learning';
import { WSMessage } from './types';
import { ALPHA_AGENTS } from './utils/constants';
import { contractsConfigured, setupVaultDemo, toBytes32, getVaultBalance } from './services/contracts';
import { loadCustomAlphas, resetMemory } from './memory/store';
import { getPositions, getActivePositions, syncPositions } from './memory/positions';
import { RebalancerAgent } from './agents/rebalancer';
import { ethers } from 'ethers';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Init Beta agent
const beta = new BetaAgent(process.env.AGENT_BETA_PRIVATE_KEY || '');

// Init 3 built-in Alpha agents + any custom registered Alphas
const alphaPrivateKey = process.env.AGENT_ALPHA_PRIVATE_KEY || '';
const alphas: AlphaAgent[] = [
  ...ALPHA_AGENTS.map(cfg => new AlphaAgent(alphaPrivateKey, cfg.id, cfg.name, cfg.role, cfg.pitchStyle)),
  ...loadCustomAlphas().map(cfg => new AlphaAgent(alphaPrivateKey, cfg.id, cfg.name, 'External Alpha', cfg.pitchStyle)),
];

// WebSocket broadcast
function broadcast(msg: WSMessage) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Frontend connected via WebSocket');
  ws.send(JSON.stringify({ type: 'agent_message', agentName: 'System', message: 'Connected to SmartLayer network', timestamp: new Date().toISOString() }));
});

// Routes
app.use('/api/agents', createAgentRoutes(alphas, beta));
app.use('/api/deals', createDealRoutes(alphas, beta, broadcast));
app.use('/api/learning', createLearningRoutes(broadcast));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/api/memory/reset', (_req, res) => {
  resetMemory();
  res.json({ reset: true, message: 'Agent memory cleared — Beta starts fresh' });
});

// Position tracking
app.get('/api/positions', (_req, res) => res.json(getPositions()));
app.get('/api/positions/active', (_req, res) => res.json(getActivePositions()));
app.post('/api/positions/sync', async (_req, res) => {
  const updated = await syncPositions();
  res.json(updated);
});

app.post('/api/positions/:id/withdraw', async (req, res) => {
  const { updatePosition } = await import('./memory/positions');
  const { getAdapter } = await import('./adapters/AdapterRegistry');
  const all = getPositions();
  const pos = all.find(p => p.id === req.params.id);
  if (!pos) { res.status(404).json({ error: 'Position not found' }); return; }
  if (pos.status !== 'active') { res.status(400).json({ error: 'Position is not active' }); return; }
  try {
    const adapter = getAdapter(pos.adapterUsed);
    const result = await adapter.withdraw(
      process.env.AGENT_BETA_PRIVATE_KEY!,
      0n, // 0 = full withdrawal (MaxUint256)
      pos.token,
      pos.onBehalfOf
    );
    if (!result) { res.status(500).json({ error: 'Withdraw returned null' }); return; }
    updatePosition(pos.id, { status: 'withdrawn', withdrawTxHash: result.txHash });
    res.json({ txHash: result.txHash, positionId: pos.id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Withdraw failed' });
  }
});

// /api/vault/balance          → Beta's balance
// /api/vault/balance?address= → specific user's balance
app.get('/api/vault/balance', async (req, res) => {
  const addr = (req.query.address as string) || beta.walletAddress;
  try {
    const balance = await getVaultBalance(addr);
    res.json({ vaultBalance: balance, address: addr });
  } catch {
    res.json({ vaultBalance: '0', address: addr });
  }
});

app.get('/api/vault/stats', async (_req, res) => {
  try {
    const alphaIds = ALPHA_AGENTS.map(a => a.id);
    const { getOnChainLeaderboard } = await import('./services/contracts');
    const entries = await getOnChainLeaderboard(alphaIds);
    const valid = entries.filter(Boolean) as NonNullable<typeof entries[number]>[];

    // Aggregate across all alphas
    const totalAccepted      = valid.reduce((s, e) => s + e.totalAccepted, 0);
    const totalPitched       = valid.reduce((s, e) => s + e.totalPitched, 0);
    const totalFeesEth       = valid.reduce((s, e) => s + e.totalFeesEarned, 0);
    const capitalDeployedEth = valid.reduce((s, e) => s + e.totalInvestedEth, 0);

    // Weighted avg APY: sum(avgApy * accepted) / totalAccepted
    const weightedApy = totalAccepted > 0
      ? valid.reduce((s, e) => s + (e.avgApy * e.totalAccepted), 0) / totalAccepted
      : 0;

    const projectedAnnual = capitalDeployedEth * weightedApy / 100;
    const winRate         = totalPitched > 0 ? Math.round((totalAccepted / totalPitched) * 100) : 0;

    res.json({
      capitalDeployedEth: parseFloat(capitalDeployedEth.toFixed(8)),
      avgApy:             parseFloat(weightedApy.toFixed(2)),
      projectedAnnualEth: parseFloat(projectedAnnual.toFixed(8)),
      winRate,
      totalAccepted,
      totalPitched,
      totalFeesEth:       parseFloat(totalFeesEth.toFixed(8)),
      source:             'onchain',
    });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to fetch on-chain stats' });
  }
});

// Debug: check vault state on-chain
app.get('/api/vault/debug', async (_req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC!);
    const VAULT_ABI = ['function getBalance(address) view returns (uint256)', 'function getBetaAgent(address) view returns (address)'];
    const REGISTRY_ABI = ['function getFeeAddress(bytes32) view returns (address)', 'function getAlphaCount() view returns (uint256)'];
    const REP_ABI = ['function authorized(address) view returns (bool)'];
    const vault = new ethers.Contract(process.env.CONTRACT_VAULT!, VAULT_ABI, provider);
    const registry = new ethers.Contract(process.env.CONTRACT_AGENT_REGISTRY!, REGISTRY_ABI, provider);
    const rep = new ethers.Contract(process.env.CONTRACT_REPUTATION_REGISTRY!, REP_ABI, provider);

    const betaAddr = beta.walletAddress;
    const vaultAddr = process.env.CONTRACT_VAULT!;
    const [vaultBal, assignedAgent, alphaCount, vaultAuthorized] = await Promise.all([
      vault.getBalance(betaAddr),
      vault.getBetaAgent(betaAddr),
      registry.getAlphaCount(),
      rep.authorized(vaultAddr),
    ]);

    const feeAddrs: Record<string, string> = {};
    for (const id of ['agent-alpha-nexus', 'agent-alpha-citadel', 'agent-alpha-quant']) {
      feeAddrs[id] = await registry.getFeeAddress(toBytes32(id));
    }

    // Simulate vault.execute as Beta wallet to get exact revert reason
    const VAULT_FULL_ABI = ['function execute(address user, bytes32 alphaId, address destination, uint256 amount, uint256 apyBps) external'];
    const betaSigner = new ethers.Wallet(process.env.AGENT_BETA_PRIVATE_KEY!, provider);
    const vaultSim = new ethers.Contract(process.env.CONTRACT_VAULT!, VAULT_FULL_ABI, betaSigner);
    const testAmount = ethers.parseEther('0.0001');
    let simulationResult: string;
    try {
      await vaultSim.execute.staticCall(
        betaAddr,
        toBytes32('agent-alpha-quant'),
        betaAddr,
        testAmount,
        1500
      );
      simulationResult = 'SUCCESS';
    } catch (e: any) {
      simulationResult = e.message || String(e);
    }

    res.json({
      betaAddress: betaAddr,
      vaultBalance: ethers.formatEther(vaultBal),
      assignedAgent,
      alphaCountInRegistry: Number(alphaCount),
      vaultAuthorizedInReputation: vaultAuthorized,
      feeAddresses: feeAddrs,
      simulatedExecute: simulationResult,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Expose contract addresses to frontend
app.get('/api/contracts', (_req, res) => {
  res.json({
    agentRegistry:      process.env.CONTRACT_AGENT_REGISTRY || null,
    reputationRegistry: process.env.CONTRACT_REPUTATION_REGISTRY || null,
    vault:              process.env.CONTRACT_VAULT || null,
    configured:         !!(process.env.CONTRACT_VAULT),
  });
});

const PORT = process.env.PORT || 3001; // v2

// Rebalancer (initialized after beta is ready)
let rebalancer: RebalancerAgent;

// Rebalancer routes
app.get('/api/rebalancer/status', (_req, res) => res.json(rebalancer?.getStatus() ?? { running: false }));
app.post('/api/rebalancer/check', async (_req, res) => {
  try {
    await rebalancer?.runCheck();
    res.json({ triggered: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

// Start listening immediately so Railway healthcheck passes
server.listen(PORT, () => {
  console.log(`SmartLayer backend running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);

  // Initialize agents asynchronously after server is up
  Promise.all([...alphas.map(a => a.init()), beta.init()])
    .then(() => {
      console.log(`Agent Beta wallet:   ${beta.walletAddress}`);
      alphas.forEach(a => console.log(`${a.name} wallet: ${a.walletAddress}`));
      console.log(`${alphas.length} Alpha agents ready to compete`);

      if (contractsConfigured()) {
        setupVaultDemo(beta.privateKey, beta.walletAddress)
          .catch(e => console.warn('[vault] Setup warning:', e.message));
      }

      // Start autonomous rebalancer
      rebalancer = new RebalancerAgent(beta.privateKey, beta.walletAddress, broadcast);
      rebalancer.start();
    })
    .catch(e => console.error('[init] Agent init failed:', e.message));
});
