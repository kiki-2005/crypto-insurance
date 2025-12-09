const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const deployments = {};

  // Deploy Mock ERC20 tokens (for testnets)
  console.log("\n=== Deploying Mock Tokens ===");
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  
  const mockUSDT = await ERC20Mock.deploy(
    "Mock USDT",
    "MUSDT",
    6,
    ethers.parseUnits("1000000", 6)
  );
  await mockUSDT.waitForDeployment();
  deployments.mockUSDT = mockUSDT.target;
  console.log("Mock USDT deployed to:", mockUSDT.target);

  const mockUSDC = await ERC20Mock.deploy(
    "Mock USDC",
    "MUSDC",
    6,
    ethers.parseUnits("1000000", 6)
  );
  await mockUSDC.waitForDeployment();
  deployments.mockUSDC = mockUSDC.target;
  console.log("Mock USDC deployed to:", mockUSDC.target);

  // Deploy core contracts
  console.log("\n=== Deploying Core Contracts ===");
  
  // Deploy PolicyFactory
  const PolicyFactory = await ethers.getContractFactory("PolicyFactory");
  const policyFactory = await PolicyFactory.deploy();
  await policyFactory.waitForDeployment();
  deployments.policyFactory = policyFactory.target;
  console.log("PolicyFactory deployed to:", policyFactory.target);

  // Deploy PremiumPool
  const PremiumPool = await ethers.getContractFactory("PremiumPool");
  const premiumPool = await PremiumPool.deploy();
  await premiumPool.waitForDeployment();
  deployments.premiumPool = premiumPool.target;
  console.log("PremiumPool deployed to:", premiumPool.target);

  // Deploy MockOracle
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy();
  await mockOracle.waitForDeployment();
  deployments.mockOracle = mockOracle.target;
  console.log("MockOracle deployed to:", mockOracle.target);

  // Deploy MultiSigEscrow (with deployer as initial signer)
  const MultiSigEscrow = await ethers.getContractFactory("MultiSigEscrow");
  const multiSigEscrow = await MultiSigEscrow.deploy(
    [deployer.address], // Initial signers
    1 // Required signatures
  );
  await multiSigEscrow.waitForDeployment();
  deployments.multiSigEscrow = multiSigEscrow.target;
  console.log("MultiSigEscrow deployed to:", multiSigEscrow.target);

  // Deploy ClaimManager
  const ClaimManager = await ethers.getContractFactory("ClaimManager");
  const claimManager = await ClaimManager.deploy(
    premiumPool.target,
    mockOracle.target,
    multiSigEscrow.target
  );
  await claimManager.waitForDeployment();
  deployments.claimManager = claimManager.target;
  console.log("ClaimManager deployed to:", claimManager.target);

  // Setup permissions
  console.log("\n=== Setting up permissions ===");
  
  // Authorize ClaimManager to withdraw from PremiumPool
  await premiumPool.authorizeWithdrawer(claimManager.target);
  console.log("Authorized ClaimManager as withdrawer for PremiumPool");

  // Create sample policy
  console.log("\n=== Creating sample policy ===");
  const samplePolicyTx = await policyFactory.createPolicy(
    "DEFI_HACK",
    ethers.parseUnits("100", 6), // 100 USDT premium
    ethers.parseUnits("10000", 6), // 10,000 USDT coverage
    86400 * 30, // 30 days
    mockUSDT.target
  );
  
  const receipt = await samplePolicyTx.wait();
  const policyCreatedEvent = receipt.logs.find(log => {
    try {
      return policyFactory.interface.parseLog(log).name === "PolicyCreated";
    } catch {
      return false;
    }
  });
  
  if (policyCreatedEvent) {
    const parsedEvent = policyFactory.interface.parseLog(policyCreatedEvent);
    deployments.samplePolicy = parsedEvent.args[1];
    console.log("Sample policy created at:", parsedEvent.args[1]);
    
    // Setup policy with premium pool and claim manager
    const Policy = await ethers.getContractFactory("Policy");
    const samplePolicy = Policy.attach(parsedEvent.args[1]);
    await samplePolicy.setPremiumPool(premiumPool.target);
    await samplePolicy.setClaimManager(claimManager.target);
    console.log("Sample policy configured with PremiumPool and ClaimManager");
  }

  // Save deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify({
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployments
  }, null, 2));

  console.log(`\n=== Deployment Summary ===`);
  console.log(`Network: ${network.name} (${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployment file: ${deploymentFile}`);
  console.log("\nContract Addresses:");
  Object.entries(deployments).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Update frontend configuration with contract addresses");
  console.log("3. Fund PremiumPool with mock tokens for testing");
  console.log("4. Test the demo script: npm run demo");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });