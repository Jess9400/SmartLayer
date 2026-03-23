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

const PORT = process.env.PORT || 3001;

async function start() {
  await Promise.all([...alphas.map(a => a.init()), beta.init()]);

  console.log(`Agent Beta wallet:   ${beta.walletAddress}`);
  alphas.forEach(a => console.log(`${a.name} wallet: ${a.walletAddress}`));

  server.listen(PORT, () => {
    console.log(`SmartLayer backend running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready on ws://localhost:${PORT}`);
    console.log(`${alphas.length} Alpha agents ready to compete`);
  });
}

start().catch(console.error);
