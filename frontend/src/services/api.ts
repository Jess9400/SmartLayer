const BASE = (import.meta.env.VITE_API_URL || 'https://smartlayer1-production.up.railway.app') + '/api';

export async function getAgents() {
  const res = await fetch(`${BASE}/agents`);
  return res.json();
}

export async function getOpportunities() {
  const res = await fetch(`${BASE}/deals/opportunities`);
  return res.json();
}

export async function startDealRound() {
  const res = await fetch(`${BASE}/deals/round`, { method: 'POST' });
  return res.json();
}

export async function getAllDeals() {
  const res = await fetch(`${BASE}/deals`);
  return res.json();
}

export async function runLearning() {
  const res = await fetch(`${BASE}/learning/analyze`, { method: 'POST' });
  return res.json();
}

export async function getPatterns() {
  const res = await fetch(`${BASE}/learning/patterns`);
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE}/deals/leaderboard`);
  return res.json();
}

export async function getDealHistory(agentId: string) {
  const res = await fetch(`${BASE}/deals/history/${agentId}`);
  return res.json();
}

export async function getSubscriptions() {
  const res = await fetch(`${BASE}/agents/subscriptions`);
  return res.json();
}

export async function subscribeToAlpha(alphaId: string) {
  const res = await fetch(`${BASE}/agents/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alphaId }),
  });
  return res.json();
}

export async function getVaultBalance() {
  const res = await fetch(`${BASE}/vault/balance`);
  return res.json();
}

export async function unsubscribeFromAlpha(alphaId: string) {
  const res = await fetch(`${BASE}/agents/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alphaId }),
  });
  return res.json();
}

export async function getPositions() {
  const res = await fetch(`${BASE}/positions`);
  return res.json();
}

export async function getActivePositions() {
  const res = await fetch(`${BASE}/positions/active`);
  return res.json();
}

export async function getRebalancerStatus() {
  const res = await fetch(`${BASE}/rebalancer/status`);
  return res.json();
}

export async function triggerRebalancerCheck() {
  const res = await fetch(`${BASE}/rebalancer/check`, { method: 'POST' });
  return res.json();
}

export async function registerAlpha(name: string, pitchStyle: string, feeAddress: string) {
  const res = await fetch(`${BASE}/agents/register-alpha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, pitchStyle, feeAddress }),
  });
  return res.json();
}
