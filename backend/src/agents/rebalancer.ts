/**
 * Rebalancer Agent
 *
 * Runs on a configurable interval. For each active position:
 *   - Reads current APY (from DeFiLlama / adapter)
 *   - If APY dropped >40% from entry OR fell below 1%: triggers rebalance
 *     → withdraw from current protocol
 *     → trigger a new deal round to redeploy capital
 *
 * Broadcasts status updates over WebSocket so the frontend reflects live state.
 */
import { WSMessage, Position } from '../types';
import { getAdapter } from '../adapters/AdapterRegistry';
import { getActivePositions, updatePosition, syncPositions } from '../memory/positions';

const APY_DROP_THRESHOLD = 0.40;  // rebalance if APY drops >40% from entry
const MIN_APY = 1.0;              // rebalance if current APY falls below 1%
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export class RebalancerAgent {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastRunAt: string | null = null;
  private rebalanceCount = 0;

  constructor(
    private betaPrivateKey: string,
    private betaAddress: string,
    private broadcast: (msg: WSMessage) => void,
    private intervalMs = parseInt(process.env.REBALANCER_INTERVAL_MS || '') || DEFAULT_INTERVAL_MS,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`[Rebalancer] Started — checking every ${this.intervalMs / 60000} min`);
    this.broadcast({
      type: 'rebalance_update',
      agentId: 'system',
      agentName: 'Rebalancer',
      message: `Rebalancer active — monitoring positions every ${this.intervalMs / 60000} min`,
      timestamp: new Date().toISOString(),
    });
    this.timer = setInterval(() => this.runCheck(), this.intervalMs);
    // Run an initial check shortly after startup
    setTimeout(() => this.runCheck(), 10_000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.running = false;
    console.log('[Rebalancer] Stopped');
  }

  getStatus() {
    return {
      running: this.running,
      intervalMs: this.intervalMs,
      lastRunAt: this.lastRunAt,
      rebalanceCount: this.rebalanceCount,
      activePositions: getActivePositions().length,
    };
  }

  async runCheck() {
    this.lastRunAt = new Date().toISOString();
    const positions = getActivePositions();

    if (positions.length === 0) {
      console.log('[Rebalancer] No active positions to check');
      return;
    }

    console.log(`[Rebalancer] Checking ${positions.length} active position(s)...`);
    this.broadcast({
      type: 'rebalance_update',
      agentId: 'system',
      agentName: 'Rebalancer',
      message: `Checking ${positions.length} active position(s) for APY drift...`,
      timestamp: new Date().toISOString(),
    });

    // Sync all positions with fresh on-chain + APY data
    await syncPositions();
    const updated = getActivePositions();

    for (const pos of updated) {
      await this.evaluatePosition(pos);
    }
  }

  private async evaluatePosition(pos: Position) {
    const currentAPY = pos.currentAPY ?? pos.entryAPY;
    const apyDrop = pos.entryAPY > 0 ? (pos.entryAPY - currentAPY) / pos.entryAPY : 0;
    const needsRebalance = apyDrop > APY_DROP_THRESHOLD || currentAPY < MIN_APY;

    this.broadcast({
      type: 'position_update',
      agentId: 'system',
      agentName: 'Rebalancer',
      message: `${pos.adapterUsed} [${pos.token.symbol}] — Entry: ${pos.entryAPY.toFixed(1)}% → Now: ${currentAPY.toFixed(1)}% ${needsRebalance ? '⚠️ REBALANCING' : '✅'}`,
      timestamp: new Date().toISOString(),
      data: pos,
    });

    if (!needsRebalance) return;

    console.log(`[Rebalancer] Rebalancing position ${pos.id}: APY ${pos.entryAPY}% → ${currentAPY}%`);
    this.broadcast({
      type: 'rebalance_update',
      agentId: 'system',
      agentName: 'Rebalancer',
      message: `🔄 APY for ${pos.adapterUsed} dropped from ${pos.entryAPY.toFixed(1)}% to ${currentAPY.toFixed(1)}%. Withdrawing and redeploying...`,
      timestamp: new Date().toISOString(),
    });

    updatePosition(pos.id, { status: 'rebalancing' });

    // Withdraw from current protocol
    const adapter = getAdapter(pos.adapterUsed);
    const withdrawResult = await adapter.withdraw(
      this.betaPrivateKey,
      0n, // 0 = full withdrawal (MaxUint256 in adapter)
      { address: pos.token.address, symbol: pos.token.symbol, decimals: pos.token.decimals },
      this.betaAddress
    );

    if (withdrawResult) {
      updatePosition(pos.id, {
        status: 'withdrawn',
        withdrawTxHash: withdrawResult.txHash,
        closedAt: new Date().toISOString(),
      });
      this.rebalanceCount++;
      this.broadcast({
        type: 'rebalance_update',
        agentId: 'system',
        agentName: 'Rebalancer',
        message: `✅ Withdrawn from ${pos.adapterUsed}. TX: ${withdrawResult.txHash} — triggering new deal round...`,
        timestamp: new Date().toISOString(),
      });

      // Trigger a new deal round to redeploy capital
      await this.triggerDealRound();
    } else {
      updatePosition(pos.id, { status: 'active' }); // revert, retry next cycle
      console.warn(`[Rebalancer] Withdraw failed for position ${pos.id}`);
    }
  }

  private async triggerDealRound() {
    try {
      const port = process.env.PORT || 3001;
      const res = await fetch(`http://localhost:${port}/api/deals/round`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log('[Rebalancer] New deal round triggered successfully');
    } catch (e) {
      console.warn('[Rebalancer] Could not trigger deal round:', e instanceof Error ? e.message : e);
    }
  }
}
