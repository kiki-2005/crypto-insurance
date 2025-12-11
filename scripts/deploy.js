const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying to Sepolia testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy ERC20 Mock Token for testing
  console.log("\n📄 Deploying ERC20Mock...");
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const token = await ERC20Mock.deploy("Insurance Token", "INS", ethers.utils.parseEther("1000000"));
  await token.deployed();
  console.log("ERC20Mock deployed to:", token.address);

  // Deploy Premium Pool
  console.log("\n💰 Deploying PremiumPool...");
  const PremiumPool = await ethers.getContractFactory("PremiumPool");
  const premiumPool = await PremiumPool.deploy();
  await premiumPool.deployed();
  console.log("PremiumPool deployed to:", premiumPool.address);

  // Deploy Mock Oracle
  console.log("\n🔮 Deploying MockOracle...");
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const oracle = await MockOracle.deploy();
  await oracle.deployed();
  console.log("MockOracle deployed to:", oracle.address);

  // Deploy MultiSig Escrow
  console.log("\n🔐 Deploying MultiSigEscrow...");
  const MultiSigEscrow = await ethers.getContractFactory("MultiSigEscrow");
  const multiSig = await MultiSigEscrow.deploy([deployer.address], 1); // Single signer for testing
  await multiSig.deployed();
  console.log("MultiSigEscrow deployed to:", multiSig.address);

  // Deploy Claim Manager
  console.log("\n⚖️ Deploying ClaimManager...");
  const ClaimManager = await ethers.getContractFactory("ClaimManager");
  const claimManager = await ClaimManager.deploy(
    premiumPool.address,
    oracle.address,
    multiSig.address
  );
  await claimManager.deployed();
  console.log("ClaimManager deployed to:", claimManager.address);

  // Deploy Policy Factory
  console.log("\n🏭 Deploying PolicyFactory...");
  const PolicyFactory = await ethers.getContractFactory("PolicyFactory");
  const policyFactory = await PolicyFactory.deploy(premiumPool.address, claimManager.address);
  await policyFactory.deployed();
  console.log("PolicyFactory deployed to:", policyFactory.address);

  // Setup permissions
  console.log("\n🔧 Setting up permissions...");
  await premiumPool.authorizeWithdrawer(claimManager.address);
  console.log("✅ ClaimManager authorized as withdrawer");

  // Create deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    contracts: {
      ERC20Mock: token.address,
      PremiumPool: premiumPool.address,
      MockOracle: oracle.address,
      MultiSigEscrow: multiSig.address,
      ClaimManager: claimManager.address,
      PolicyFactory: policyFactory.address
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Save deployment info
  fs.writeFileSync(
    "./deployments/sepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("Network:", "Sepolia Testnet");
  console.log("Chain ID:", "11155111");
  console.log("Deployer:", deployer.address);
  console.log("\n📄 Contract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });

  console.log("\n🔗 Etherscan Links:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`${name}: https://sepolia.etherscan.io/address/${address}`);
  });

  console.log("\n⚙️ Environment Variables:");
  console.log("POLICY_FACTORY_ADDRESS=" + policyFactory.address);
  console.log("CLAIM_MANAGER_ADDRESS=" + claimManager.address);
  console.log("PREMIUM_POOL_ADDRESS=" + premiumPool.address);
  console.log("MULTISIG_ESCROW_ADDRESS=" + multiSig.address);
  console.log("MOCK_ORACLE_ADDRESS=" + oracle.address);
  console.log("ERC20_MOCK_ADDRESS=" + token.address);

  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });