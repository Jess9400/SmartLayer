import { ethers } from 'ethers';
import axios from 'axios';
import { IYieldAdapter, TokenSpec, DepositResult, WithdrawResult } from './IYieldAdapter';
import { TOKENS, DEFILLAMA_YIELDS_URL } from '../utils/constants';

const ZEROLEND_POOL = '0xfFd79D05D5dc37E221ed7d3971E75ed5930c6580';

const POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt) data)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
];

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
}

export class ZeroLendAdapter implements IYieldAdapter {
  readonly protocolId = 'zerolend';
  readonly protocolName = 'ZeroLend';
  readonly supportsLP = false;

  getRequiredToken(): TokenSpec {
    return { address: TOKENS.USDC, symbol: 'USDC', decimals: 6 };
  }

  async deposit(
    privateKey: string,
    amount: bigint,
    token: TokenSpec,
    onBehalfOf: string
  ): Promise<DepositResult | null> {
    if (amount === 0n) return null;
    try {
      const provider = getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const usdc = new ethers.Contract(token.address, ERC20_ABI, wallet);
      const pool = new ethers.Contract(ZEROLEND_POOL, POOL_ABI, wallet);

      console.log(`[ZeroLend] Approving ${amount} ${token.symbol}...`);
      const approveTx = await usdc.approve(ZEROLEND_POOL, amount, { gasLimit: 100000n });
      await approveTx.wait();

      console.log(`[ZeroLend] Supplying ${amount} ${token.symbol} on behalf of ${onBehalfOf}...`);
      const supplyTx = await pool.supply(token.address, amount, onBehalfOf, 0, { gasLimit: 400000n });
      const receipt = await supplyTx.wait();
      console.log(`[ZeroLend] Deposit TX: ${receipt.hash}`);

      return { txHash: receipt.hash, tokenAddress: token.address, tokenSymbol: token.symbol, amountDeposited: amount };
    } catch (err) {
      console.error('[ZeroLend] Deposit failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  async withdraw(
    privateKey: string,
    amount: bigint,
    token: TokenSpec,
    onBehalfOf: string
  ): Promise<WithdrawResult | null> {
    try {
      const provider = getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const pool = new ethers.Contract(ZEROLEND_POOL, POOL_ABI, wallet);

      // MaxUint256 = withdraw entire balance
      const withdrawAmount = amount === 0n ? ethers.MaxUint256 : amount;
      console.log(`[ZeroLend] Withdrawing ${token.symbol} for ${onBehalfOf}...`);
      const tx = await pool.withdraw(token.address, withdrawAmount, onBehalfOf, { gasLimit: 400000n });
      const receipt = await tx.wait();
      console.log(`[ZeroLend] Withdraw TX: ${receipt.hash}`);

      return { txHash: receipt.hash, amountReceived: amount };
    } catch (err) {
      console.error('[ZeroLend] Withdraw failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  async getBalance(address: string, token: TokenSpec): Promise<bigint> {
    try {
      const provider = getProvider();
      const pool = new ethers.Contract(ZEROLEND_POOL, POOL_ABI, provider);
      const reserveData = await pool.getReserveData(token.address);
      const aTokenAddress: string = reserveData.data?.aTokenAddress ?? reserveData[8];
      if (!aTokenAddress || aTokenAddress === ethers.ZeroAddress) return 0n;
      const aToken = new ethers.Contract(aTokenAddress, ERC20_ABI, provider);
      return await aToken.balanceOf(address);
    } catch {
      return 0n;
    }
  }

  async getAPY(_poolHint?: string): Promise<number> {
    try {
      const { data } = await axios.get(DEFILLAMA_YIELDS_URL, { timeout: 8000 });
      const pool = data.data.find((p: { project: string; chain: string; apy: number }) =>
        p.project?.toLowerCase() === 'zerolend' &&
        (p.chain?.toLowerCase().includes('xlayer') || p.chain?.toLowerCase().includes('x layer'))
      );
      return pool?.apy ?? 4.5;
    } catch {
      return 4.5; // fallback estimate
    }
  }
}
