const express = require('express');
const { db } = require('../services/database');
const contractService = require('../services/contractService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const analytics = db.getAnalytics();
    
    // Get blockchain data
    const blockchainStats = await contractService.getSystemStats();
    
    // Calculate additional metrics
    const totalPolicies = analytics.totalPolicies;
    const totalClaims = analytics.totalClaims;
    const claimRatio = totalPolicies > 0 ? (totalClaims / totalPolicies * 100).toFixed(2) : 0;
    const profitLoss = analytics.totalPremiums - analytics.totalPayouts;
    
    // Get recent activity
    const recentClaims = Array.from(db.data.claims.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    const recentPolicies = Array.from(db.data.policies.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      overview: {
        totalPolicies,
        totalClaims,
        totalPremiums: analytics.totalPremiums,
        totalPayouts: analytics.totalPayouts,
        claimRatio: parseFloat(claimRatio),
        profitLoss,
        activeUsers: db.data.users.size
      },
      blockchain: blockchainStats,
      recentActivity: {
        claims: recentClaims,
        policies: recentPolicies
      },
      trends: await calculateTrends()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get claim statistics
router.get('/claims', auth, async (req, res) => {
  try {
    const claims = Array.from(db.data.claims.values());
    
    const statusCounts = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = getMonthlyClaimData(claims);
    const averageProcessingTime = calculateAverageProcessingTime(claims);
    
    res.json({
      statusDistribution: statusCounts,
      monthlyTrends: monthlyData,
      averageProcessingTime,
      totalAmount: claims.reduce((sum, claim) => sum + (claim.amount || 0), 0)
    });
  } catch (error) {
    console.error('Claim analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch claim analytics' });
  }
});

// Get policy statistics
router.get('/policies', auth, async (req, res) => {
  try {
    const policies = Array.from(db.data.policies.values());
    
    const typeCounts = policies.reduce((acc, policy) => {
      acc[policy.type] = (acc[policy.type] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = getMonthlyPolicyData(policies);
    const coverageDistribution = getCoverageDistribution(policies);
    
    res.json({
      typeDistribution: typeCounts,
      monthlyTrends: monthlyData,
      coverageDistribution,
      totalPremiums: policies.reduce((sum, policy) => sum + (policy.premium || 0), 0)
    });
  } catch (error) {
    console.error('Policy analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch policy analytics' });
  }
});

// Get risk assessment data
router.get('/risk-assessment', auth, async (req, res) => {
  try {
    const claims = Array.from(db.data.claims.values());
    const policies = Array.from(db.data.policies.values());
    
    // Calculate risk metrics
    const riskMetrics = {
      claimFrequency: calculateClaimFrequency(claims, policies),
      averageClaimAmount: calculateAverageClaimAmount(claims),
      riskByPolicyType: calculateRiskByPolicyType(claims, policies),
      fraudIndicators: await detectFraudIndicators(claims)
    };
    
    res.json(riskMetrics);
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ error: 'Failed to fetch risk assessment' });
  }
});

// Helper functions
async function calculateTrends() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const claims = Array.from(db.data.claims.values());
  const policies = Array.from(db.data.policies.values());
  
  const recentClaims = claims.filter(c => new Date(c.createdAt) >= lastMonth);
  const recentPolicies = policies.filter(p => new Date(p.createdAt) >= lastMonth);
  
  return {
    claimsGrowth: ((recentClaims.length / Math.max(claims.length - recentClaims.length, 1)) * 100).toFixed(2),
    policiesGrowth: ((recentPolicies.length / Math.max(policies.length - recentPolicies.length, 1)) * 100).toFixed(2),
    premiumGrowth: calculatePremiumGrowth(policies, lastMonth)
  };
}

function getMonthlyClaimData(claims) {
  const monthlyData = {};
  
  claims.forEach(claim => {
    const month = new Date(claim.createdAt).toISOString().slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, amount: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].amount += claim.amount || 0;
  });
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

function getMonthlyPolicyData(policies) {
  const monthlyData = {};
  
  policies.forEach(policy => {
    const month = new Date(policy.createdAt).toISOString().slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, premium: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].premium += policy.premium || 0;
  });
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
}

function getCoverageDistribution(policies) {
  const ranges = {
    'Under 1K': 0,
    '1K-10K': 0,
    '10K-50K': 0,
    '50K-100K': 0,
    'Over 100K': 0
  };
  
  policies.forEach(policy => {
    const coverage = policy.coverage || 0;
    if (coverage < 1000) ranges['Under 1K']++;
    else if (coverage < 10000) ranges['1K-10K']++;
    else if (coverage < 50000) ranges['10K-50K']++;
    else if (coverage < 100000) ranges['50K-100K']++;
    else ranges['Over 100K']++;
  });
  
  return ranges;
}

function calculateAverageProcessingTime(claims) {
  const processedClaims = claims.filter(c => c.status === 'approved' || c.status === 'rejected');
  
  if (processedClaims.length === 0) return 0;
  
  const totalTime = processedClaims.reduce((sum, claim) => {
    const created = new Date(claim.createdAt);
    const processed = new Date(claim.updatedAt);
    return sum + (processed - created);
  }, 0);
  
  return Math.round(totalTime / processedClaims.length / (1000 * 60 * 60 * 24)); // Days
}

function calculateClaimFrequency(claims, policies) {
  if (policies.length === 0) return 0;
  return ((claims.length / policies.length) * 100).toFixed(2);
}

function calculateAverageClaimAmount(claims) {
  if (claims.length === 0) return 0;
  const total = claims.reduce((sum, claim) => sum + (claim.amount || 0), 0);
  return (total / claims.length).toFixed(2);
}

function calculateRiskByPolicyType(claims, policies) {
  const riskByType = {};
  
  policies.forEach(policy => {
    if (!riskByType[policy.type]) {
      riskByType[policy.type] = { policies: 0, claims: 0 };
    }
    riskByType[policy.type].policies++;
  });
  
  claims.forEach(claim => {
    const policy = policies.find(p => p.id === claim.policyId);
    if (policy && riskByType[policy.type]) {
      riskByType[policy.type].claims++;
    }
  });
  
  Object.keys(riskByType).forEach(type => {
    const data = riskByType[type];
    data.riskRatio = data.policies > 0 ? (data.claims / data.policies * 100).toFixed(2) : 0;
  });
  
  return riskByType;
}

async function detectFraudIndicators(claims) {
  // Simple fraud detection indicators
  const indicators = {
    duplicateAmounts: 0,
    rapidSubmissions: 0,
    highValueClaims: 0
  };
  
  const amounts = claims.map(c => c.amount);
  const duplicates = amounts.filter((amount, index) => amounts.indexOf(amount) !== index);
  indicators.duplicateAmounts = new Set(duplicates).size;
  
  // Check for rapid submissions (multiple claims within 24 hours)
  claims.forEach((claim, index) => {
    const claimTime = new Date(claim.createdAt);
    const rapidClaims = claims.filter((c, i) => {
      if (i === index) return false;
      const otherTime = new Date(c.createdAt);
      return Math.abs(claimTime - otherTime) < 24 * 60 * 60 * 1000;
    });
    if (rapidClaims.length > 0) indicators.rapidSubmissions++;
  });
  
  indicators.highValueClaims = claims.filter(c => c.amount > 50000).length;
  
  return indicators;
}

function calculatePremiumGrowth(policies, lastMonth) {
  const recentPremiums = policies
    .filter(p => new Date(p.createdAt) >= lastMonth)
    .reduce((sum, p) => sum + (p.premium || 0), 0);
    
  const olderPremiums = policies
    .filter(p => new Date(p.createdAt) < lastMonth)
    .reduce((sum, p) => sum + (p.premium || 0), 0);
    
  if (olderPremiums === 0) return recentPremiums > 0 ? 100 : 0;
  return ((recentPremiums / olderPremiums) * 100).toFixed(2);
}

module.exports = router;