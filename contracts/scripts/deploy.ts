import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

// Alpha agent configs — must match backend/src/utils/constants.ts
const ALPHA_AGENTS = [
  {
    address: '', // filled from env at runtime
    name: 'Alpha Nexus',
    pitchStyle: 'Aggressive yield hunter — leads with returns and APY upside',
  },
  {
    address: '', // all share same wallet in demo
    name: 'Alpha Citadel',
    pitchStyle: 'Conservative blue-chip scout — leads with security and audits',
  },
  {
    address: '', // all share same wallet in demo
    name: 'Alpha Quant',
    pitchStyle: 'Quantitative analyst — leads with metrics and risk-adjusted returns',
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('\n── SmartLayer Contract Deployment ──');
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network:  ${(await ethers.provider.getNetwork()).name} (chainId: ${(await ethers.provider.getNetwork()).chainId})`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} XETH\n`);

  // 1. Deploy AgentRegistry
  console.log('1/3 Deploying AgentRegistry...');
  const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`    ✓ AgentRegistry: ${registryAddress}`);

  // 2. Deploy ReputationRegistry
  console.log('2/3 Deploying ReputationRegistry...');
  const ReputationRegistry = await ethers.getContractFactory('ReputationRegistry');
  const reputation = await ReputationRegistry.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log(`    ✓ ReputationRegistry: ${reputationAddress}`);

  // 3. Deploy SmartLayerVault (depends on ReputationRegistry)
  console.log('3/3 Deploying SmartLayerVault...');
  const SmartLayerVault = await ethers.getContractFactory('SmartLayerVault');
  const vault = await SmartLayerVault.deploy(reputationAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`    ✓ SmartLayerVault: ${vaultAddress}`);

  // 4. Authorize Vault to record deals in ReputationRegistry
  console.log('\nAuthorizing Vault in ReputationRegistry...');
  const authTx = await reputation.setAuthorized(vaultAddress, true);
  await authTx.wait();
  console.log('    ✓ Vault authorized');

  // 5. Register Alpha agents in AgentRegistry
  console.log('\nRegistering Alpha agents...');
  for (const agent of ALPHA_AGENTS) {
    const addr = agent.address || deployer.address; // demo: all share deployer wallet
    const tx = await registry.registerAlpha(addr, agent.name, agent.pitchStyle);
    await tx.wait();
    console.log(`    ✓ ${agent.name} → ${addr}`);
  }

  // 6. Write addresses to backend .env and a JSON file for frontend
  const addresses = {
    agentRegistry: registryAddress,
    reputationRegistry: reputationAddress,
    smartLayerVault: vaultAddress,
    network: 'xlayer',
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
  };

  // Write to contracts/deployments.json
  const deploymentsPath = path.join(__dirname, '../deployments.json');
  fs.writeFileSync(deploymentsPath, JSON.stringify(addresses, null, 2));
  console.log(`\n    ✓ Addresses saved to contracts/deployments.json`);

  // Append to backend .env
  const envPath = path.join(__dirname, '../../backend/.env');
  const envAdditions = `
# Deployed Contract Addresses
CONTRACT_AGENT_REGISTRY=${registryAddress}
CONTRACT_REPUTATION_REGISTRY=${reputationAddress}
CONTRACT_VAULT=${vaultAddress}
`;
  fs.appendFileSync(envPath, envAdditions);
  console.log('    ✓ Contract addresses appended to backend/.env');

  console.log('\n── Deployment Complete ──');
  console.log(`AgentRegistry:      ${registryAddress}`);
  console.log(`ReputationRegistry: ${reputationAddress}`);
  console.log(`SmartLayerVault:    ${vaultAddress}`);
  console.log('\nVerify on OKLink:');
  console.log(`  https://www.oklink.com/xlayer/address/${vaultAddress}`);
  console.log(`  https://www.oklink.com/xlayer/address/${reputationAddress}`);
  console.log(`  https://www.oklink.com/xlayer/address/${registryAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
