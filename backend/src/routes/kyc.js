const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for KYC document uploads
const upload = multer({
  dest: 'uploads/kyc/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF allowed.'), false);
    }
  }
});

// Mock KYC database (in production, use proper database)
const kycDatabase = new Map();

/**
 * POST /api/kyc/submit
 * Submit KYC documents (mock implementation)
 */
router.post('/submit',
  auth,
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  [
    body('firstName').isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('nationality').isLength({ min: 2 }).withMessage('Nationality is required'),
    body('documentType').isIn(['passport', 'drivingLicense', 'nationalId']).withMessage('Invalid document type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, dateOfBirth, nationality, documentType } = req.body;
      const userAddress = req.user.address;

      // Check if files were uploaded
      if (!req.files.idDocument || !req.files.proofOfAddress || !req.files.selfie) {
        return res.status(400).json({ error: 'All required documents must be uploaded' });
      }

      // Mock KYC processing
      const kycData = {
        userAddress,
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        documentType,
        documents: {
          idDocument: req.files.idDocument[0].filename,
          proofOfAddress: req.files.proofOfAddress[0].filename,
          selfie: req.files.selfie[0].filename
        },
        status: 'pending',
        submittedAt: new Date().toISOString(),
        processedAt: null,
        verificationScore: null
      };

      // Simulate KYC verification process
      setTimeout(() => {
        // Mock verification logic
        const verificationScore = Math.random();
        const isApproved = verificationScore > 0.3; // 70% approval rate

        kycData.status = isApproved ? 'approved' : 'rejected';
        kycData.processedAt = new Date().toISOString();
        kycData.verificationScore = verificationScore;
        
        if (!isApproved) {
          kycData.rejectionReason = 'Document quality insufficient or information mismatch';
        }

        kycDatabase.set(userAddress, kycData);
        console.log(`KYC ${isApproved ? 'approved' : 'rejected'} for ${userAddress}`);
      }, 5000); // 5 second processing delay

      // Store initial submission
      kycDatabase.set(userAddress, kycData);

      res.json({
        success: true,
        kycId: userAddress,
        status: 'pending',
        message: 'KYC documents submitted successfully. Processing will complete in a few moments.',
        estimatedProcessingTime: '5 seconds (mock)'
      });
    } catch (error) {
      console.error('Error submitting KYC:', error);
      res.status(500).json({ error: 'Failed to submit KYC documents' });
    }
  }
);

/**
 * GET /api/kyc/status
 * Get KYC status for authenticated user
 */
router.get('/status', auth, async (req, res) => {
  try {
    const userAddress = req.user.address;
    const kycData = kycDatabase.get(userAddress);

    if (!kycData) {
      return res.json({
        status: 'not_submitted',
        message: 'No KYC submission found'
      });
    }

    // Return status without sensitive data
    const statusResponse = {
      status: kycData.status,
      submittedAt: kycData.submittedAt,
      processedAt: kycData.processedAt,
      verificationScore: kycData.verificationScore,
      rejectionReason: kycData.rejectionReason
    };

    res.json(statusResponse);
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

/**
 * GET /api/kyc/admin/pending
 * Get pending KYC submissions (admin only)
 */
router.get('/admin/pending', auth, async (req, res) => {
  try {
    // In production, check admin permissions
    const pendingKyc = Array.from(kycDatabase.values())
      .filter(kyc => kyc.status === 'pending')
      .map(kyc => ({
        userAddress: kyc.userAddress,
        firstName: kyc.firstName,
        lastName: kyc.lastName,
        submittedAt: kyc.submittedAt,
        documentType: kyc.documentType
      }));

    res.json({ pendingKyc });
  } catch (error) {
    console.error('Error fetching pending KYC:', error);
    res.status(500).json({ error: 'Failed to fetch pending KYC submissions' });
  }
});

/**
 * POST /api/kyc/admin/review/:address
 * Review KYC submission (admin only)
 */
router.post('/admin/review/:address',
  auth,
  [
    body('decision').isIn(['approve', 'reject']).withMessage('Decision must be approve or reject'),
    body('notes').optional().isString().withMessage('Notes must be string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address } = req.params;
      const { decision, notes } = req.body;

      const kycData = kycDatabase.get(address);
      if (!kycData) {
        return res.status(404).json({ error: 'KYC submission not found' });
      }

      if (kycData.status !== 'pending') {
        return res.status(400).json({ error: 'KYC already processed' });
      }

      // Update KYC status
      kycData.status = decision === 'approve' ? 'approved' : 'rejected';
      kycData.processedAt = new Date().toISOString();
      kycData.reviewNotes = notes;
      kycData.reviewedBy = req.user.address;

      if (decision === 'reject' && !kycData.rejectionReason) {
        kycData.rejectionReason = notes || 'Manual review rejection';
      }

      kycDatabase.set(address, kycData);

      res.json({
        success: true,
        status: kycData.status,
        message: `KYC ${decision}d successfully`
      });
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      res.status(500).json({ error: 'Failed to review KYC submission' });
    }
  }
);

/**
 * GET /api/kyc/stats
 * Get KYC statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const allKyc = Array.from(kycDatabase.values());
    
    const stats = {
      total: allKyc.length,
      pending: allKyc.filter(k => k.status === 'pending').length,
      approved: allKyc.filter(k => k.status === 'approved').length,
      rejected: allKyc.filter(k => k.status === 'rejected').length,
      averageProcessingTime: '5 seconds (mock)',
      approvalRate: allKyc.length > 0 ? 
        (allKyc.filter(k => k.status === 'approved').length / allKyc.filter(k => k.status !== 'pending').length * 100).toFixed(1) + '%' : 
        'N/A'
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching KYC stats:', error);
    res.status(500).json({ error: 'Failed to fetch KYC statistics' });
  }
});

module.exports = router;