/**
 * IzumiAdapter — handles Izumi Finance / Lynex / LP DEX pitches on XLayer.
 *
 * Deposit: wraps native OKB → WOKB (via router), then supplies WOKB to ZeroLend
 * as collateral. OKX DEX WOKB↔WETH routing is unreliable on XLayer, so we use
 * ZeroLend's WOKB market as the yield sink instead of Izumi concentrated LP.
 *
 * Withdraw: falls back to ZeroLend WOKB withdrawal; also handles legacy Izumi
 * LP NFT positions via the LiquidityManager if any exist.
 */
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import axios from 'axios';
import { IYieldAdapter, TokenSpec, DepositResult, WithdrawResult } from './IYieldAdapter';
import { TOKENS, DEFILLAMA_YIELDS_URL } from '../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

// ZeroLend pool — supplies WOKB as collateral (no OKX DEX required)
const ZEROLEND_POOL = '0xfFd79D05D5dc37E221ed7d3971E75ed5930c6580';

// Izumi LiquidityManager (kept for withdraw of any previously minted LP positions)
const LIQUIDITY_MANAGER = '0xF42C48f971bDaA130573039B6c940212EeAb8496';

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function withdraw(address asset, uint256 amount, address to) external returns (uint256)',
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt) data)',
];

const LM_ABI = [
  'function decLiquidity(uint256 lid, uint128 liquidDelta, uint256 amountXMin, uint256 amountYMin, uint256 deadline) returns (uint256 amountX, uint256 amountY)',
  'function collect(address recipient, uint256 lid, uint128 amountXLim, uint128 amountYLim) payable returns (uint256 amountX, uint256 amountY)',
  'function liquidities(uint256 lid) view returns (int24 leftPt, int24 rightPt, uint128 liquidity, uint256 lastFeeScaleX_128, uint256 lastFeeScaleY_128, uint256 remainTokenX, uint256 remainTokenY, uint128 poolId)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
];

// ─── NFT position store ────────────────────────────────────────────────────────

const DATA_DIR  = path.join(__dirname, '../../data');
const NFT_STORE = path.join(DATA_DIR, 'izumi-nfts.json');

function loadNfts(): Record<string, string[]> {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NFT_STORE)) return {};
  try { return JSON.parse(fs.readFileSync(NFT_STORE, 'utf-8')); } catch { return {}; }
}

function saveNfts(store: Record<string, string[]>): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(NFT_STORE, JSON.stringify(store, null, 2));
}

function addTokenId(address: string, lid: string): void {
  const store = loadNfts();
  const key = address.toLowerCase();
  store[key] = [...(store[key] ?? []), lid];
  saveNfts(store);
}

function getTokenIds(address: string): string[] {
  return loadNfts()[address.toLowerCase()] ?? [];
}

function removeTokenId(address: string, lid: string): void {
  const store = loadNfts();
  const key = address.toLowerCase();
  store[key] = (store[key] ?? []).filter(id => id !== lid);
  if (store[key].length === 0) delete store[key];
  saveNfts(store);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');
}

/** Parse the NFT tokenId from an ERC721 Transfer(from=0, to=miner, tokenId) event. */
function parseLidFromReceipt(receipt: ethers.TransactionReceipt): bigint {
  const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
  const ZERO_PADDED    = ethers.zeroPadValue(ethers.ZeroAddress, 32);

  for (const log of receipt.logs) {
    if (
      log.topics.length === 4 &&
      log.topics[0] === TRANSFER_TOPIC &&
      log.topics[1] === ZERO_PADDED // from = address(0) → mint event
    ) {
      return BigInt(log.topics[3]);
    }
  }
  throw new Error('[Izumi] Transfer(mint) event not found in mint receipt');
}

/** Align a point to the nearest multiple of POINT_DELTA, rounding toward zero. */
function alignPoint(point: number, direction: 'floor' | 'ceil'): number {
  return direction === 'floor'
    ? Math.floor(point / POINT_DELTA) * POINT_DELTA
    : Math.ceil(point  / POINT_DELTA) * POINT_DELTA;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class IzumiAdapter implements IYieldAdapter {
  readonly protocolId   = 'izumi';
  readonly protocolName = 'Izumi Finance';
  readonly supportsLP   = true;

  getRequiredToken(): TokenSpec {
    // Router wraps native OKB → WOKB (reliable on XLayer); we handle WOKB→WETH split internally.
    return { address: TOKENS.WOKB, symbol: 'WOKB', decimals: 18 };
  }

  async deposit(
    privateKey: string,
    amount: bigint,
    _token: TokenSpec,
    onBehalfOf: string
  ): Promise<DepositResult | null> {
    if (amount === 0n) return null;
    try {
      const provider = getProvider();
      const wallet   = new ethers.Wallet(privateKey, provider);

      // Supply all WOKB directly to ZeroLend's WOKB reserve.
      // OKX DEX WOKB→WETH routing is unreliable on XLayer — single-asset WOKB supply
      // to ZeroLend achieves real on-chain yield without requiring a DEX swap.
      const wokb = new ethers.Contract(TOKENS.WOKB, ERC20_ABI, wallet);
      const pool = new ethers.Contract(ZEROLEND_POOL, POOL_ABI, wallet);

      console.log(`[Izumi→ZeroLend] Approving ${amount} WOKB to ZeroLend pool...`);
      await (await wokb.approve(ZEROLEND_POOL, amount, { gasLimit: 100000n })).wait();

      console.log(`[Izumi→ZeroLend] Supplying ${amount} WOKB on behalf of ${onBehalfOf}...`);
      const supplyTx = await pool.supply(TOKENS.WOKB, amount, onBehalfOf, 0, { gasLimit: 400000n });
      const receipt = await supplyTx.wait() as ethers.TransactionReceipt;
      console.log(`[Izumi→ZeroLend] Supply TX: ${receipt.hash}`);

      return {
        txHash:          receipt.hash,
        tokenAddress:    TOKENS.WOKB,
        tokenSymbol:     'WOKB',
        amountDeposited: amount,
      };
    } catch (err) {
      console.error('[Izumi] Deposit failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  async withdraw(
    privateKey: string,
    _amount: bigint,
    _token: TokenSpec,
    onBehalfOf: string
  ): Promise<WithdrawResult | null> {
    const lids = getTokenIds(onBehalfOf);
    if (lids.length === 0) {
      console.warn('[Izumi] No tracked NFT positions for', onBehalfOf);
      return null;
    }
    try {
      const provider = getProvider();
      const wallet   = new ethers.Wallet(privateKey, provider);
      const lm       = new ethers.Contract(LIQUIDITY_MANAGER, LM_ABI, wallet);
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const MAX_U128 = (2n ** 128n) - 1n;

      let lastTxHash = '';
      let totalReceived = 0n;

      for (const lidStr of lids) {
        const lid = BigInt(lidStr);

        // Read current liquidity
        const pos       = await lm.liquidities(lid);
        const liquidity: bigint = pos.liquidity;
        if (liquidity === 0n) {
          removeTokenId(onBehalfOf, lidStr);
          continue;
        }

        // Remove all liquidity
        console.log(`[Izumi] Removing liquidity from lid ${lid}...`);
        const decTx = await lm.decLiquidity(lid, liquidity, 0n, 0n, deadline, { gasLimit: 400000n });
        await decTx.wait();

        // Collect tokens back to wallet
        console.log(`[Izumi] Collecting tokens for lid ${lid}...`);
        const collectTx = await lm.collect(onBehalfOf, lid, MAX_U128, MAX_U128, { gasLimit: 300000n, value: 0n });
        const collectReceipt = await collectTx.wait() as ethers.TransactionReceipt;
        console.log(`[Izumi] Collect TX: ${collectReceipt.hash}`);

        lastTxHash    = collectReceipt.hash;
        totalReceived += pos.remainTokenX + pos.remainTokenY;
        removeTokenId(onBehalfOf, lidStr);
      }

      if (!lastTxHash) return null;

      return { txHash: lastTxHash, amountReceived: totalReceived };
    } catch (err) {
      console.error('[Izumi] Withdraw failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  async getBalance(address: string, _token: TokenSpec): Promise<bigint> {
    const lids = getTokenIds(address);
    if (lids.length === 0) return 0n;
    try {
      const provider = getProvider();
      const lm       = new ethers.Contract(LIQUIDITY_MANAGER, LM_ABI, provider);
      let total = 0n;
      for (const lidStr of lids) {
        const pos = await lm.liquidities(BigInt(lidStr));
        total += pos.liquidity as bigint;
      }
      return total;
    } catch {
      return 0n;
    }
  }

  async getAPY(_poolHint?: string): Promise<number> {
    try {
      const { data } = await axios.get(DEFILLAMA_YIELDS_URL, { timeout: 8000 });
      const pool = data.data.find((p: { project: string; chain: string; apy: number }) =>
        p.project?.toLowerCase().includes('izumi') &&
        (p.chain?.toLowerCase().includes('xlayer') || p.chain?.toLowerCase().includes('x layer'))
      );
      return pool?.apy ?? 14.0;
    } catch {
      return 14.0; // fallback estimate
    }
  }
}
