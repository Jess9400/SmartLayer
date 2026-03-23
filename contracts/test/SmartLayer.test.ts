import { ethers } from 'hardhat';
import { expect } from 'chai';
import { AgentRegistry, ReputationRegistry, SmartLayerVault } from '../typechain-types';

describe('SmartLayer Contracts', () => {
  let registry: AgentRegistry;
  let reputation: ReputationRegistry;
  let vault: SmartLayerVault;
  let owner: any, alpha: any, beta: any, user: any;

  const ALPHA_ID = ethers.encodeBytes32String('agent-alpha-nexus');
  const ALPHA_NAME = 'Alpha Nexus';
  const ALPHA_STYLE = 'Aggressive yield hunter';
  const APY_BPS = 1500;

  beforeEach(async () => {
    [owner, alpha, beta, user] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
    registry = await AgentRegistry.deploy();

    const ReputationRegistry = await ethers.getContractFactory('ReputationRegistry');
    reputation = await ReputationRegistry.deploy();

    const SmartLayerVault = await ethers.getContractFactory('SmartLayerVault');
    vault = await SmartLayerVault.deploy(await reputation.getAddress(), await registry.getAddress());

    await reputation.setAuthorized(await vault.getAddress(), true);
  });

  describe('AgentRegistry', () => {
    it('registers Alpha agents with unique bytes32 IDs', async () => {
      await registry.registerAlpha(ALPHA_ID, ALPHA_NAME, ALPHA_STYLE, alpha.address);
      const info = await registry.alphaAgents(ALPHA_ID);
      expect(info.name).to.equal(ALPHA_NAME);
      expect(info.feeAddress).to.equal(alpha.address);
      expect(info.active).to.be.true;
    });

    it('allows multiple agents sharing the same feeAddress', async () => {
      const id1 = ethers.encodeBytes32String('agent-alpha-nexus');
      const id2 = ethers.encodeBytes32String('agent-alpha-citadel');
      // Both use same feeAddress (demo mode)
      await registry.registerAlpha(id1, 'Alpha Nexus', ALPHA_STYLE, alpha.address);
      await registry.registerAlpha(id2, 'Alpha Citadel', ALPHA_STYLE, alpha.address);
      expect((await registry.alphaAgents(id1)).name).to.equal('Alpha Nexus');
      expect((await registry.alphaAgents(id2)).name).to.equal('Alpha Citadel');
    });

    it('reverts if non-owner tries to register', async () => {
      await expect(
        registry.connect(user).registerAlpha(ALPHA_ID, ALPHA_NAME, ALPHA_STYLE, alpha.address)
      ).to.be.revertedWithCustomError(registry, 'NotOwner');
    });

    it('allows subscribe and unsubscribe', async () => {
      await registry.registerAlpha(ALPHA_ID, ALPHA_NAME, ALPHA_STYLE, alpha.address);
      await registry.connect(beta).subscribe(ALPHA_ID);
      expect(await registry.isSubscribed(beta.address, ALPHA_ID)).to.be.true;
      const subs = await registry.getSubscriptions(beta.address);
      expect(subs).to.include(ALPHA_ID);

      await registry.connect(beta).unsubscribe(ALPHA_ID);
      expect(await registry.isSubscribed(beta.address, ALPHA_ID)).to.be.false;
    });
  });

  describe('ReputationRegistry', () => {
    it('records deals and returns a score', async () => {
      await reputation.recordDeal(ALPHA_ID, true, APY_BPS, ethers.parseEther('0.001'), ethers.parseEther('0.00003'));
      await reputation.recordDeal(ALPHA_ID, true, APY_BPS, ethers.parseEther('0.001'), ethers.parseEther('0.00003'));
      await reputation.recordDeal(ALPHA_ID, false, APY_BPS, 0, 0);

      const s = await reputation.getStats(ALPHA_ID);
      expect(s.totalPitched).to.equal(3);
      expect(s.totalAccepted).to.equal(2);

      const score = await reputation.getScore(ALPHA_ID);
      expect(score).to.be.gt(0).and.lte(100);
    });

    it('rejects unauthorized callers', async () => {
      await expect(
        reputation.connect(user).recordDeal(ALPHA_ID, true, APY_BPS, 0, 0)
      ).to.be.revertedWithCustomError(reputation, 'NotAuthorized');
    });
  });

  describe('SmartLayerVault', () => {
    const depositAmount = ethers.parseEther('0.01');
    const dealAmount = ethers.parseEther('0.001');

    beforeEach(async () => {
      await registry.registerAlpha(ALPHA_ID, ALPHA_NAME, ALPHA_STYLE, alpha.address);
      await vault.connect(user).deposit({ value: depositAmount });
      await vault.connect(user).assignAgent(beta.address);
    });

    it('tracks deposits correctly', async () => {
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

    it('executes deal: 97/3 split + records reputation', async () => {
      const dest = ethers.Wallet.createRandom().address;
      const alphaBalBefore = await ethers.provider.getBalance(alpha.address);

      await vault.connect(beta).execute(user.address, ALPHA_ID, dest, dealAmount, APY_BPS);

      const expectedFee = (dealAmount * 300n) / 10000n;
      const alphaBalAfter = await ethers.provider.getBalance(alpha.address);
      expect(alphaBalAfter - alphaBalBefore).to.equal(expectedFee);
      expect(await vault.getBalance(user.address)).to.equal(depositAmount - dealAmount);

      const s = await reputation.getStats(ALPHA_ID);
      expect(s.totalAccepted).to.equal(1);
      expect(s.totalFeesEarnedWei).to.equal(expectedFee);
    });

    it('reverts if wrong Beta agent calls execute', async () => {
      await expect(
        vault.connect(owner).execute(user.address, ALPHA_ID, owner.address, dealAmount, APY_BPS)
      ).to.be.revertedWithCustomError(vault, 'NotBetaAgent');
    });

    it('reverts on insufficient balance', async () => {
      await expect(
        vault.connect(beta).execute(user.address, ALPHA_ID, beta.address, ethers.parseEther('1'), APY_BPS)
      ).to.be.revertedWithCustomError(vault, 'InsufficientBalance');
    });
  });
});
