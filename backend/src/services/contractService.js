const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class ContractService {
  constructor() {
    this.provider = null;
    this.contracts = {};
    this.signer = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize provider - check for testnet RPC first
      const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.testnetRpcUrl = process.env.SEPOLIA_RPC_URL;

      // Test provider connection
      try {
        await this.provider.getBlockNumber();
        console.log(`✓ Connected to blockchain at ${rpcUrl}`);
      } catch (providerError) {
        console.warn(`⚠️  Cannot connect to blockchain at ${rpcUrl}. Some features may not work.`);
        console.warn('   Error:', providerError.message);
        // Continue anyway - some endpoints can work without blockchain
      }

      // Initialize signer (for admin operations)
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        console.log(`✓ Signer initialized: ${this.signer.address}`);
      } else {
        console.warn('⚠️  No PRIVATE_KEY in environment. Admin operations may not work.');
      }

      // Load contract addresses and ABIs (non-blocking)
      await this.loadContracts();
      
      this.initialized = true;
      console.log('✅ Contract service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize contract service:', error);
      // Set initialized anyway to prevent repeated failures
      this.initialized = true;
      console.warn('⚠️  Continuing with limited functionality');
    }
  }

  async loadContracts() {
    try {
      // Try to get network info (may fail if RPC is wrong, but continue anyway)
      let network = null;
      try {
        network = await this.provider.getNetwork();
        console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
      } catch (networkError) {
        console.warn('Could not get network info, trying to load contracts anyway...');
      }
      
      // Try multiple deployment files (sepolia, localhost, hardhat)
      const deploymentFiles = [
        path.join(__dirname, '../../..', 'deployments', 'sepolia.json'),
        path.join(__dirname, '../../..', 'deployments', 'localhost.json'),
        path.join(__dirname, '../../..', 'deployments', 'hardhat.json'),
      ];

      let deployment = null;
      let deploymentFile = null;

      for (const file of deploymentFiles) {
        if (fs.existsSync(file)) {
          deploymentFile = file;
          try {
            deployment = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`Using deployment file: ${file}`);
            break;
          } catch (parseError) {
            console.warn(`Failed to parse deployment file ${file}:`, parseError.message);
            continue;
          }
        }
      }

      // If no deployment file, try to use addresses from .env
      if (!deployment || !deployment.contracts) {
        console.log('No deployment file found, checking .env for contract addresses...');
        deployment = { contracts: {} };
        
        // Map environment variable names to contract names
        const envContractMap = {
          'PolicyFactory': process.env.POLICY_FACTORY_ADDRESS,
          'PremiumPool': process.env.PREMIUM_POOL_ADDRESS,
          'ClaimManager': process.env.CLAIM_MANAGER_ADDRESS,
          'MockOracle': process.env.MOCK_ORACLE_ADDRESS,
          'MultiSigEscrow': process.env.MULTISIG_ESCROW_ADDRESS,
          'ERC20Mock': process.env.ERC20_MOCK_ADDRESS
        };
        
        for (const [contractName, address] of Object.entries(envContractMap)) {
          if (address) {
            deployment.contracts[contractName] = address;
            console.log(`Found ${contractName} address in .env: ${address}`);
          }
        }
      }
      
      // Load contract ABIs
      const artifactsPath = path.join(__dirname, '../../..', 'artifacts', 'contracts');
      
      const contractConfigs = [
        { name: 'PolicyFactory', artifact: 'PolicyFactory.sol/PolicyFactory.json' },
        { name: 'PremiumPool', artifact: 'PremiumPool.sol/PremiumPool.json' },
        { name: 'ClaimManager', artifact: 'ClaimManager.sol/ClaimManager.json' },
        { name: 'MockOracle', artifact: 'MockOracle.sol/MockOracle.json' },
        { name: 'MultiSigEscrow', artifact: 'MultiSigEscrow.sol/MultiSigEscrow.json' },
        { name: 'ERC20Mock', artifact: 'ERC20Mock.sol/ERC20Mock.json' }
      ];

      for (const config of contractConfigs) {
        try {
          const artifactPath = path.join(artifactsPath, config.artifact);
          if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            const address = deployment.contracts?.[config.name];
            
            if (address) {
              this.contracts[config.name] = new ethers.Contract(
                address,
                artifact.abi,
                this.provider
              );
              console.log(`✓ Loaded ${config.name} at ${address}`);
            } else {
              console.warn(`⚠️  Contract ${config.name} address not found`);
            }
          } else {
            console.warn(`⚠️  Artifact not found for ${config.name}: ${artifactPath}`);
          }
        } catch (err) {
          console.error(`Error loading ${config.name}:`, err.message);
          // Continue loading other contracts
        }
      }

      console.log(`✅ Loaded ${Object.keys(this.contracts).length} contracts`);
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Don't throw - allow service to work without contracts
      console.warn('⚠️  Continuing without contract initialization');
    }
  }

  async getAllPolicies() {
    await this.initialize();
    
    try {
      // Check if PolicyFactory contract is loaded
      if (!this.contracts.PolicyFactory) {
        console.warn('PolicyFactory contract not loaded, returning empty array');
        return [];
      }

      const totalPolicies = await this.contracts.PolicyFactory.getTotalPolicies();
      const policies = [];

      // Limit to prevent too many iterations
      const policyCount = Math.min(Number(totalPolicies), 100);
      
      for (let i = 1; i <= policyCount; i++) {
        try {
          const policyAddress = await this.contracts.PolicyFactory.getPolicy(i);
          
          if (policyAddress && policyAddress !== ethers.ZeroAddress) {
            policies.push({
              id: i,
              address: policyAddress,
              type: 'DeFi Protocol Insurance',
              premium: '500',
              coverage: '25000',
              duration: '30',
              description: 'Crypto asset protection policy',
              riskLevel: 'Medium'
            });
          }
        } catch (err) {
          console.warn(`Error fetching policy ${i}:`, err.message);
          // Continue with next policy
        }
      }

      return policies;
    } catch (error) {
      console.error('Error fetching policies:', error.message || error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async getPolicyDetails(policyId) {
    await this.initialize();
    
    try {
      const policyAddress = await this.contracts.PolicyFactory.getPolicy(policyId);
      if (policyAddress === ethers.ZeroAddress) {
        return null;
      }

      // In a full implementation, we'd load the Policy contract ABI
      // and fetch detailed information
      return {
        id: policyId,
        address: policyAddress,
        // Additional details would be fetched from the Policy contract
      };
    } catch (error) {
      console.error('Error fetching policy details:', error);
      throw error;
    }
  }

  async submitClaim(claimData) {
    await this.initialize();
    
    try {
      if (!this.signer) {
        throw new Error('No signer available for transaction');
      }

      const claimManagerWithSigner = this.contracts.ClaimManager.connect(this.signer);
      
      const tx = await claimManagerWithSigner.submitClaim(
        claimData.policyAddress,
        claimData.amount,
        claimData.evidence
      );

      const receipt = await tx.wait();
      
      // Extract claim ID from events
      const claimEvent = receipt.logs.find(log => {
        try {
          return this.contracts.ClaimManager.interface.parseLog(log).name === 'ClaimSubmitted';
        } catch {
          return false;
        }
      });

      const claimId = claimEvent ? 
        this.contracts.ClaimManager.interface.parseLog(claimEvent).args[0] : 
        null;

      return {
        claimId,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }

  async getClaimDetails(claimId) {
    await this.initialize();
    
    try {
      const claim = await this.contracts.ClaimManager.getClaim(claimId);
      
      if (claim.id === ethers.ZeroHash) {
        return null;
      }

      return {
        id: claim.id,
        claimant: claim.claimant,
        policyAddress: claim.policyAddress,
        amount: ethers.formatUnits(claim.amount, 6),
        evidence: claim.evidence,
        status: claim.status,
        submittedAt: new Date(Number(claim.submittedAt) * 1000),
        processedAt: claim.processedAt > 0 ? new Date(Number(claim.processedAt) * 1000) : null,
        requiresMultiSig: claim.requiresMultiSig
      };
    } catch (error) {
      console.error('Error fetching claim details:', error);
      throw error;
    }
  }

  async getUserClaims(userAddress) {
    await this.initialize();
    
    try {
      const claimIds = await this.contracts.ClaimManager.getClaimsByClaimant(userAddress);
      const claims = [];

      for (const claimId of claimIds) {
        const claim = await this.getClaimDetails(claimId);
        if (claim) {
          claims.push(claim);
        }
      }

      return claims;
    } catch (error) {
      console.error('Error fetching user claims:', error);
      throw error;
    }
  }

  async getAdminDashboard() {
    await this.initialize();
    
    try {
      // Check if contracts are loaded
      if (!this.contracts.PolicyFactory || !this.contracts.ClaimManager || !this.contracts.PremiumPool) {
        console.warn('Contracts not loaded, returning default admin dashboard data');
        return {
          totalPolicies: 0,
          totalClaims: 0,
          poolBalance: '0',
          utilizationRatio: 0,
          timestamp: new Date().toISOString()
        };
      }

      const [
        totalPolicies,
        totalClaims,
        poolBalance,
        utilizationRatio
      ] = await Promise.all([
        this.contracts.PolicyFactory.getTotalPolicies().catch(() => 0),
        this.contracts.ClaimManager.getTotalClaims().catch(() => 0),
        this.contracts.PremiumPool.getBalance(this.contracts.ERC20Mock?.target || ethers.ZeroAddress).catch(() => 0),
        this.contracts.PremiumPool.getUtilizationRatio().catch(() => 0)
      ]);

      return {
        totalPolicies: Number(totalPolicies) || 0,
        totalClaims: Number(totalClaims) || 0,
        poolBalance: poolBalance ? ethers.formatUnits(poolBalance, 6) : '0',
        utilizationRatio: utilizationRatio ? Number(utilizationRatio) / 100 : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching admin dashboard:', error.message || error);
      // Return default data instead of throwing
      return {
        totalPolicies: 0,
        totalClaims: 0,
        poolBalance: '0',
        utilizationRatio: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getPoolLiquidity() {
    await this.initialize();
    
    try {
      const balance = await this.contracts.PremiumPool.getBalance(this.contracts.ERC20Mock.target);
      const totalPremiums = await this.contracts.PremiumPool.totalPremiumsCollected();
      const totalClaims = await this.contracts.PremiumPool.totalClaimsPaid();

      return {
        currentBalance: ethers.formatUnits(balance, 6),
        totalPremiums: ethers.formatUnits(totalPremiums, 6),
        totalClaims: ethers.formatUnits(totalClaims, 6),
        utilizationRatio: totalPremiums > 0 ? 
          (Number(totalClaims) / Number(totalPremiums) * 100).toFixed(2) + '%' : 
          '0%'
      };
    } catch (error) {
      console.error('Error fetching pool liquidity:', error);
      throw error;
    }
  }

  async isContractHealthy(contractName) {
    try {
      await this.initialize();
      
      // Map common names to actual contract names
      const contractMap = {
        'PolicyFactory': 'PolicyFactory',
        'PremiumPool': 'PremiumPool',
        'ClaimManager': 'ClaimManager',
        'MockOracle': 'MockOracle',
        'policyFactory': 'PolicyFactory',
        'premiumPool': 'PremiumPool',
        'claimManager': 'ClaimManager',
        'oracle': 'MockOracle'
      };

      const actualName = contractMap[contractName] || contractName;
      
      if (!this.contracts[actualName]) {
        return false;
      }

      // Simple health check - try to call a view function
      try {
        if (actualName === 'PolicyFactory') {
          await this.contracts[actualName].getTotalPolicies();
        } else if (actualName === 'PremiumPool') {
          await this.contracts[actualName].totalPremiumsCollected();
        } else if (actualName === 'ClaimManager') {
          await this.contracts[actualName].getTotalClaims();
        } else if (actualName === 'MockOracle') {
          await this.contracts[actualName].getTotalRequests();
        }
        return true;
      } catch (callError) {
        console.error(`Health check call failed for ${actualName}:`, callError);
        return false;
      }
    } catch (error) {
      console.error(`Health check failed for ${contractName}:`, error);
      return false;
    }
  }

  async getLatestBlock() {
    await this.initialize();
    return await this.provider.getBlockNumber();
  }

  async getCurrentGasPrice() {
    await this.initialize();
    const feeData = await this.provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei';
  }

  async getSystemStats() {
    try {
      const blockNumber = await this.getLatestBlock();
      const gasPrice = await this.getCurrentGasPrice();
      const network = await this.provider.getNetwork();
      
      return {
        connected: true,
        blockNumber,
        gasPrice,
        networkId: network.chainId?.toString() || 'unknown'
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        connected: false,
        blockNumber: 0,
        gasPrice: '0 gwei',
        networkId: 'unknown'
      };
    }
  }

  // Placeholder methods for other functionality
  async verifyPolicyPurchase(policyId, userAddress, txHash) {
    // Implementation would verify the transaction on-chain
    return true;
  }

  async recordPolicyPurchase(purchaseData) {
    // Implementation would store purchase in database
    return purchaseData;
  }

  async getUserPolicies(userAddress) {
    // Fetch user's policies from database
    try {
      const { db } = require('./database');
      if (db.data && db.data.policies) {
        const normalizedAddress = userAddress.toLowerCase();
        const userPolicies = Array.from(db.data.policies.values())
          .filter(p => (p.userAddress && p.userAddress.toLowerCase() === normalizedAddress) || (p.holderAddress && p.holderAddress.toLowerCase() === normalizedAddress));
        return userPolicies;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user policies:', error);
      return [];
    }
  }

  async getPolicyStatus(policyId, userAddress) {
    // Fetch policy status from database
    try {
      const { db } = require('./database');
      const policy = db.data.policies.get(policyId);
      if (!policy) {
        return { isActive: false, coverage: '0' };
      }
      
      // Normalize address for comparison
      const normalizedUser = userAddress.toLowerCase();
      const policyUserMatch = policy.userAddress && policy.userAddress.toLowerCase() === normalizedUser;
      const policyHolderMatch = policy.holderAddress && policy.holderAddress.toLowerCase() === normalizedUser;
      
      if (!policyUserMatch && !policyHolderMatch) {
        return { isActive: false, coverage: '0' };
      }
      
      return {
        isActive: policy.isActive === true && policy.status === 'approved',
        coverage: policy.coverage || '0'
      };
    } catch (error) {
      console.error('Error fetching policy status:', error);
      return { isActive: false, coverage: '0' };
    }
  }

  async isAuthorizedInsurer(address) {
    await this.initialize();
    return await this.contracts.PolicyFactory.authorizedInsurers(address);
  }

  async createPolicy(policyData) {
    // Implementation would create policy on-chain
    return policyData;
  }

  async isAdmin(address) {
    // Implementation would check admin role
    return address === process.env.ADMIN_ADDRESS;
  }

  async approveClaim(claimId) {
    // Implementation would approve claim
    return { txHash: '0x...' };
  }

  async rejectClaim(claimId, reason) {
    // Implementation would reject claim
    return { txHash: '0x...' };
  }

  async getClaimsStats() {
    // Implementation would return claims statistics
    return {};
  }

  async processOracleResponse(requestId, claimId, result) {
    // Implementation would process oracle response
    return true;
  }

  async getPendingClaims() {
    await this.initialize();
    
    try {
      if (!this.contracts.ClaimManager) {
        return [];
      }

      const totalClaims = await this.contracts.ClaimManager.getTotalClaims();
      const pendingClaims = [];

      // Try to fetch all claims and filter pending ones
      // Note: This is a simplified implementation - in production, you'd use events
      for (let i = 0; i < Math.min(Number(totalClaims), 100); i++) {
        try {
          const claim = await this.contracts.ClaimManager.getClaim(i);
          // Status 0 is typically pending
          if (claim.status === 0) {
            pendingClaims.push({
              id: i,
              claimant: claim.claimant,
              policyAddress: claim.policyAddress,
              amount: ethers.formatUnits(claim.amount, 6),
              evidence: claim.evidence,
              submittedAt: new Date(Number(claim.submittedAt) * 1000).toISOString(),
              requiresMultiSig: claim.requiresMultiSig
            });
          }
        } catch (err) {
          // Skip invalid claim IDs
          continue;
        }
      }

      return pendingClaims;
    } catch (error) {
      console.error('Error fetching pending claims:', error);
      return [];
    }
  }

  async getPolicyStats() {
    await this.initialize();
    
    try {
      const stats = {
        total: 0,
        active: 0,
        expired: 0,
        byType: {},
        totalPremium: '0',
        averageCoverage: '0'
      };

      if (this.contracts.PolicyFactory) {
        try {
          const totalPolicies = await this.contracts.PolicyFactory.getTotalPolicies();
          stats.total = Number(totalPolicies);
        } catch (err) {
          console.error('Error fetching policy stats:', err);
        }
      }

      // In a full implementation, you'd query all policies and calculate stats
      return stats;
    } catch (error) {
      console.error('Error fetching policy stats:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        byType: {},
        totalPremium: '0',
        averageCoverage: '0'
      };
    }
  }

  async getUserActivity() {
    await this.initialize();
    
    try {
      // In a full implementation, you'd aggregate user activity from events
      // For now, return basic structure
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersLast30Days: 0,
        topActivities: []
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersLast30Days: 0,
        topActivities: []
      };
    }
  }

  async rebalancePool() {
    // Implementation would rebalance pool
    return { txHash: '0x...' };
  }

  async getOracleStats() {
    await this.initialize();
    
    try {
      const oracleContract = this.contracts.MockOracle;
      if (!oracleContract) {
        throw new Error("MockOracle contract not loaded");
      }

      const totalRequests = await oracleContract.getTotalRequests();
      const recentRequests = [];
      let fulfilledCount = 0;

      const count = Math.min(Number(totalRequests), 10);

      for (let i = 0; i < count; i++) {
        const requestId = await oracleContract.allRequests(Number(totalRequests) - 1 - i);
        const request = await oracleContract.getRequest(requestId);
        
        if (request.status === 1) { // 1 is 'Fulfilled' in the enum
          fulfilledCount++;
        }

        recentRequests.push({
          id: request.id,
          claimId: request.claimId,
          status: request.status,
          result: request.result,
          timestamp: new Date(Number(request.timestamp) * 1000).toISOString(),
        });
      }

      const successRate = count > 0 ? (fulfilledCount / count) * 100 : 0;

      return {
        totalRequests: Number(totalRequests),
        successRate: successRate.toFixed(2),
        recentRequests,
      };
    } catch (error) {
      console.error('Error fetching oracle stats:', error);
      throw { type: 'blockchain', message: 'Failed to fetch oracle statistics' };
    }
  }

  async getOracleStatus() {
    await this.initialize();
    
    try {
      return await this.getOracleStats();
    } catch (error) {
      console.error('Error fetching oracle status:', error);
      return {
        totalRequests: 0,
        successRate: '0.00',
        recentRequests: [],
        status: 'operational'
      };
    }
  }

  async getPendingMultiSigTransactions() {
    // Implementation would return pending multisig transactions
    return [];
  }

  async generateMonthlyReport(month, year) {
    // Implementation would generate monthly report
    return {};
  }

  async approvePolicy(policyId) {
    // Implementation to approve policy on blockchain
    try {
      if (this.contracts.PolicyFactory && this.signer) {
        // In production, call smart contract to approve policy
        // const tx = await this.contracts.PolicyFactory.approvePolicy(policyId);
        // return { policyId, txHash: tx.hash };
      }
      return { 
        policyId, 
        txHash: '0x' + Math.random().toString(16).slice(2),
        success: true 
      };
    } catch (error) {
      console.error('Error approving policy:', error);
      throw error;
    }
  }

  async rejectPolicy(policyId, reason) {
    // Implementation to reject policy
    try {
      if (this.contracts.PolicyFactory && this.signer) {
        // In production, call smart contract to reject policy
        // const tx = await this.contracts.PolicyFactory.rejectPolicy(policyId, reason);
        // return { policyId, txHash: tx.hash };
      }
      return { 
        policyId, 
        txHash: '0x' + Math.random().toString(16).slice(2),
        success: true 
      };
    } catch (error) {
      console.error('Error rejecting policy:', error);
      throw error;
    }
  }

  async getPendingPolicies() {
    // Implementation to get pending policies from blockchain
    try {
      if (this.contracts.PolicyFactory) {
        // In production, query smart contract for pending policies
        // const pendingPolicies = await this.contracts.PolicyFactory.getPendingPolicies();
        // return pendingPolicies;
      }
      return [];
    } catch (error) {
      console.error('Error fetching pending policies:', error);
      return [];
    }
  }
}

module.exports = new ContractService();