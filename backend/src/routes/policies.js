const express = require('express');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');
const contractService = require('../services/contractService');
const { db } = require('../services/database');
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
    body('userAddress').optional().isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('txHash').optional().isLength({ min: 60 }).withMessage('Invalid transaction hash')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userAddress = req.user?.address || req.body?.userAddress;
      const txHash = req.body?.txHash;

      if (!userAddress) {
        return res.status(400).json({ error: 'User address is required' });
      }

      // Get the policy template
      const policyTemplate = await contractService.getPolicyDetails(id).catch(() => null);

      // Create a pending approval policy in the database
      const purchase = db.createPolicy({
        templateId: id,
        type: policyTemplate?.type || 'Insurance Policy',
        premium: policyTemplate?.premium || 100,
        coverage: policyTemplate?.coverage || 50000,
        duration: policyTemplate?.duration || 30,
        userAddress: userAddress,
        holderAddress: userAddress,
        txHash: txHash || '0x' + Math.random().toString(16).slice(2),
        status: 'pending_approval',
        description: policyTemplate?.description || 'Crypto asset protection policy',
        isActive: false
      });

      res.json({ 
        success: true, 
        purchase,
        message: 'Policy purchase submitted for approval'
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

    // Normalize address to lowercase for comparison
    const normalizedAddress = address.toLowerCase();
    let userPolicies = await contractService.getUserPolicies(normalizedAddress);
    
    // If no policies from blockchain, try to get from database directly
    if (!userPolicies || userPolicies.length === 0) {
      try {
        const { db } = require('../services/database');
        if (db.data && db.data.policies) {
          userPolicies = Array.from(db.data.policies.values())
            .filter(p => (p.userAddress && p.userAddress.toLowerCase() === normalizedAddress) || (p.holderAddress && p.holderAddress.toLowerCase() === normalizedAddress));
        }
      } catch (dbError) {
        console.warn('Could not fetch from database:', dbError);
      }
    }
    
    res.json({ policies: userPolicies || [] });
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

/**
 * POST /api/policies/:id/cancel
 * Cancel an approved policy
 */
router.post('/:id/cancel',
  auth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userAddress = req.user?.address;

      if (!userAddress) {
        return res.status(400).json({ error: 'User address is required' });
      }

      // Get the policy
      const policy = db.data.policies.get(id);
      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      // Verify user owns this policy
      const normalizedUser = userAddress.toLowerCase();
      const isOwner = (policy.userAddress && policy.userAddress.toLowerCase() === normalizedUser) ||
                      (policy.holderAddress && policy.holderAddress.toLowerCase() === normalizedUser);

      if (!isOwner) {
        return res.status(403).json({ error: 'You do not own this policy' });
      }

      // Can only cancel approved or active policies
      if (policy.status !== 'approved' && policy.status !== 'active' && !policy.isActive) {
        return res.status(400).json({ error: 'Only approved policies can be cancelled' });
      }

      // Update policy status to cancelled
      const updatedPolicy = db.updatePolicy(id, {
        status: 'cancelled',
        isActive: false,
        cancelledAt: new Date().toISOString()
      });

      res.json({
        success: true,
        policy: updatedPolicy,
        message: 'Policy cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling policy:', error);
      res.status(500).json({ error: 'Failed to cancel policy' });
    }
  }
);

module.exports = router;