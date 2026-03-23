import { ethers } from 'hardhat';
import { expect } from 'chai';
import { AgentRegistry, ReputationRegistry, SmartLayerVault } from '../typechain-types';

describe('SmartLayer Contracts', () => {
  let registry: AgentRegistry;
  let reputation: ReputationRegistry;
  let vault: SmartLayerVault;
  let owner: any, alpha: any, beta: any, user: any;

  const ALPHA_NAME = 'Alpha Nexus';
  const ALPHA_STYLE = 'Aggressive yield hunter';
  const APY_BPS = 1500; // 15%

  beforeEach(async () => {
    [owner, alpha, beta, user] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
    registry = await AgentRegistry.deploy();

    const ReputationRegistry = await ethers.getContractFactory('ReputationRegistry');
    reputation = await ReputationRegistry.deploy();

    const SmartLayerVault = await ethers.getContractFactory('SmartLayerVault');
    vault = await SmartLayerVault.deploy(await reputation.getAddress());

    // Authorize vault to record deals
    await reputation.setAuthorized(await vault.getAddress(), true);
  });

  // ── AgentRegistry ──────────────────────────────────────────────────────────

  describe('AgentRegistry', () => {
    it('registers an Alpha agent', async () => {
      await registry.registerAlpha(alpha.address, ALPHA_NAME, ALPHA_STYLE);
      const info = await registry.alphaAgents(alpha.address);
      expect(info.name).to.equal(ALPHA_NAME);
      expect(info.active).to.be.true;
    });

    it('reverts if non-owner tries to register', async () => {
      await expect(
        registry.connect(user).registerAlpha(alpha.address, ALPHA_NAME, ALPHA_STYLE)
      ).to.be.revertedWithCustomError(registry, 'NotOwner');
    });

    it('allows Beta to subscribe and unsubscribe', async () => {
      await registry.registerAlpha(alpha.address, ALPHA_NAME, ALPHA_STYLE);

      await registry.connect(beta).subscribe(alpha.address);
      expect(await registry.isSubscribed(beta.address, alpha.address)).to.be.true;

      const subs = await registry.getSubscriptions(beta.address);
      expect(subs).to.include(alpha.address);

      await registry.connect(beta).unsubscribe(alpha.address);
      expect(await registry.isSubscribed(beta.address, alpha.address)).to.be.false;
    });

    it('reverts subscribe to unregistered Alpha', async () => {
      await expect(
        registry.connect(beta).subscribe(alpha.address)
      ).to.be.revertedWithCustomError(registry, 'AlphaNotRegistered');
    });
  });

  // ── ReputationRegistry ─────────────────────────────────────────────────────

  describe('ReputationRegistry', () => {
    it('records deals and computes score', async () => {
      // 3 accepted, 1 rejected
      await reputation.recordDeal(alpha.address, true, APY_BPS, ethers.parseEther('0.001'), ethers.parseEther('0.00003'));
      await reputation.recordDeal(alpha.address, true, APY_BPS, ethers.parseEther('0.001'), ethers.parseEther('0.00003'));
      await reputation.recordDeal(alpha.address, true, APY_BPS, ethers.parseEther('0.001'), ethers.parseEther('0.00003'));
      await reputation.recordDeal(alpha.address, false, APY_BPS, 0, 0);

      const s = await reputation.getStats(alpha.address);
      expect(s.totalPitched).to.equal(4);
      expect(s.totalAccepted).to.equal(3);

      const score = await reputation.getScore(alpha.address);
      expect(score).to.be.gt(0);
      expect(score).to.be.lte(100);
    });

    it('returns 0 score for new agent', async () => {
      expect(await reputation.getScore(alpha.address)).to.equal(0);
    });

    it('rejects unauthorized record attempts', async () => {
      await expect(
        reputation.connect(user).recordDeal(alpha.address, true, APY_BPS, 0, 0)
      ).to.be.revertedWithCustomError(reputation, 'NotAuthorized');
    });
  });

  // ── SmartLayerVault ────────────────────────────────────────────────────────

  describe('SmartLayerVault', () => {
    const depositAmount = ethers.parseEther('0.01');
    const dealAmount = ethers.parseEther('0.001');

    beforeEach(async () => {
      // User deposits and assigns Beta agent
      await vault.connect(user).deposit({ value: depositAmount });
      await vault.connect(user).assignAgent(beta.address);
    });

    it('accepts deposits and tracks balances', async () => {
      expect(await vault.getBalance(user.address)).to.equal(depositAmount);
      expect(await vault.totalValueLocked()).to.equal(depositAmount);
    });

    it('allows user to withdraw', async () => {
      const before = await ethers.provider.getBalance(user.address);
      const tx = await vault.connect(user).withdraw(depositAmount);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * tx.gasPrice!;
      const after = await ethers.provider.getBalance(user.address);
      expect(after + gasCost - before).to.be.closeTo(depositAmount, ethers.parseEther('0.0001'));
    });

    it('executes deal with 97/3 split and records reputation', async () => {
      const destination = ethers.Wallet.createRandom().address;
      const alphaBalBefore = await ethers.provider.getBalance(alpha.address);

      await vault.connect(beta).execute(
        user.address,
        alpha.address,
        destination,
        dealAmount,
        APY_BPS
      );

      // 3% fee goes to Alpha
      const expectedFee = (dealAmount * 300n) / 10000n;
      const alphaBalAfter = await ethers.provider.getBalance(alpha.address);
      expect(alphaBalAfter - alphaBalBefore).to.equal(expectedFee);

      // User balance reduced
      expect(await vault.getBalance(user.address)).to.equal(depositAmount - dealAmount);

      // Reputation recorded
      const s = await reputation.getStats(alpha.address);
      expect(s.totalAccepted).to.equal(1);
      expect(s.totalFeesEarnedWei).to.equal(expectedFee);
    });

    it('reverts if non-Beta agent tries to execute', async () => {
      await expect(
        vault.connect(owner).execute(user.address, alpha.address, alpha.address, dealAmount, APY_BPS)
      ).to.be.revertedWithCustomError(vault, 'NotBetaAgent');
    });

    it('reverts if insufficient balance', async () => {
      await expect(
        vault.connect(beta).execute(user.address, alpha.address, alpha.address, ethers.parseEther('1'), APY_BPS)
      ).to.be.revertedWithCustomError(vault, 'InsufficientBalance');
    });
  });
});
