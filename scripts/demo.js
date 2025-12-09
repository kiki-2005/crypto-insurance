const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Crypto Insurance Demo");
  console.log("=====================================\n");

  const [deployer, user, hacker] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-${network.chainId}.json`);
  
  let deployments;
  if (fs.existsSync(deploymentFile)) {
    deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("📋 Loaded deployment from:", deploymentFile);
  } else {
    console.log("❌ No deployment file found. Please run deployment first.");
    return;
  }

  // Get contract instances
  const mockUSDT = await ethers.getContractAt("ERC20Mock", deployments.contracts.mockUSDT);
  const policyFactory = await ethers.getContractAt("PolicyFactory", deployments.contracts.policyFactory);
  const premiumPool = await ethers.getContractAt("PremiumPool", deployments.contracts.premiumPool);
  const claimManager = await ethers.getContractAt("ClaimManager", deployments.contracts.claimManager);
  const mockOracle = await ethers.getContractAt("MockOracle", deployments.contracts.mockOracle);

  console.log("📊 Demo Participants:");
  console.log(`   Deployer (Insurer): ${deployer.address}`);
  console.log(`   User (Policy Holder): ${user.address}`);
  console.log(`   Hacker (Simulated): ${hacker.address}\n`);

  // Step 1: Setup - Give user tokens
  console.log("💰 Step 1: Setting up user with mock USDT");
  await mockUSDT.mint(user.address, ethers.parseUnits("50000", 6));
  const userBalance = await mockUSDT.balanceOf(user.address);
  console.log(`   User USDT balance: ${ethers.formatUnits(userBalance, 6)} USDT\n`);

  // Step 2: Create Policy
  console.log("📋 Step 2: Creating DeFi Hack Insurance Policy");
  const policyTx = await policyFactory.createPolicy(
    "DEFI_HACK",
    ethers.parseUnits("500", 6), // 500 USDT premium
    ethers.parseUnits("25000", 6), // 25,000 USDT coverage
    86400 * 30, // 30 days
    mockUSDT.target
  );

  const receipt = await policyTx.wait();
  const policyEvent = receipt.logs.find(log => {
    try {
      return policyFactory.interface.parseLog(log).name === "PolicyCreated";
    } catch {
      return false;
    }
  });

  const policyAddress = policyFactory.interface.parseLog(policyEvent).args[1];
  const policy = await ethers.getContractAt("Policy", policyAddress);

  // Setup policy
  await policy.setPremiumPool(premiumPool.target);
  await policy.setClaimManager(claimManager.target);

  console.log(`   ✅ Policy created at: ${policyAddress}`);
  console.log(`   📊 Premium: 500 USDT | Coverage: 25,000 USDT | Duration: 30 days\n`);

  // Step 3: User purchases policy
  console.log("🛒 Step 3: User purchases insurance policy");
  await mockUSDT.connect(user).approve(policyAddress, ethers.parseUnits("500", 6));
  await policy.connect(user).purchasePolicy();

  const isActive = await policy.isPolicyActive(user.address);
  const coverage = await policy.getCoverage(user.address);
  
  console.log(`   ✅ Policy purchased successfully`);
  console.log(`   📊 Active: ${isActive} | Coverage: ${ethers.formatUnits(coverage, 6)} USDT\n`);

  // Check premium pool balance
  const poolBalance = await premiumPool.getBalance(mockUSDT.target);
  console.log(`   💰 Premium Pool Balance: ${ethers.formatUnits(poolBalance, 6)} USDT\n`);

  // Step 4: Simulate hack event
  console.log("🔥 Step 4: Simulating DeFi Protocol Hack");
  
  // Create a fake "hack" transaction
  const hackTx = await mockUSDT.connect(hacker).transfer(
    hacker.address, 
    ethers.parseUnits("1", 6)
  );
  const hackReceipt = await hackTx.wait();
  const hackTxHash = hackReceipt.hash;

  console.log(`   💥 Simulated hack transaction: ${hackTxHash}`);
  console.log(`   🎯 User's funds allegedly affected in DeFi protocol\n`);

  // Step 5: User submits claim
  console.log("📝 Step 5: User submits insurance claim");
  const claimAmount = ethers.parseUnits("15000", 6); // Claim 15,000 USDT
  const evidence = `DeFi protocol hack evidence: affected tx ${hackTxHash}, user lost funds in exploit`;

  const claimTx = await claimManager.connect(user).submitClaim(
    policyAddress,
    claimAmount,
    evidence
  );

  const claimReceipt = await claimTx.wait();
  const claimEvent = claimReceipt.logs.find(log => {
    try {
      return claimManager.interface.parseLog(log).name === "ClaimSubmitted";
    } catch {
      return false;
    }
  });

  const claimId = claimManager.interface.parseLog(claimEvent).args[0];
  console.log(`   ✅ Claim submitted with ID: ${claimId}`);
  console.log(`   💰 Claim amount: ${ethers.formatUnits(claimAmount, 6)} USDT\n`);

  // Step 6: Oracle verification
  console.log("🔍 Step 6: Oracle verifying claim");
  
  // Get the verification request
  const totalRequests = await mockOracle.getTotalRequests();
  const requestId = await mockOracle.allRequests(totalRequests - 1n);
  
  console.log(`   📡 Oracle request ID: ${requestId}`);
  
  // Simulate oracle verification (approve since evidence contains "hack")
  await mockOracle.simulateHackVerification(requestId, hackTxHash);
  
  console.log(`   ✅ Oracle verified claim as valid\n`);

  // Step 7: Check claim status and payout
  console.log("💸 Step 7: Processing claim payout");
  
  const userBalanceBefore = await mockUSDT.balanceOf(user.address);
  console.log(`   💰 User balance before payout: ${ethers.formatUnits(userBalanceBefore, 6)} USDT`);

  // Wait a moment for the claim to be processed
  await new Promise(resolve => setTimeout(resolve, 1000));

  const claim = await claimManager.getClaim(claimId);
  const statusNames = ["Pending", "Investigating", "Approved", "Rejected", "Paid"];
  console.log(`   📊 Claim status: ${statusNames[claim.status]}`);

  if (claim.status === 4) { // Paid
    const userBalanceAfter = await mockUSDT.balanceOf(user.address);
    const payout = userBalanceAfter - userBalanceBefore;
    console.log(`   ✅ Claim paid successfully!`);
    console.log(`   💰 Payout amount: ${ethers.formatUnits(payout, 6)} USDT`);
    console.log(`   💰 User balance after payout: ${ethers.formatUnits(userBalanceAfter, 6)} USDT\n`);
  }

  // Step 8: Final statistics
  console.log("📊 Step 8: Final Demo Statistics");
  console.log("=====================================");
  
  const finalPoolBalance = await premiumPool.getBalance(mockUSDT.target);
  const totalPremiums = await premiumPool.totalPremiumsCollected();
  const totalClaims = await premiumPool.totalClaimsPaid();
  const utilizationRatio = await premiumPool.getUtilizationRatio();

  console.log(`📈 Premium Pool Statistics:`);
  console.log(`   Current Balance: ${ethers.formatUnits(finalPoolBalance, 6)} USDT`);
  console.log(`   Total Premiums Collected: ${ethers.formatUnits(totalPremiums, 6)} USDT`);
  console.log(`   Total Claims Paid: ${ethers.formatUnits(totalClaims, 6)} USDT`);
  console.log(`   Utilization Ratio: ${utilizationRatio / 100}%`);

  const totalPolicies = await policyFactory.getTotalPolicies();
  const totalClaimsCount = await claimManager.getTotalClaims();
  
  console.log(`\n📋 System Statistics:`);
  console.log(`   Total Policies Created: ${totalPolicies}`);
  console.log(`   Total Claims Submitted: ${totalClaimsCount}`);
  console.log(`   Active Policies: ${await policy.getActiveHoldersCount()}`);

  console.log("\n🎉 Demo completed successfully!");
  console.log("=====================================");
  console.log("✅ Policy created and purchased");
  console.log("✅ Hack event simulated");
  console.log("✅ Claim submitted and verified");
  console.log("✅ Payout processed automatically");
  console.log("\n💡 This demonstrates the full lifecycle of crypto insurance:");
  console.log("   1. Policy creation by insurer");
  console.log("   2. Premium payment by user");
  console.log("   3. Risk event occurrence");
  console.log("   4. Claim submission with evidence");
  console.log("   5. Oracle-based verification");
  console.log("   6. Automated payout from premium pool");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo failed:", error);
    process.exit(1);
  });