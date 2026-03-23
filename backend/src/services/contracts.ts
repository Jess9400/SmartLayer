import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Load ABIs from compiled artifacts
const ARTIFACTS_DIR = path.join(__dirname, '../../../contracts/artifacts/contracts');

function loadAbi(contractName: string) {
  const file = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf-8')).abi;
}

const AGENT_REGISTRY_ABI     = loadAbi('AgentRegistry');
const REPUTATION_REGISTRY_ABI = loadAbi('ReputationRegistry');
const VAULT_ABI               = loadAbi('SmartLayerVault');

const provider = new ethers.JsonRpcProvider(process.env.XLAYER_RPC || 'https://rpc.xlayer.tech');

function getContracts(signerKey?: string) {
  const signer = signerKey
    ? new ethers.Wallet(signerKey, provider)
    : undefined;

  const connect = (addr: string, abi: any) =>
    signer ? new ethers.Contract(addr, abi, signer) : new ethers.Contract(addr, abi, provider);

  const registry   = connect(process.env.CONTRACT_AGENT_REGISTRY!,      AGENT_REGISTRY_ABI);
  const reputation = connect(process.env.CONTRACT_REPUTATION_REGISTRY!,  REPUTATION_REGISTRY_ABI);
  const vault      = connect(process.env.CONTRACT_VAULT!,                VAULT_ABI);

  return { registry, reputation, vault };
}

export function toBytes32(str: string): string {
  return ethers.encodeBytes32String(str.slice(0, 31));
}

// ── AgentRegistry ─────────────────────────────────────────────────────────────

/**
 * Get the list of Alpha agent IDs that a Beta agent is subscribed to.
 * Returns string IDs (decoded from bytes32).
 */
export async function getSubscriptionsOnChain(betaAddress: string): Promise<string[]> {
  const { registry } = getContracts();
  const raw: string[] = await registry.getSubscriptions(betaAddress);
  return raw.map((b32: string) => {
    try { return ethers.decodeBytes32String(b32); }
    catch { return b32; }
  });
}

export async function subscribeOnChain(betaPrivateKey: string, alphaId: string): Promise<string> {
  const { registry } = getContracts(betaPrivateKey);
  const tx = await registry.subscribe(toBytes32(alphaId));
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function unsubscribeOnChain(betaPrivateKey: string, alphaId: string): Promise<string> {
  const { registry } = getContracts(betaPrivateKey);
  const tx = await registry.unsubscribe(toBytes32(alphaId));
  const receipt = await tx.wait();
  return receipt.hash;
}

// ── ReputationRegistry ────────────────────────────────────────────────────────

export async function recordDealOnChain(
  operatorPrivateKey: string,
  alphaId: string,
  accepted: boolean,
  apyBps: number,
  investmentWei: bigint,
  feeWei: bigint
): Promise<string> {
  const { reputation } = getContracts(operatorPrivateKey);
  const tx = await reputation.recordDeal(
    toBytes32(alphaId),
    accepted,
    apyBps,
    investmentWei,
    feeWei
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getReputationScore(alphaId: string): Promise<number> {
  const { reputation } = getContracts();
  const score = await reputation.getScore(toBytes32(alphaId));
  return Number(score);
}

export async function getAlphaStatsOnChain(alphaId: string) {
  const { reputation } = getContracts();
  const stats = await reputation.getStats(toBytes32(alphaId));
  return {
    totalPitched:      Number(stats.totalPitched),
    totalAccepted:     Number(stats.totalAccepted),
    totalInvestedWei:  stats.totalInvestedWei.toString(),
    totalFeesEarnedWei: stats.totalFeesEarnedWei.toString(),
    lastDealAt:        Number(stats.lastDealAt),
  };
}

export async function getDealHistoryOnChain(alphaId: string) {
  const { reputation } = getContracts();
  const history = await reputation.getDealHistory(toBytes32(alphaId));
  return history.map((d: any) => ({
    alphaId:       ethers.decodeBytes32String(d.alphaId),
    accepted:      d.accepted,
    apyBps:        Number(d.apyBps),
    investmentWei: d.investmentWei.toString(),
    feeEarnedWei:  d.feeEarnedWei.toString(),
    timestamp:     Number(d.timestamp),
  }));
}

// ── SmartLayerVault ───────────────────────────────────────────────────────────

/**
 * Execute a deal via the Vault contract.
 * Beta agent calls this — enforces 97/3 split and records reputation atomically.
 */
export async function vaultExecute(
  betaPrivateKey: string,
  userAddress: string,
  alphaId: string,
  destination: string,
  amountWei: bigint,
  apyBps: number
): Promise<{ txHash: string; feeAmount: string }> {
  const { vault } = getContracts(betaPrivateKey);
  const tx = await vault.execute(
    userAddress,
    toBytes32(alphaId),
    destination,
    amountWei,
    apyBps,
    { gasLimit: 300_000n }
  );
  const receipt = await tx.wait();

  const feeAmount = (amountWei * 300n) / 10_000n;
  return {
    txHash: receipt.hash,
    feeAmount: ethers.formatEther(feeAmount),
  };
}

export async function getVaultBalance(userAddress: string): Promise<string> {
  const { vault } = getContracts();
  const bal = await vault.getBalance(userAddress);
  return ethers.formatEther(bal);
}

export async function getTVL(): Promise<string> {
  const { vault } = getContracts();
  const tvl = await vault.totalValueLocked();
  return ethers.formatEther(tvl);
}

export function contractsConfigured(): boolean {
  return !!(
    process.env.CONTRACT_AGENT_REGISTRY &&
    process.env.CONTRACT_REPUTATION_REGISTRY &&
    process.env.CONTRACT_VAULT
  );
}
