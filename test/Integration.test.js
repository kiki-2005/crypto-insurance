const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests", function () {
  let policyFactory, premiumPool, claimManager, mockOracle, multiSigEscrow, mockToken;
  let owner, insurer, user, signer1, signer2, signer3;
  let policyAddress;

  beforeEach(async function () {
    [owner, insurer, user, signer1, signer2, signer3] = await ethers.getSigners();

    // Deploy mock token
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mockToken = await ERC20Mock.deploy("Mock USDT", "MUSDT", 6, ethers.parseUnits("1000000", 6));

    // Deploy contracts
    const PolicyFactory = await ethers.getContractFactory("PolicyFactory");
    policyFactory = await PolicyFactory.deploy();

    const PremiumPool = await ethers.getContractFactory("PremiumPool");
    premiumPool = await PremiumPool.deploy();

    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy();

    const MultiSigEscrow = await ethers.getContractFactory("MultiSigEscrow");
    multiSigEscrow = await MultiSigEscrow.deploy(
      [signer1.address, signer2.address, signer3.address],
      2 // Require 2 signatures
    );

    const ClaimManager = await ethers.getContractFactory("ClaimManager");
    claimManager = await ClaimManager.deploy(
      premiumPool.target,
      mockOracle.target,
      multiSigEscrow.target
    );

    // Setup permissions
    await policyFactory.authorizeInsurer(insurer.address);
    await premiumPool.authorizeWithdrawer(claimManager.target);
    await mockOracle.authorizeOperator(owner.address);

    // Mint tokens to user
    await mockToken.mint(user.address, ethers.parseUnits("100000", 6));
  });

  describe("End-to-End Claim Flow", function () {
    beforeEach(async function () {
      // Create policy
      const tx = await policyFactory.connect(insurer).createPolicy(
        "DEFI_HACK",
        ethers.parseUnits("100", 6), // 100 USDT premium
        ethers.parseUnits("10000", 6), // 10,000 USDT coverage
        86400 * 30, // 30 days
        mockToken.target
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "PolicyCreated");
      policyAddress = event.args[1];

      // Setup policy with premium pool and claim manager
      const Policy = await ethers.getContractFactory("Policy");
      const policy = Policy.attach(policyAddress);
      await policy.connect(insurer).setPremiumPool(premiumPool.target);
      await policy.connect(insurer).setClaimManager(claimManager.target);
    });

    it("Should complete full claim lifecycle", async function () {
      const Policy = await ethers.getContractFactory("Policy");
      const policy = Policy.attach(policyAddress);

      // Step 1: User purchases policy
      await mockToken.connect(user).approve(policyAddress, ethers.parseUnits("100", 6));
      await policy.connect(user).purchasePolicy();

      expect(await policy.isPolicyActive(user.address)).to.be.true;

      // Step 2: User submits claim
      const claimTx = await claimManager.connect(user).submitClaim(
        policyAddress,
        ethers.parseUnits("5000", 6), // Claim 5,000 USDT
        "DeFi protocol hack evidence: tx hash 0x123..."
      );

      const claimReceipt = await claimTx.wait();
      const claimEvent = claimReceipt.logs.find(log => log.fragment?.name === "ClaimSubmitted");
      const claimId = claimEvent.args[0];

      // Step 3: Oracle verifies claim
      const requests = await mockOracle.getTotalRequests();
      const requestId = await mockOracle.allRequests(requests - 1n);
      
      await mockOracle.simulateHackVerification(requestId, "0x123hack456");

      // Step 4: Check claim status
      const claim = await claimManager.getClaim(claimId);
      expect(claim.status).to.equal(2); // Approved

      // Step 5: Verify payout
      const userBalanceBefore = await mockToken.balanceOf(user.address);
      
      // Wait for automatic payout processing
      await ethers.provider.send("evm_mine");
      
      const userBalanceAfter = await mockToken.balanceOf(user.address);
      expect(userBalanceAfter).to.be.gt(userBalanceBefore);
    });

    it("Should handle claim rejection", async function () {
      const Policy = await ethers.getContractFactory("Policy");
      const policy = Policy.attach(policyAddress);

      // User purchases policy
      await mockToken.connect(user).approve(policyAddress, ethers.parseUnits("100", 6));
      await policy.connect(user).purchasePolicy();

      // Submit claim with invalid evidence
      const claimTx = await claimManager.connect(user).submitClaim(
        policyAddress,
        ethers.parseUnits("5000", 6),
        "Invalid evidence without hack keyword"
      );

      const claimReceipt = await claimTx.wait();
      const claimEvent = claimReceipt.logs.find(log => log.fragment?.name === "ClaimSubmitted");
      const claimId = claimEvent.args[0];

      // Oracle rejects claim
      const requests = await mockOracle.getTotalRequests();
      const requestId = await mockOracle.allRequests(requests - 1n);
      
      await mockOracle.fulfillVerification(requestId, false);

      // Check claim status
      const claim = await claimManager.getClaim(claimId);
      expect(claim.status).to.equal(3); // Rejected
    });
  });

  describe("Multi-Sig High-Value Claims", function () {
    beforeEach(async function () {
      // Create high-coverage policy
      const tx = await policyFactory.connect(insurer).createPolicy(
        "EXCHANGE_HACK",
        ethers.parseUnits("1000", 6), // 1,000 USDT premium
        ethers.parseUnits("100000", 6), // 100,000 USDT coverage
        86400 * 30,
        mockToken.target
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "PolicyCreated");
      policyAddress = event.args[1];

      const Policy = await ethers.getContractFactory("Policy");
      const policy = Policy.attach(policyAddress);
      await policy.connect(insurer).setPremiumPool(premiumPool.target);
      await policy.connect(insurer).setClaimManager(claimManager.target);

      // Fund premium pool
      await mockToken.mint(premiumPool.target, ethers.parseUnits("200000", 6));
    });

    it("Should require multi-sig for high-value claims", async function () {
      const Policy = await ethers.getContractFactory("Policy");
      const policy = Policy.attach(policyAddress);

      // User purchases policy
      await mockToken.connect(user).approve(policyAddress, ethers.parseUnits("1000", 6));
      await policy.connect(user).purchasePolicy();

      // Submit high-value claim (>10k threshold)
      const claimTx = await claimManager.connect(user).submitClaim(
        policyAddress,
        ethers.parseUnits("50000", 6), // 50,000 USDT claim
        "Major exchange hack evidence: tx hash 0x456hack789"
      );

      const claimReceipt = await claimTx.wait();
      const claimEvent = claimReceipt.logs.find(log => log.fragment?.name === "ClaimSubmitted");
      const claimId = claimEvent.args[0];

      // Check that claim requires multi-sig
      const claim = await claimManager.getClaim(claimId);
      expect(claim.requiresMultiSig).to.be.true;

      // Oracle approves claim
      const requests = await mockOracle.getTotalRequests();
      const requestId = await mockOracle.allRequests(requests - 1n);
      await mockOracle.simulateHackVerification(requestId, "0x456hack789");

      // Claim should be investigating (waiting for multi-sig)
      const updatedClaim = await claimManager.getClaim(claimId);
      expect(updatedClaim.status).to.equal(1); // Investigating
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should measure gas costs for key operations", async function () {
      // Create policy
      const tx1 = await policyFactory.connect(insurer).createPolicy(
        "GAS_TEST",
        ethers.parseUnits("100", 6),
        ethers.parseUnits("10000", 6),
        86400 * 30,
        mockToken.target
      );
      const receipt1 = await tx1.wait();
      console.log(`Policy creation gas: ${receipt1.gasUsed}`);

      const event = receipt1.logs.find(log => log.fragment?.name === "PolicyCreated");
      policyAddress = event.args[1];

      const Policy = await ethers.getContractFactory("Policy");
      const policy = Policy.attach(policyAddress);
      await policy.connect(insurer).setPremiumPool(premiumPool.target);
      await policy.connect(insurer).setClaimManager(claimManager.target);

      // Purchase policy
      await mockToken.connect(user).approve(policyAddress, ethers.parseUnits("100", 6));
      const tx2 = await policy.connect(user).purchasePolicy();
      const receipt2 = await tx2.wait();
      console.log(`Policy purchase gas: ${receipt2.gasUsed}`);

      // Submit claim
      const tx3 = await claimManager.connect(user).submitClaim(
        policyAddress,
        ethers.parseUnits("5000", 6),
        "Gas test hack evidence"
      );
      const receipt3 = await tx3.wait();
      console.log(`Claim submission gas: ${receipt3.gasUsed}`);
    });
  });
});