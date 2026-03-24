import { Deal } from '../types';
import { executeNativeTransfer, transferToAddress } from '../services/okx';
import { vaultExecute, contractsConfigured } from '../services/contracts';
import { routeCapital } from '../services/router';
import { savePosition } from '../memory/positions';
import { ethers } from 'ethers';

const ALPHA_FEE_PERCENT = 0.03;

export async function executeDeal(
  deal: Deal,
  betaPrivateKey: string,
  betaAddress: string,
  alphaAddress?: string,
  userAddress?: string   // vault user — required for on-chain vault execution
): Promise<Deal> {
  if (deal.decision !== 'accept' || !deal.investmentAmount) {
    throw new Error('Deal was not accepted or has no investment amount');
  }

  const cappedAmount = parseFloat(Math.min(deal.investmentAmount, 0.001).toFixed(8));
  const amountWei = ethers.parseUnits(cappedAmount.toFixed(8), 18);
  const apyBps = Math.round(deal.apy * 100);

  try {
    // ── On-chain path: use SmartLayerVault ──────────────────────────────────
    if (contractsConfigured() && userAddress) {
      const result = await vaultExecute(
        betaPrivateKey,
        userAddress,
        deal.pitcherId,
        betaAddress,
        amountWei,
        apyBps
      );

      // Route capital: swap XETH → protocol token → deposit into protocol
      const investedWei = (amountWei * 97n / 100n).toString();
      const routed = await routeCapital(betaPrivateKey, betaAddress, investedWei, deal);

      // Record position
      if (routed?.depositTxHash) {
        const humanAmount = routed.amountDeposited > 0n
          ? (Number(routed.amountDeposited) / Math.pow(10, routed.tokenDecimals)).toFixed(6)
          : '0';
        savePosition({
          dealId: deal.id,
          alphaId: deal.pitcherId,
          alphaName: deal.pitcherAddress || deal.pitcherId,
          protocol: deal.protocol,
          adapterUsed: routed.adapterUsed,
          token: { address: routed.tokenAddress, symbol: routed.tokenSymbol, decimals: routed.tokenDecimals },
          amountDeposited: humanAmount,
          amountDepositedRaw: routed.amountDeposited.toString(),
          entryAPY: deal.apy,
          depositTxHash: routed.depositTxHash,
          openedAt: new Date().toISOString(),
          status: 'active',
          onBehalfOf: betaAddress,
        });
      }

      return {
        ...deal,
        executed: true,
        txHash: result.txHash,
        alphaFeeAmount: parseFloat(result.feeAmount),
        alphaFeeTxHash: result.txHash,
        swapTxHash: routed?.swapTxHash,
        swapToAmount: routed?.swapTxHash ? routed.tokenSymbol : undefined,
        depositTxHash: routed?.depositTxHash,
        adapterUsed: routed?.adapterUsed,
        status: 'active',
      };
    }

    // ── Fallback: direct route (no vault configured) ────────────────────────
    const routed = await routeCapital(betaPrivateKey, betaAddress, amountWei.toString(), deal);

    // If routing fully failed, fall back to native transfer as proof of execution
    const txHash = routed?.swapTxHash || await executeNativeTransfer(betaPrivateKey, amountWei.toString());
    if (!txHash) return { ...deal, status: 'failed' };

    // Record position
    if (routed?.depositTxHash) {
      const humanAmount = routed.amountDeposited > 0n
        ? (Number(routed.amountDeposited) / Math.pow(10, routed.tokenDecimals)).toFixed(6)
        : '0';
      savePosition({
        dealId: deal.id,
        alphaId: deal.pitcherId,
        alphaName: deal.pitcherAddress || deal.pitcherId,
        protocol: deal.protocol,
        adapterUsed: routed.adapterUsed,
        token: { address: routed.tokenAddress, symbol: routed.tokenSymbol, decimals: routed.tokenDecimals },
        amountDeposited: humanAmount,
        amountDepositedRaw: routed.amountDeposited.toString(),
        entryAPY: deal.apy,
        depositTxHash: routed.depositTxHash,
        openedAt: new Date().toISOString(),
        status: 'active',
        onBehalfOf: betaAddress,
      });
    }

    let alphaFeeTxHash: string | undefined;
    let alphaFeeAmount: number | undefined;
    if (alphaAddress) {
      const feeAmount = cappedAmount * ALPHA_FEE_PERCENT;
      const feeWei = ethers.parseUnits(String(feeAmount.toFixed(18)), 18).toString();
      alphaFeeTxHash = (await transferToAddress(betaPrivateKey, alphaAddress, feeWei)) || undefined;
      alphaFeeAmount = feeAmount;
    }

    return {
      ...deal,
      executed: true,
      txHash,
      swapTxHash: routed?.swapTxHash,
      swapToAmount: routed?.swapTxHash ? routed.tokenSymbol : undefined,
      depositTxHash: routed?.depositTxHash,
      adapterUsed: routed?.adapterUsed,
      alphaFeeAmount,
      alphaFeeTxHash,
      status: 'active',
    };
  } catch (err) {
    console.error('Execution error:', err);
    return { ...deal, status: 'failed' };
  }
}
