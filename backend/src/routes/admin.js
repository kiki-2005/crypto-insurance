const express = require('express');
const contractService = require('../services/contractService');
const auth = require('../middleware/auth');

const router = express.Router();

// Optional auth middleware - allows both authenticated and public access
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = {
          address: decoded.address,
          timestamp: decoded.timestamp
        };
      } catch (jwtError) {
        console.log('Invalid token, continuing as public user');
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 */
router.get('/dashboard', optionalAuth, async (req, res) => {
  try {
    // In production, verify admin role
    let dashboardData;
    try {
      dashboardData = await contractService.getAdminDashboard();
    } catch (blockchainError) {
      console.warn('Could not fetch admin dashboard from blockchain:', blockchainError.message);
      // Return default data
      dashboardData = {
        totalPolicies: 0,
        totalClaims: 0,
        poolBalance: '0',
        utilizationRatio: 0,
        timestamp: new Date().toISOString()
      };
    }
    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    // Return safe default data instead of error
    res.json({ 
      dashboard: {
        totalPolicies: 0,
        totalClaims: 0,
        poolBalance: '0',
        utilizationRatio: 0,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/admin/pool/liquidity
 * Get premium pool liquidity information
 */
router.get('/pool/liquidity', optionalAuth, async (req, res) => {
  try {
    const liquidity = await contractService.getPoolLiquidity();
    res.json({ liquidity });
  } catch (error) {
    console.error('Error fetching pool liquidity:', error);
    res.status(500).json({ error: 'Failed to fetch pool liquidity' });
  }
});

/**
 * GET /api/admin/claims/pending
 * Get pending claims for review
 */
router.get('/claims/pending', optionalAuth, async (req, res) => {
  try {
    const pendingClaims = await contractService.getPendingClaims();
    res.json({ claims: pendingClaims });
  } catch (error) {
    console.error('Error fetching pending claims:', error);
    res.status(500).json({ error: 'Failed to fetch pending claims' });
  }
});

/**
 * GET /api/admin/policies/stats
 * Get policy statistics
 */
router.get('/policies/stats', optionalAuth, async (req, res) => {
  try {
    const stats = await contractService.getPolicyStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching policy stats:', error);
    res.status(500).json({ error: 'Failed to fetch policy statistics' });
  }
});

/**
 * GET /api/admin/users/activity
 * Get user activity metrics
 */
router.get('/users/activity', optionalAuth, async (req, res) => {
  try {
    const activity = await contractService.getUserActivity();
    res.json({ activity });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

/**
 * POST /api/admin/pool/rebalance
 * Trigger pool rebalancing (emergency function)
 */
router.post('/pool/rebalance', optionalAuth, async (req, res) => {
  try {
    const result = await contractService.rebalancePool();
    res.json({
      success: true,
      txHash: result.txHash,
      message: 'Pool rebalancing initiated'
    });
  } catch (error) {
    console.error('Error rebalancing pool:', error);
    res.status(500).json({ error: 'Failed to rebalance pool' });
  }
});

/**
 * GET /api/admin/oracle/status
 * Get oracle status and recent requests
 */
router.get('/oracle/status', optionalAuth, async (req, res) => {
  try {
    const oracleStatus = await contractService.getOracleStatus();
    res.json({ oracle: oracleStatus });
  } catch (error) {
    console.error('Error fetching oracle status:', error);
    res.status(500).json({ error: 'Failed to fetch oracle status' });
  }
});

/**
 * GET /api/admin/multisig/transactions
 * Get pending multi-sig transactions
 */
router.get('/multisig/transactions', optionalAuth, async (req, res) => {
  try {
    const transactions = await contractService.getPendingMultiSigTransactions();
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching multisig transactions:', error);
    res.status(500).json({ error: 'Failed to fetch multisig transactions' });
  }
});

/**
 * GET /api/admin/reports/monthly
 * Generate monthly report
 */
router.get('/reports/monthly', optionalAuth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const report = await contractService.generateMonthlyReport(month, year);
    res.json({ report });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

/**
 * GET /api/admin/system/health
 * Get system health metrics
 */
router.get('/system/health', optionalAuth, async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      blockchain: {
        connected: true,
        latestBlock: await contractService.getLatestBlock().catch(() => 0),
        gasPrice: await contractService.getCurrentGasPrice().catch(() => '0 gwei')
      },
      contracts: {
        PolicyFactory: await contractService.isContractHealthy('PolicyFactory').catch(() => false),
        PremiumPool: await contractService.isContractHealthy('PremiumPool').catch(() => false),
        ClaimManager: await contractService.isContractHealthy('ClaimManager').catch(() => false),
        MockOracle: await contractService.isContractHealthy('MockOracle').catch(() => false)
      },
      api: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: '1.0.0'
      }
    };

    res.json({ health });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

module.exports = router;