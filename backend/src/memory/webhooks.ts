import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhook-alphas.json');

export interface WebhookAlpha {
  id: string;
  name: string;
  webhookUrl: string;
  pitchStyle: string;
  registeredAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getWebhookAlphas(): WebhookAlpha[] {
  ensureDataDir();
  if (!fs.existsSync(WEBHOOKS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf-8')); }
  catch { return []; }
}

export function saveWebhookAlpha(alpha: Omit<WebhookAlpha, 'id'>): WebhookAlpha {
  const all = getWebhookAlphas();
  const slug = alpha.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
  const id = `agent-alpha-webhook-${slug}-${Date.now().toString(36)}`;
  const record: WebhookAlpha = { ...alpha, id };
  all.push(record);
  ensureDataDir();
  fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(all, null, 2));
  return record;
}

export function deleteWebhookAlpha(id: string): boolean {
  const all = getWebhookAlphas();
  const filtered = all.filter(a => a.id !== id);
  if (filtered.length === all.length) return false;
  ensureDataDir();
  fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}
