import { Deal } from '../types';
import { executeNativeTransfer, transferToAddress } from '../services/okx';
import { vaultExecute, contractsConfigured } from '../services/contracts';
import { ethers } from 'ethers';

const ALPHA_FEE_PERCENT = 0.03;

export async function executeDeal(
  deal: Deal,
  betaPrivateKey: string,
  betaAddress: string,
  alphaAddress?: string,
  userAddress?: string   // vault user — required for on-chain execution
): Promise<Deal> {
  if (deal.decision !== 'accept' || !deal.investmentAmount) {
    throw new Error('Deal was not accepted or has no investment amount');
  }

  const cappedAmount = parseFloat(Math.min(deal.investmentAmount, 0.001).toFixed(8));
  const amountWei = ethers.parseUnits(cappedAmount.toFixed(8), 18);
  const apyBps = Math.round(deal.apy * 100); // e.g. 15.5% → 1550

  try {
    // ── On-chain path: use SmartLayerVault ──────────────────────────────────
    if (contractsConfigured() && userAddress) {
      const result = await vaultExecute(
        betaPrivateKey,
        userAddress,
        deal.pitcherId,        // alphaId (bytes32 resolved in service)
        betaAddress,           // destination = Beta self (proof of execution in demo)
        amountWei,
        apyBps
      );

      return {
        ...deal,
        executed: true,
        txHash: result.txHash,
        alphaFeeAmount: parseFloat(result.feeAmount),
        alphaFeeTxHash: result.txHash, // same TX — vault splits atomically
        status: 'active',
      };
    }

    // ── Fallback: direct native transfers (no contracts configured) ─────────
    const txHash = await executeNativeTransfer(betaPrivateKey, amountWei.toString());
    if (!txHash) return { ...deal, status: 'failed' };

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
      alphaFeeAmount,
      alphaFeeTxHash,
      status: 'active',
    };
  } catch (err) {
    console.error('Execution error:', err);
    return { ...deal, status: 'failed' };
  }
}
