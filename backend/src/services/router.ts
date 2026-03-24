/**
 * Capital Router
 *
 * Given a deal and an XETH amount, routes capital end-to-end:
 *   1. Look up protocol adapter
 *   2. Determine required input token
 *   3. Swap XETH → required token via OKX DEX
 *   4. Read received balance
 *   5. Deposit into protocol via adapter
 *   6. Return all tx hashes + metadata for deal record
 */
import { ethers } from 'ethers';
import { Deal } from '../types';
import { getAdapter } from '../adapters/AdapterRegistry';
import { executeSwap } from './okx';
import { TOKENS } from '../utils/constants';

const ERC20_ABI = ['function balanceOf(address owner) external view returns (uint256)'];

export interface RouteResult {
  adapterUsed: string;
  swapTxHash?: string;
  depositTxHash?: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  amountDeposited: bigint;
}

export async function routeCapital(
  privateKey: string,
  betaAddress: string,
  xethAmountWei: string,
  deal: Deal
): Promise<RouteResult | null> {
  const adapter = getAdapter(deal.protocol);
  const token = adapter.getRequiredToken();

  console.log(`[Router] Protocol: ${deal.protocol} → Adapter: ${adapter.protocolName}`);
  console.log(`[Router] Swapping ${xethAmountWei} XETH → ${token.symbol}...`);

  // Step 1: Swap XETH → required token
  const swapTxHash = await executeSwap(
    privateKey,
    token.address,
    TOKENS.NATIVE_ETH,
    xethAmountWei,
    betaAddress
  ).catch(e => { console.warn('[Router] Swap failed:', e.message); return null; });

  if (!swapTxHash) {
    console.warn('[Router] Swap returned no txHash — aborting deposit');
    return null;
  }

  // Step 2: Read received token balance
  const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
  const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
  const balance: bigint = await tokenContract.balanceOf(betaAddress).catch(() => 0n);

  if (balance === 0n) {
    console.warn(`[Router] ${token.symbol} balance is 0 after swap — skipping deposit`);
    return { adapterUsed: adapter.protocolName, swapTxHash, tokenSymbol: token.symbol, tokenAddress: token.address, tokenDecimals: token.decimals, amountDeposited: 0n };
  }

  console.log(`[Router] Received ${balance} ${token.symbol} (raw). Depositing into ${adapter.protocolName}...`);

  // Step 3: Deposit into protocol
  const result = await adapter.deposit(privateKey, balance, token, betaAddress);

  if (!result) {
    console.warn('[Router] Deposit returned null — swap succeeded but deposit failed');
    return { adapterUsed: adapter.protocolName, swapTxHash, tokenSymbol: token.symbol, tokenAddress: token.address, tokenDecimals: token.decimals, amountDeposited: 0n };
  }

  return {
    adapterUsed: adapter.protocolName,
    swapTxHash,
    depositTxHash: result.txHash,
    tokenSymbol: token.symbol,
    tokenAddress: token.address,
    tokenDecimals: token.decimals,
    amountDeposited: result.amountDeposited,
  };
}
