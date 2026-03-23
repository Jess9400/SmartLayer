import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

const ALPHA_AGENTS = [
  { id: 'agent-alpha-nexus',   name: 'Alpha Nexus',   pitchStyle: 'Aggressive yield hunter — leads with returns and APY upside' },
  { id: 'agent-alpha-citadel', name: 'Alpha Citadel', pitchStyle: 'Conservative blue-chip scout — leads with security and audits' },
  { id: 'agent-alpha-quant',   name: 'Alpha Quant',   pitchStyle: 'Quantitative analyst — leads with metrics and risk-adjusted returns' },
];

function toBytes32(str: string): string {
  return ethers.encodeBytes32String(str.slice(0, 31)); // max 31 chars
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('\n── SmartLayer Contract Deployment ──');
  console.log(`Deployer: ${deployer.address}`);
  const network = await ethers.provider.getNetwork();
  console.log(`Network:  chainId ${network.chainId}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} XETH\n`);

  // 1. AgentRegistry
  console.log('1/3 Deploying AgentRegistry...');
  const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`    ✓ AgentRegistry: ${registryAddress}`);

  // 2. ReputationRegistry
  console.log('2/3 Deploying ReputationRegistry...');
  const ReputationRegistry = await ethers.getContractFactory('ReputationRegistry');
  const reputation = await ReputationRegistry.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log(`    ✓ ReputationRegistry: ${reputationAddress}`);

  // 3. SmartLayerVault
  console.log('3/3 Deploying SmartLayerVault...');
  const SmartLayerVault = await ethers.getContractFactory('SmartLayerVault');
  const vault = await SmartLayerVault.deploy(reputationAddress, registryAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`    ✓ SmartLayerVault: ${vaultAddress}`);

  // 4. Authorize Vault in ReputationRegistry
  console.log('\nAuthorizing Vault in ReputationRegistry...');
  await (await reputation.setAuthorized(vaultAddress, true)).wait();
  console.log('    ✓ Vault authorized');

  // 5. Register Alpha agents (each with unique bytes32 ID, all sharing deployer feeAddress for demo)
  console.log('\nRegistering Alpha agents...');
  for (const agent of ALPHA_AGENTS) {
    const agentId = toBytes32(agent.id);
    const tx = await registry.registerAlpha(agentId, agent.name, agent.pitchStyle, deployer.address);
    await tx.wait();
    console.log(`    ✓ ${agent.name} (${agent.id}) → fee: ${deployer.address}`);
  }

  // 6. Save addresses
  const addresses = {
    agentRegistry: registryAddress,
    reputationRegistry: reputationAddress,
    smartLayerVault: vaultAddress,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
  };

  const deploymentsPath = path.join(__dirname, '../deployments.json');
  fs.writeFileSync(deploymentsPath, JSON.stringify(addresses, null, 2));
  console.log(`\n    ✓ Saved to contracts/deployments.json`);

  const envPath = path.join(__dirname, '../../backend/.env');
  const envEntry = `
# Deployed Contract Addresses
CONTRACT_AGENT_REGISTRY=${registryAddress}
CONTRACT_REPUTATION_REGISTRY=${reputationAddress}
CONTRACT_VAULT=${vaultAddress}
`;
  const existing = fs.readFileSync(envPath, 'utf-8');
  if (!existing.includes('CONTRACT_VAULT')) {
    fs.appendFileSync(envPath, envEntry);
    console.log('    ✓ Addresses appended to backend/.env');
  } else {
    // Update existing entries
    const updated = existing
      .replace(/CONTRACT_AGENT_REGISTRY=.*/,    `CONTRACT_AGENT_REGISTRY=${registryAddress}`)
      .replace(/CONTRACT_REPUTATION_REGISTRY=.*/, `CONTRACT_REPUTATION_REGISTRY=${reputationAddress}`)
      .replace(/CONTRACT_VAULT=.*/,              `CONTRACT_VAULT=${vaultAddress}`);
    fs.writeFileSync(envPath, updated);
    console.log('    ✓ Addresses updated in backend/.env');
  }

  console.log('\n── Deployment Complete ──');
  console.log(`AgentRegistry:      ${registryAddress}`);
  console.log(`ReputationRegistry: ${reputationAddress}`);
  console.log(`SmartLayerVault:    ${vaultAddress}`);
  console.log('\nView on OKLink:');
  console.log(`  https://www.oklink.com/xlayer-test/address/${vaultAddress}`);
  console.log(`  https://www.oklink.com/xlayer-test/address/${reputationAddress}`);
  console.log(`  https://www.oklink.com/xlayer-test/address/${registryAddress}`);
}

main().catch(err => { console.error(err); process.exit(1); });
