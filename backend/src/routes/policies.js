const express = require('express');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');
const contractService = require('../services/contractService');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/policies
 * Get all available policies
 */
router.get('/', async (req, res) => {
  try {
    const policies = await contractService.getAllPolicies();
    // If no policies from blockchain, return empty array (frontend will use mock data)
    res.json({ policies: policies || [] });
  } catch (error) {
    console.error('Error fetching policies:', error.message || error);
    // Return empty array instead of error so frontend can use mock data
    res.json({ policies: [] });
  }
});

/**
 * GET /api/policies/:id
 * Get specific policy details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await contractService.getPolicyDetails(id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json({ policy });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy details' });
  }
});

/**
 * POST /api/policies/:id/purchase
 * Purchase a policy
 */
router.post('/:id/purchase', 
  auth,
  [
    body('userAddress').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('txHash').isLength({ min: 66, max: 66 }).withMessage('Invalid transaction hash')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { userAddress, txHash } = req.body;

      // Verify the purchase transaction
      const isValid = await contractService.verifyPolicyPurchase(id, userAddress, txHash);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid purchase transaction' });
      }

      // Store purchase record in database
      const purchase = await contractService.recordPolicyPurchase({
        policyId: id,
        userAddress,
        txHash,
        timestamp: new Date()
      });

      res.json({ 
        success: true, 
        purchase,
        message: 'Policy purchased successfully' 
      });
    } catch (error) {
      console.error('Error purchasing policy:', error);
      res.status(500).json({ error: 'Failed to purchase policy' });
    }
  }
);

/**
 * GET /api/policies/user/:address
 * Get user's policies
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const userPolicies = await contractService.getUserPolicies(address);
    res.json({ policies: userPolicies });
  } catch (error) {
    console.error('Error fetching user policies:', error);
    res.status(500).json({ error: 'Failed to fetch user policies' });
  }
});

/**
 * POST /api/policies/create
 * Create new policy (insurer only)
 */
router.post('/create',
  auth,
  [
    body('policyType').notEmpty().withMessage('Policy type is required'),
    body('premium').isNumeric().withMessage('Premium must be numeric'),
    body('coverage').isNumeric().withMessage('Coverage must be numeric'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be positive integer'),
    body('premiumToken').isEthereumAddress().withMessage('Invalid token address')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { policyType, premium, coverage, duration, premiumToken } = req.body;
      
      // Check if user is authorized insurer
      const isAuthorized = await contractService.isAuthorizedInsurer(req.user.address);
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Not authorized to create policies' });
      }

      const policy = await contractService.createPolicy({
        policyType,
        premium: ethers.parseUnits(premium.toString(), 6),
        coverage: ethers.parseUnits(coverage.toString(), 6),
        duration,
        premiumToken,
        insurer: req.user.address
      });

      res.json({ 
        success: true, 
        policy,
        message: 'Policy created successfully' 
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Failed to create policy' });
    }
  }
);

/**
 * GET /api/policies/:id/status
 * Check policy status for user
 */
router.get('/:id/status/:address', async (req, res) => {
  try {
    const { id, address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const status = await contractService.getPolicyStatus(id, address);
    res.json({ status });
  } catch (error) {
    console.error('Error checking policy status:', error);
    res.status(500).json({ error: 'Failed to check policy status' });
  }
});

module.exports = router;