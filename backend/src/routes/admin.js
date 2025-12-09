const express = require('express');
const contractService = require('../services/contractService');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    // In production, verify admin role
    const dashboardData = await contractService.getAdminDashboard();
    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * GET /api/admin/pool/liquidity
 * Get premium pool liquidity information
 */
router.get('/pool/liquidity', auth, async (req, res) => {
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
router.get('/claims/pending', auth, async (req, res) => {
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
router.get('/policies/stats', auth, async (req, res) => {
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
router.get('/users/activity', auth, async (req, res) => {
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
router.post('/pool/rebalance', auth, async (req, res) => {
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
router.get('/oracle/status', auth, async (req, res) => {
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
router.get('/multisig/transactions', auth, async (req, res) => {
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
router.get('/reports/monthly', auth, async (req, res) => {
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
router.get('/system/health', auth, async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      blockchain: {
        connected: true,
        latestBlock: await contractService.getLatestBlock(),
        gasPrice: await contractService.getCurrentGasPrice()
      },
      contracts: {
        policyFactory: await contractService.isContractHealthy('policyFactory'),
        premiumPool: await contractService.isContractHealthy('premiumPool'),
        claimManager: await contractService.isContractHealthy('claimManager'),
        oracle: await contractService.isContractHealthy('oracle')
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