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
      // Initialize provider
      const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize signer (for admin operations)
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // Load contract addresses and ABIs
      await this.loadContracts();
      
      this.initialized = true;
      console.log('✅ Contract service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize contract service:', error);
      throw error;
    }
  }

  async loadContracts() {
    try {
      const network = await this.provider.getNetwork();
      const deploymentFile = path.join(__dirname, '../../..', 'deployments', `${network.name}-${network.chainId}.json`);
      
      if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found: ${deploymentFile}`);
      }

      const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      
      // Load contract ABIs
      const artifactsPath = path.join(__dirname, '../../..', 'artifacts', 'contracts');
      
      const contractConfigs = [
        { name: 'policyFactory', artifact: 'PolicyFactory.sol/PolicyFactory.json' },
        { name: 'premiumPool', artifact: 'PremiumPool.sol/PremiumPool.json' },
        { name: 'claimManager', artifact: 'ClaimManager.sol/ClaimManager.json' },
        { name: 'mockOracle', artifact: 'MockOracle.sol/MockOracle.json' },
        { name: 'multiSigEscrow', artifact: 'MultiSigEscrow.sol/MultiSigEscrow.json' },
        { name: 'mockUSDT', artifact: 'ERC20Mock.sol/ERC20Mock.json' }
      ];

      for (const config of contractConfigs) {
        const artifactPath = path.join(artifactsPath, config.artifact);
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          const address = deployment.contracts[config.name];
          
          if (address) {
            this.contracts[config.name] = new ethers.Contract(
              address,
              artifact.abi,
              this.provider
            );
          }
        }
      }

      console.log(`Loaded ${Object.keys(this.contracts).length} contracts`);
    } catch (error) {
      console.error('Error loading contracts:', error);
      throw error;
    }
  }

  async getAllPolicies() {
    await this.initialize();
    
    try {
      const totalPolicies = await this.contracts.policyFactory.getTotalPolicies();
      const policies = [];

      for (let i = 1; i <= totalPolicies; i++) {
        const policyAddress = await this.contracts.policyFactory.getPolicy(i);
        const policyContract = new ethers.Contract(
          policyAddress,
          this.contracts.policyFactory.interface, // Use factory interface for now
          this.provider
        );

        // Get policy info (this would need the actual Policy contract ABI)
        policies.push({
          id: i,
          address: policyAddress,
          // Additional policy details would be fetched here
        });
      }

      return policies;
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  async getPolicyDetails(policyId) {
    await this.initialize();
    
    try {
      const policyAddress = await this.contracts.policyFactory.getPolicy(policyId);
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

      const claimManagerWithSigner = this.contracts.claimManager.connect(this.signer);
      
      const tx = await claimManagerWithSigner.submitClaim(
        claimData.policyAddress,
        claimData.amount,
        claimData.evidence
      );

      const receipt = await tx.wait();
      
      // Extract claim ID from events
      const claimEvent = receipt.logs.find(log => {
        try {
          return this.contracts.claimManager.interface.parseLog(log).name === 'ClaimSubmitted';
        } catch {
          return false;
        }
      });

      const claimId = claimEvent ? 
        this.contracts.claimManager.interface.parseLog(claimEvent).args[0] : 
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
      const claim = await this.contracts.claimManager.getClaim(claimId);
      
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
      const claimIds = await this.contracts.claimManager.getClaimsByClaimant(userAddress);
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
      const [
        totalPolicies,
        totalClaims,
        poolBalance,
        utilizationRatio
      ] = await Promise.all([
        this.contracts.policyFactory.getTotalPolicies(),
        this.contracts.claimManager.getTotalClaims(),
        this.contracts.premiumPool.getBalance(this.contracts.mockUSDT.target),
        this.contracts.premiumPool.getUtilizationRatio()
      ]);

      return {
        totalPolicies: Number(totalPolicies),
        totalClaims: Number(totalClaims),
        poolBalance: ethers.formatUnits(poolBalance, 6),
        utilizationRatio: Number(utilizationRatio) / 100, // Convert from basis points
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      throw error;
    }
  }

  async getPoolLiquidity() {
    await this.initialize();
    
    try {
      const balance = await this.contracts.premiumPool.getBalance(this.contracts.mockUSDT.target);
      const totalPremiums = await this.contracts.premiumPool.totalPremiumsCollected();
      const totalClaims = await this.contracts.premiumPool.totalClaimsPaid();

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
      if (!this.contracts[contractName]) {
        return false;
      }

      // Simple health check - try to call a view function
      if (contractName === 'policyFactory') {
        await this.contracts[contractName].getTotalPolicies();
      } else if (contractName === 'premiumPool') {
        await this.contracts[contractName].totalPremiumsCollected();
      } else if (contractName === 'claimManager') {
        await this.contracts[contractName].getTotalClaims();
      } else if (contractName === 'oracle') {
        await this.contracts[contractName].getTotalRequests();
      }

      return true;
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
    // Implementation would fetch user's active policies
    return [];
  }

  async getPolicyStatus(policyId, userAddress) {
    // Implementation would check policy status
    return { isActive: false, coverage: '0' };
  }

  async isAuthorizedInsurer(address) {
    await this.initialize();
    return await this.contracts.policyFactory.authorizedInsurers(address);
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
    // Implementation would fetch pending claims
    return [];
  }

  async getPolicyStats() {
    // Implementation would return policy statistics
    return {};
  }

  async getUserActivity() {
    // Implementation would return user activity metrics
    return {};
  }

  async rebalancePool() {
    // Implementation would rebalance pool
    return { txHash: '0x...' };
  }

  async getOracleStatus() {
    // Implementation would return oracle status
    return {};
  }

  async getPendingMultiSigTransactions() {
    // Implementation would return pending multisig transactions
    return [];
  }

  async generateMonthlyReport(month, year) {
    // Implementation would generate monthly report
    return {};
  }
}

module.exports = new ContractService();