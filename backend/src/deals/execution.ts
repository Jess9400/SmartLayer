import { Deal } from '../types';
import { executeNativeTransfer, transferToAddress } from '../services/okx';
import { ethers } from 'ethers';

const ALPHA_FEE_PERCENT = 0.03; // 3% performance fee to Alpha

export async function executeDeal(
  deal: Deal,
  betaPrivateKey: string,
  betaAddress: string,
  alphaAddress?: string
): Promise<Deal> {
  if (deal.decision !== 'accept' || !deal.investmentAmount) {
    throw new Error('Deal was not accepted or has no investment amount');
  }

  try {
    // Cap at 0.001 XETH max per deal to stay within demo wallet limits
    const cappedAmount = Math.min(deal.investmentAmount, 0.001);
    const amountInWei = ethers.parseUnits(String(cappedAmount), 18).toString();

    // Execute the main investment (self-transfer as on-chain proof)
    const txHash = await executeNativeTransfer(betaPrivateKey, amountInWei);

    if (!txHash) {
      return { ...deal, status: 'failed' };
    }

    let result: Deal = {
      ...deal,
      executed: true,
      txHash,
      status: 'active',
    };

    // Pay 3% performance fee to Alpha agent
    if (alphaAddress) {
      const feeAmount = cappedAmount * ALPHA_FEE_PERCENT;
      const feeInWei = ethers.parseUnits(String(feeAmount.toFixed(18)), 18).toString();

      const feeTxHash = await transferToAddress(betaPrivateKey, alphaAddress, feeInWei);

      result = {
        ...result,
        alphaFeeAmount: feeAmount,
        alphaFeeTxHash: feeTxHash || undefined,
      };
    }

    return result;
  } catch (err) {
    console.error('Execution error:', err);
    return { ...deal, status: 'failed' };
  }
}
