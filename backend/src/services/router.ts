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
const WETH_ABI  = ['function deposit() external payable', 'function balanceOf(address) view returns (uint256)'];

/** Wrap native XETH → WETH directly via WETH contract deposit() — more reliable than OKX DEX routing. */
async function wrapXethToWeth(privateKey: string, amountWei: string): Promise<string | null> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
    const wallet = new ethers.Wallet(privateKey, provider);
    const weth = new ethers.Contract(TOKENS.WETH, WETH_ABI, wallet);
    const tx = await weth.deposit({ value: BigInt(amountWei), gasLimit: 60000n });
    const receipt = await tx.wait();
    return receipt?.hash || null;
  } catch (err) {
    console.error('[Router] WETH wrap failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

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
  // For WETH: wrap directly via WETH.deposit() — OKX DEX doesn't reliably route native→WETH on XLayer
  const isWeth = token.address.toLowerCase() === TOKENS.WETH.toLowerCase();
  const swapTxHash = isWeth
    ? await wrapXethToWeth(privateKey, xethAmountWei)
    : await executeSwap(privateKey, token.address, TOKENS.NATIVE_ETH, xethAmountWei, betaAddress)
        .catch(e => { console.warn('[Router] Swap failed:', e.message); return null; });

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
