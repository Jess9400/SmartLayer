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

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Init agents
const alpha = new AlphaAgent(process.env.AGENT_ALPHA_PRIVATE_KEY || '');
const beta = new BetaAgent(process.env.AGENT_BETA_PRIVATE_KEY || '');

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
app.use('/api/agents', createAgentRoutes(alpha, beta));
app.use('/api/deals', createDealRoutes(alpha, beta, broadcast));
app.use('/api/learning', createLearningRoutes(broadcast));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;

async function start() {
  await alpha.init();
  await beta.init();
  console.log(`Agent Alpha wallet: ${alpha.walletAddress}`);
  console.log(`Agent Beta wallet:  ${beta.walletAddress}`);

  server.listen(PORT, () => {
    console.log(`SmartLayer backend running on http://localhost:${PORT}`);
    console.log(`WebSocket server ready on ws://localhost:${PORT}`);
  });
}

start().catch(console.error);
