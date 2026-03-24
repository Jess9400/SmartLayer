/**
 * Position Manager
 *
 * Persists open yield positions to disk and provides on-chain balance reads.
 * Each position maps 1:1 to a deal execution. The on-chain source of truth
 * is the aToken / LP token balance; this store is an index.
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { Position } from '../types';
import { getAdapter } from '../adapters/AdapterRegistry';

const DATA_DIR = path.join(__dirname, '../../data');
const POSITIONS_FILE = path.join(DATA_DIR, 'positions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAll(): Position[] {
  ensureDataDir();
  if (!fs.existsSync(POSITIONS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(POSITIONS_FILE, 'utf8')) as Position[];
  } catch {
    return [];
  }
}

function writeAll(positions: Position[]) {
  ensureDataDir();
  fs.writeFileSync(POSITIONS_FILE, JSON.stringify(positions, null, 2));
}

export function savePosition(position: Omit<Position, 'id'>): Position {
  const all = readAll();
  const record: Position = { ...position, id: uuid() };
  writeAll([...all, record]);
  return record;
}

export function getPositions(): Position[] {
  return readAll();
}

export function getActivePositions(): Position[] {
  return readAll().filter(p => p.status === 'active');
}

export function updatePosition(id: string, updates: Partial<Position>) {
  const all = readAll();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  writeAll(all);
}

/**
 * Read the current on-chain balance for a position (aToken / receipt token).
 * Returns 0n if the adapter cannot read the balance.
 */
export async function getOnChainBalance(position: Position): Promise<bigint> {
  const adapter = getAdapter(position.adapterUsed);
  return adapter.getBalance(position.onBehalfOf, {
    address: position.token.address,
    symbol: position.token.symbol,
    decimals: position.token.decimals,
  });
}

/**
 * Sync all active positions: read on-chain balance and current APY,
 * update records in place. Returns updated positions.
 */
export async function syncPositions(): Promise<Position[]> {
  const active = getActivePositions();
  for (const pos of active) {
    const adapter = getAdapter(pos.adapterUsed);
    const [balance, currentAPY] = await Promise.all([
      getOnChainBalance(pos),
      adapter.getAPY(),
    ]);
    updatePosition(pos.id, {
      currentAPY,
      onChainBalance: balance.toString(),
      lastCheckedAt: new Date().toISOString(),
    });
  }
  return getActivePositions();
}
