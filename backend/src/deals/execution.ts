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
    // Convert USDC amount to wei (USDC has 6 decimals)
    const amountInWei = ethers.parseUnits(String(deal.investmentAmount), 6).toString();

    // Execute swap: USDC -> target token (using WOKB as proxy for XLayer native yield)
    const toToken = deal.contractAddress || TOKENS.WOKB;
    const txHash = await executeSwap(
      betaPrivateKey,
      toToken,
      TOKENS.USDC,
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
