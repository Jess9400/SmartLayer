const BASE = '/api';

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
