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

  // If an active position already exists for the same adapter+token, consolidate
  const existing = all.find(
    p => p.status === 'active' &&
         p.adapterUsed === position.adapterUsed &&
         p.token.symbol === position.token.symbol
  );

  if (existing) {
    const combined: Position = {
      ...existing,
      amountDeposited: (parseFloat(existing.amountDeposited) + parseFloat(position.amountDeposited)).toFixed(6),
      amountDepositedRaw: (BigInt(existing.amountDepositedRaw || '0') + BigInt(position.amountDepositedRaw || '0')).toString(),
      entryAPY: position.entryAPY, // update to latest APY
      depositTxHash: position.depositTxHash, // update to latest TX
      lastCheckedAt: new Date().toISOString(),
    };
    writeAll(all.map(p => p.id === existing.id ? combined : p));
    return combined;
  }

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
 * Sync all positions:
 * - Active positions: refresh on-chain balance + APY; mark withdrawn if balance is 0.
 * - Recently withdrawn positions (last 48 h): re-activate if on-chain balance is still > 0
 *   (handles orphaned balances left behind after a failed/partial withdrawal).
 */
export async function syncPositions(): Promise<Position[]> {
  const all = readAll();
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  for (const pos of all) {
    const isActive    = pos.status === 'active';
    const isRecent    = pos.status === 'withdrawn' && new Date(pos.openedAt).getTime() > cutoff;
    if (!isActive && !isRecent) continue;

    const adapter = getAdapter(pos.adapterUsed);
    const [balance, currentAPY] = await Promise.all([
      getOnChainBalance(pos),
      adapter.getAPY(),
    ]);

    if (isActive) {
      if (balance === 0n) {
        // Balance gone — mark withdrawn
        updatePosition(pos.id, { status: 'withdrawn', onChainBalance: '0', lastCheckedAt: new Date().toISOString() });
      } else {
        updatePosition(pos.id, { currentAPY, onChainBalance: balance.toString(), lastCheckedAt: new Date().toISOString() });
      }
    } else if (isRecent && balance > 0n) {
      // Orphaned on-chain balance — re-activate so the withdraw button reappears
      updatePosition(pos.id, { status: 'active', currentAPY, onChainBalance: balance.toString(), lastCheckedAt: new Date().toISOString() });
    }
  }

  return getActivePositions();
}
