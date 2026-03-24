import { ethers } from 'ethers';
import { TOKENS } from '../utils/constants';

const ZEROLEND_POOL = '0xfFd79D05D5dc37E221ed7d3971E75ed5930c6580';

const POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
];

export async function depositUSDCToZeroLend(
  privateKey: string,
  usdcAmount: bigint,   // in USDC base units (6 decimals)
  onBehalfOf: string
): Promise<string | null> {
  try {
    if (usdcAmount === 0n) return null;

    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
    const wallet = new ethers.Wallet(privateKey, provider);

    const usdc = new ethers.Contract(TOKENS.USDC, ERC20_ABI, wallet);
    const pool = new ethers.Contract(ZEROLEND_POOL, POOL_ABI, wallet);

    // Step 1: Approve ZeroLend pool to spend USDC
    console.log(`[ZeroLend] Approving ${usdcAmount} USDC for ZeroLend pool...`);
    const approveTx = await usdc.approve(ZEROLEND_POOL, usdcAmount, { gasLimit: 100000n });
    await approveTx.wait();
    console.log(`[ZeroLend] Approval TX: ${approveTx.hash}`);

    // Step 2: Supply USDC to ZeroLend — receive z0USDC aTokens
    console.log(`[ZeroLend] Supplying ${usdcAmount} USDC to ZeroLend...`);
    const supplyTx = await pool.supply(TOKENS.USDC, usdcAmount, onBehalfOf, 0, { gasLimit: 400000n });
    const receipt = await supplyTx.wait();
    console.log(`[ZeroLend] Supply TX: ${receipt.hash}`);

    return receipt.hash;
  } catch (err) {
    console.error('[ZeroLend] Deposit failed (non-fatal):', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getUSDCBalance(address: string): Promise<bigint> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
    const usdc = new ethers.Contract(TOKENS.USDC, ERC20_ABI, provider);
    return await usdc.balanceOf(address);
  } catch {
    return 0n;
  }
}
