import { Deal } from '../types';
import { executeNativeTransfer, transferToAddress, executeSwap } from '../services/okx';
import { vaultExecute, contractsConfigured } from '../services/contracts';
import { TOKENS } from '../utils/constants';
import { depositUSDCToZeroLend, getUSDCBalance } from '../services/yield';
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

      // After vault settles, swap received XETH → USDC via OKX DEX
      const investedWei = (amountWei * 97n / 100n).toString();
      const swapResult = await executeSwap(
        betaPrivateKey,
        TOKENS.USDC,
        TOKENS.NATIVE_ETH,
        investedWei,
        betaAddress
      ).catch(e => { console.warn('[DEX] Swap failed (non-fatal):', e.message); return null; });

      // After swap, deposit received USDC into ZeroLend for yield
      let depositTxHash: string | undefined;
      if (swapResult) {
        const usdcBalance = await getUSDCBalance(betaAddress);
        if (usdcBalance > 0n) {
          const depositHash = await depositUSDCToZeroLend(betaPrivateKey, usdcBalance, betaAddress);
          depositTxHash = depositHash || undefined;
        }
      }

      return {
        ...deal,
        executed: true,
        txHash: result.txHash,
        alphaFeeAmount: parseFloat(result.feeAmount),
        alphaFeeTxHash: result.txHash,
        swapTxHash: swapResult || undefined,
        swapToAmount: swapResult ? 'USDC' : undefined,
        depositTxHash,
        status: 'active',
      };
    }

    // ── Fallback: OKX DEX swap (no vault configured) ────────────────────────
    const swapTxHash = await executeSwap(
      betaPrivateKey,
      TOKENS.USDC,
      TOKENS.NATIVE_ETH,
      amountWei.toString(),
      betaAddress
    ).catch(() => null);

    // If DEX swap fails, fall back to native transfer as proof of execution
    const txHash = swapTxHash || await executeNativeTransfer(betaPrivateKey, amountWei.toString());
    if (!txHash) return { ...deal, status: 'failed' };

    // After swap, deposit received USDC into ZeroLend for yield
    let depositTxHash: string | undefined;
    if (swapTxHash) {
      const usdcBalance = await getUSDCBalance(betaAddress);
      if (usdcBalance > 0n) {
        const depositHash = await depositUSDCToZeroLend(betaPrivateKey, usdcBalance, betaAddress);
        depositTxHash = depositHash || undefined;
      }
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
      swapTxHash: swapTxHash || undefined,
      swapToAmount: swapTxHash ? 'USDC' : undefined,
      depositTxHash,
      alphaFeeAmount,
      alphaFeeTxHash,
      status: 'active',
    };
  } catch (err) {
    console.error('Execution error:', err);
    return { ...deal, status: 'failed' };
  }
}
