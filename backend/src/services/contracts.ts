import { ethers } from 'ethers';
import AgentRegistryArtifact from '../abi/AgentRegistry.json';
import ReputationRegistryArtifact from '../abi/ReputationRegistry.json';
import SmartLayerVaultArtifact from '../abi/SmartLayerVault.json';

const AGENT_REGISTRY_ABI      = AgentRegistryArtifact.abi;
const REPUTATION_REGISTRY_ABI = ReputationRegistryArtifact.abi;
const VAULT_ABI               = SmartLayerVaultArtifact.abi;

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

export async function registerAlphaOnChain(
  ownerPrivateKey: string,
  alphaId: string,
  name: string,
  pitchStyle: string,
  feeAddress: string
): Promise<string> {
  const { registry } = getContracts(ownerPrivateKey);
  const tx = await registry.registerAlpha(toBytes32(alphaId), name, pitchStyle, feeAddress);
  const receipt = await tx.wait();
  return receipt.hash;
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
    totalPitched:       Number(stats.totalPitched),
    totalAccepted:      Number(stats.totalAccepted),
    totalInvestedWei:   stats.totalInvestedWei.toString(),
    totalFeesEarnedWei: stats.totalFeesEarnedWei.toString(),
    sumApyBps:          Number(stats.sumApyBps),
    lastDealAt:         Number(stats.lastDealAt),
  };
}

/**
 * Fetch the full leaderboard directly from ReputationRegistry on-chain.
 * Returns one entry per alpha with score, stats, and derived metrics.
 */
export async function getOnChainLeaderboard(alphaIds: string[]) {
  const { reputation } = getContracts();
  const entries = await Promise.all(alphaIds.map(async alphaId => {
    try {
      const [score, stats] = await Promise.all([
        reputation.getScore(toBytes32(alphaId)),
        reputation.getStats(toBytes32(alphaId)),
      ]);
      const totalPitched  = Number(stats.totalPitched);
      const totalAccepted = Number(stats.totalAccepted);
      const sumApyBps     = Number(stats.sumApyBps);
      const feesWei       = BigInt(stats.totalFeesEarnedWei.toString());
      const investedWei = BigInt(stats.totalInvestedWei.toString());
      return {
        agentId:           alphaId,
        reputationScore:   Number(score),
        totalPitched,
        totalAccepted,
        winRate:           totalPitched > 0 ? Math.round((totalAccepted / totalPitched) * 100) : 0,
        avgApy:            totalAccepted > 0 ? Math.round((sumApyBps / totalAccepted) / 10) / 10 : 0,
        totalFeesEarned:   parseFloat(ethers.formatEther(feesWei)),
        totalInvestedEth:  parseFloat(ethers.formatEther(investedWei)),
        source:            'onchain' as const,
      };
    } catch (e) {
      console.warn(`[chain] Failed to fetch stats for ${alphaId}:`, e instanceof Error ? e.message : e);
      return null;
    }
  }));
  return entries.filter(Boolean).sort((a, b) => (b!.reputationScore - a!.reputationScore));
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
    { gasLimit: 600_000n }
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

/**
 * One-time demo setup: deposit ETH into vault and assign Beta as its own agent.
 * Safe to call on every startup — skips deposit if balance already >= threshold.
 */
export async function setupVaultDemo(betaPrivateKey: string, betaAddress: string): Promise<void> {
  const { vault } = getContracts(betaPrivateKey);

  // Check current vault balance
  const vaultBal: bigint = await vault.getBalance(betaAddress);
  const threshold = ethers.parseEther('0.005');

  if (vaultBal < threshold) {
    const depositAmount = ethers.parseEther('0.01');
    console.log('[vault] Depositing 0.01 XETH into SmartLayerVault for demo...');
    const tx1 = await vault.deposit({ value: depositAmount });
    await tx1.wait();
    console.log('[vault] Deposit confirmed.');
  } else {
    console.log(`[vault] Vault balance ${ethers.formatEther(vaultBal)} XETH — skipping deposit.`);
  }

  // Assign Beta as its own agent (idempotent)
  const assigned: string = await vault.getBetaAgent(betaAddress);
  if (assigned.toLowerCase() !== betaAddress.toLowerCase()) {
    console.log('[vault] Assigning Beta as its own agent...');
    const tx2 = await vault.assignAgent(betaAddress);
    await tx2.wait();
    console.log('[vault] Agent assigned.');
  } else {
    console.log('[vault] Agent already assigned — skipping.');
  }
}
