const express = require('express');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const contractService = require('../services/contractService');
const fraudDetection = require('../services/fraudDetection');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

/**
 * POST /api/claims/submit
 * Submit insurance claim
 */
router.post('/submit',
  auth,
  upload.array('evidence', 5), // Allow up to 5 evidence files
  [
    body('policyId').isNumeric().withMessage('Policy ID must be numeric'),
    body('amount').isNumeric().withMessage('Amount must be numeric'),
    body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('incidentDate').isISO8601().withMessage('Invalid incident date'),
    body('txHashes').optional().isArray().withMessage('Transaction hashes must be array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { policyId, amount, description, incidentDate, txHashes } = req.body;
      const userAddress = req.user.address;

      // Verify user has active policy
      const policyStatus = await contractService.getPolicyStatus(policyId, userAddress);
      if (!policyStatus.isActive) {
        return res.status(400).json({ error: 'Policy is not active' });
      }

      // Check coverage limit
      if (parseFloat(amount) > parseFloat(policyStatus.coverage)) {
        return res.status(400).json({ error: 'Claim amount exceeds coverage' });
      }

      // Run fraud detection
      const fraudCheck = await fraudDetection.analyzeClaim({
        userAddress,
        policyId,
        amount,
        description,
        incidentDate,
        txHashes: txHashes || [],
        files: req.files || []
      });

      if (fraudCheck.riskScore > 0.8) {
        return res.status(400).json({ 
          error: 'Claim flagged for manual review',
          riskScore: fraudCheck.riskScore,
          flags: fraudCheck.flags
        });
      }

      // Prepare evidence string
      const evidenceData = {
        description,
        incidentDate,
        txHashes: txHashes || [],
        files: req.files ? req.files.map(f => f.filename) : [],
        timestamp: new Date().toISOString()
      };

      // Submit claim to blockchain
      const claimResult = await contractService.submitClaim({
        policyId,
        userAddress,
        amount: ethers.parseUnits(amount.toString(), 6),
        evidence: JSON.stringify(evidenceData)
      });

      res.json({
        success: true,
        claimId: claimResult.claimId,
        txHash: claimResult.txHash,
        fraudCheck: {
          riskScore: fraudCheck.riskScore,
          flags: fraudCheck.flags
        },
        message: 'Claim submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      res.status(500).json({ error: 'Failed to submit claim' });
    }
  }
);

/**
 * GET /api/claims/:claimId
 * Get claim details
 */
router.get('/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = await contractService.getClaimDetails(claimId);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({ claim });
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Failed to fetch claim details' });
  }
});

/**
 * GET /api/claims/user/:address
 * Get user's claims
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const claims = await contractService.getUserClaims(address);
    res.json({ claims });
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({ error: 'Failed to fetch user claims' });
  }
});

/**
 * POST /api/claims/:claimId/approve
 * Approve claim (admin only)
 */
router.post('/:claimId/approve',
  auth,
  async (req, res) => {
    try {
      const { claimId } = req.params;
      
      // Check admin permissions
      const isAdmin = await contractService.isAdmin(req.user.address);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await contractService.approveClaim(claimId);
      
      res.json({
        success: true,
        txHash: result.txHash,
        message: 'Claim approved successfully'
      });
    } catch (error) {
      console.error('Error approving claim:', error);
      res.status(500).json({ error: 'Failed to approve claim' });
    }
  }
);

/**
 * POST /api/claims/:claimId/reject
 * Reject claim (admin only)
 */
router.post('/:claimId/reject',
  auth,
  [
    body('reason').isLength({ min: 10 }).withMessage('Rejection reason required (min 10 chars)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { claimId } = req.params;
      const { reason } = req.body;
      
      // Check admin permissions
      const isAdmin = await contractService.isAdmin(req.user.address);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await contractService.rejectClaim(claimId, reason);
      
      res.json({
        success: true,
        txHash: result.txHash,
        message: 'Claim rejected'
      });
    } catch (error) {
      console.error('Error rejecting claim:', error);
      res.status(500).json({ error: 'Failed to reject claim' });
    }
  }
);

/**
 * GET /api/claims/stats/overview
 * Get claims statistics
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await contractService.getClaimsStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching claims stats:', error);
    res.status(500).json({ error: 'Failed to fetch claims statistics' });
  }
});

/**
 * POST /api/claims/oracle/webhook
 * Oracle response webhook
 */
router.post('/oracle/webhook',
  [
    body('requestId').notEmpty().withMessage('Request ID required'),
    body('claimId').notEmpty().withMessage('Claim ID required'),
    body('result').isBoolean().withMessage('Result must be boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { requestId, claimId, result } = req.body;
      
      // Process oracle response
      await contractService.processOracleResponse(requestId, claimId, result);
      
      res.json({ success: true, message: 'Oracle response processed' });
    } catch (error) {
      console.error('Error processing oracle response:', error);
      res.status(500).json({ error: 'Failed to process oracle response' });
    }
  }
);

module.exports = router;