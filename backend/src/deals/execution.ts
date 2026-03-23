import { Deal } from '../types';
import { executeSwap } from '../services/okx';
import { TOKENS } from '../utils/constants';
import { ethers } from 'ethers';

export async function executeDeal(
  deal: Deal,
  betaPrivateKey: string,
  betaAddress: string
): Promise<Deal> {
  if (deal.decision !== 'accept' || !deal.investmentAmount) {
    throw new Error('Deal was not accepted or has no investment amount');
  }

  try {
    // Cap at 0.001 XETH max per deal to stay within demo wallet limits
    const cappedAmount = Math.min(deal.investmentAmount, 0.001);
    // Convert WETH amount to wei (WETH has 18 decimals)
    const amountInWei = ethers.parseUnits(String(cappedAmount), 18).toString();

    // Execute swap: WETH -> WOKB as proof of execution on XLayer
    const toToken = TOKENS.WOKB;
    const txHash = await executeSwap(
      betaPrivateKey,
      toToken,
      TOKENS.WETH,
      amountInWei,
      betaAddress
    );

    if (txHash) {
      return {
        ...deal,
        executed: true,
        txHash,
        status: 'active',
      };
    } else {
      return { ...deal, status: 'failed' };
    }
  } catch (err) {
    console.error('Execution error:', err);
    return { ...deal, status: 'failed' };
  }
}
