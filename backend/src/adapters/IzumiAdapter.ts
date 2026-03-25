/**
 * IzumiAdapter — concentrated liquidity LP on Izumi Finance (iZiSwap), XLayer Mainnet.
 *
 * Deposit flow:
 *   1. Router wraps native OKB → WOKB
 *   2. Read existing WETH balance from wallet (no DEX swap — OKX unreliable on XLayer)
 *   3. Approve WETH + WOKB to LiquidityManager
 *   4. Mint LP position (WETH/WOKB, fee=3000, ±20000 points) with amountMin=0
 *      so the pool absorbs whatever ratio the current price dictates
 *
 * Withdraw flow:
 *   1. Look up tokenId for wallet from izumi-nfts.json
 *   2. decLiquidity → remove all liquidity
 *   3. collect → receive WETH + WOKB back to wallet
 *
 * Verified contract addresses on XLayer Mainnet (Chain ID 196):
 *   LiquidityManager : 0xF42C48f971bDaA130573039B6c940212EeAb8496
 *   WETH/WOKB pool   : 0x7e48e0edA28b7BDb42C3A1E5F57ede20B950AeB6
 *   tokenX = WETH (0x5a77...) < tokenY = WOKB (0xe538...) — address-ordered
 */
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import axios from 'axios';
import { IYieldAdapter, TokenSpec, DepositResult, WithdrawResult } from './IYieldAdapter';
import { TOKENS, DEFILLAMA_YIELDS_URL } from '../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIQUIDITY_MANAGER = '0xF42C48f971bDaA130573039B6c940212EeAb8496';
const IZUMI_POOL        = '0x7e48e0edA28b7BDb42C3A1E5F57ede20B950AeB6';
const POOL_FEE          = 3000;
const POINT_DELTA       = 60;
const LP_RANGE          = 20000;

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const LM_ABI = [
  'function mint(tuple(address miner, address tokenX, address tokenY, uint24 fee, int24 pl, int24 pr, uint128 xLim, uint128 yLim, uint128 amountXMin, uint128 amountYMin, uint256 deadline) mintParam) payable returns (uint256 lid, uint128 liquidity, uint256 amountX, uint256 amountY)',
  'function decLiquidity(uint256 lid, uint128 liquidDelta, uint256 amountXMin, uint256 amountYMin, uint256 deadline) returns (uint256 amountX, uint256 amountY)',
  'function collect(address recipient, uint256 lid, uint128 amountXLim, uint128 amountYLim) payable returns (uint256 amountX, uint256 amountY)',
  'function liquidities(uint256 lid) view returns (int24 leftPt, int24 rightPt, uint128 liquidity, uint256 lastFeeScaleX_128, uint256 lastFeeScaleY_128, uint256 remainTokenX, uint256 remainTokenY, uint128 poolId)',
];

const POOL_ABI = [
  'function state() view returns (uint160 sqrtPrice_96, int24 currentPoint, uint16 observationCurrentIndex, uint16 observationQueueLen, uint16 observationNextQueueLen, bool locked, uint128 liquidity, uint128 liquidityX)',
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

      // amount = WOKB received from router (native OKB → WOKB wrap)
      const wokbAmount = amount;

      // Use existing WETH balance — no DEX swap needed.
      // OKX DEX WOKB→WETH is unreliable on XLayer; any WETH already in the wallet
      // (from prior interactions) is sufficient to pair with WOKB for the LP.
      const wethContract = new ethers.Contract(TOKENS.WETH, ERC20_ABI, provider);
      const wethBalance: bigint = await wethContract.balanceOf(wallet.address);
      console.log(`[Izumi] WETH balance: ${wethBalance}, WOKB to LP: ${wokbAmount}`);

      if (wethBalance === 0n) throw new Error('[Izumi] No WETH in wallet — cannot mint LP');

      // ── Get current pool point ────────────────────────────────────────────────
      const pool  = new ethers.Contract(IZUMI_POOL, POOL_ABI, provider);
      const state = await pool.state();
      const currentPoint = Number(state.currentPoint);
      const pl = alignPoint(currentPoint - LP_RANGE, 'floor');
      const pr = alignPoint(currentPoint + LP_RANGE, 'ceil');
      console.log(`[Izumi] LP range: [${pl}, ${pr}] current: ${currentPoint}`);

      // ── Approve both tokens ───────────────────────────────────────────────────
      const weth = new ethers.Contract(TOKENS.WETH, ERC20_ABI, wallet);
      const wokb = new ethers.Contract(TOKENS.WOKB, ERC20_ABI, wallet);
      console.log('[Izumi] Approving WETH + WOKB to LiquidityManager...');
      await Promise.all([
        (await weth.approve(LIQUIDITY_MANAGER, wethBalance, { gasLimit: 100000n })).wait(),
        (await wokb.approve(LIQUIDITY_MANAGER, wokbAmount,  { gasLimit: 100000n })).wait(),
      ]);

      // ── Mint LP — amountMin=0 so pool accepts any ratio ───────────────────────
      const lm       = new ethers.Contract(LIQUIDITY_MANAGER, LM_ABI, wallet);
      const deadline = Math.floor(Date.now() / 1000) + 600;

      console.log('[Izumi] Minting WETH/WOKB LP position...');
      const mintTx = await lm.mint(
        {
          miner:      onBehalfOf,
          tokenX:     TOKENS.WETH,
          tokenY:     TOKENS.WOKB,
          fee:        POOL_FEE,
          pl,
          pr,
          xLim:       wethBalance,
          yLim:       wokbAmount,
          amountXMin: 0n,   // accept any ratio — small amounts, liquidity not the goal
          amountYMin: 0n,
          deadline,
        },
        { gasLimit: 600000n }
      );
      const receipt = await mintTx.wait() as ethers.TransactionReceipt;
      console.log(`[Izumi] Mint TX: ${receipt.hash}`);

      const lid = parseLidFromReceipt(receipt);
      console.log(`[Izumi] LP NFT tokenId: ${lid}`);
      addTokenId(onBehalfOf, lid.toString());

      const pos = await lm.liquidities(lid);
      const liquidity: bigint = pos.liquidity;

      return {
        txHash:          receipt.hash,
        tokenAddress:    LIQUIDITY_MANAGER,
        tokenSymbol:     'WETH/WOKB LP',
        amountDeposited: liquidity,
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
