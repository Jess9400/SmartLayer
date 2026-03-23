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
import { ethers } from 'ethers';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Init Beta agent
const beta = new BetaAgent(process.env.AGENT_BETA_PRIVATE_KEY || '');

// Init 3 competing Alpha agents — all share the same private key for demo
// In production each would have their own wallet
const alphaPrivateKey = process.env.AGENT_ALPHA_PRIVATE_KEY || '';
const alphas = ALPHA_AGENTS.map(cfg =>
  new AlphaAgent(alphaPrivateKey, cfg.id, cfg.name, cfg.role, cfg.pitchStyle)
);

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

app.get('/api/vault/balance', async (_req, res) => {
  try {
    const balance = await getVaultBalance(beta.walletAddress);
    res.json({ vaultBalance: balance, address: beta.walletAddress });
  } catch {
    res.json({ vaultBalance: '0' });
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

const PORT = process.env.PORT || 3001;

async function start() {
  await Promise.all([...alphas.map(a => a.init()), beta.init()]);

  console.log(`Agent Beta wallet:   ${beta.walletAddress}`);

  // Auto-setup vault for demo (deposit + assignAgent) if contracts are configured
  if (contractsConfigured()) {
    setupVaultDemo(beta.privateKey, beta.walletAddress)
      .catch(e => console.warn('[vault] Setup warning:', e.message));
  }
  alphas.forEach(a => console.log(`${a.name} wallet: ${a.walletAddress}`));

  server.listen(PORT, () => {
    console.log(`SmartLayer backend running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready on ws://localhost:${PORT}`);
    console.log(`${alphas.length} Alpha agents ready to compete`);
  });
}

start().catch(console.error);
