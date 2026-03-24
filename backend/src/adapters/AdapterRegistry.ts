import { IYieldAdapter } from './IYieldAdapter';
import { ZeroLendAdapter } from './ZeroLendAdapter';
import { IzumiAdapter } from './IzumiAdapter';

const zerolend = new ZeroLendAdapter();
const izumi = new IzumiAdapter();

// Maps lowercase protocol names → adapter
const registry = new Map<string, IYieldAdapter>([
  ['zerolend', zerolend],
  ['izumi finance', izumi],
  ['izumi', izumi],
  ['lynex', izumi],       // Lynex is also an LP DEX — same fallback pattern
  ['curve', izumi],
]);

/**
 * Look up the adapter for a given protocol name.
 * Returns ZeroLend as the default if no specific adapter is registered.
 */
export function getAdapter(protocolName: string): IYieldAdapter {
  const key = protocolName?.toLowerCase().trim();
  return registry.get(key) ?? zerolend;
}

export function listAdapters(): string[] {
  return [...new Set(registry.values())].map(a => a.protocolName);
}
