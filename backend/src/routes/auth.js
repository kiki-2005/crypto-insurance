const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * POST /api/auth/nonce
 * Get nonce for wallet signature
 */
router.post('/nonce',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address } = req.body;
      const nonce = Math.floor(Math.random() * 1000000);
      
      // Store nonce temporarily (in production, use Redis or database)
      global.nonces = global.nonces || {};
      global.nonces[address.toLowerCase()] = {
        nonce,
        timestamp: Date.now()
      };

      res.json({ 
        nonce,
        message: `Sign this message to authenticate: ${nonce}`
      });
    } catch (error) {
      console.error('Error generating nonce:', error);
      res.status(500).json({ error: 'Failed to generate nonce' });
    }
  }
);

/**
 * POST /api/auth/verify
 * Verify wallet signature and issue JWT
 */
router.post('/verify',
  [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address'),
    body('signature').isLength({ min: 132, max: 132 }).withMessage('Invalid signature format'),
    body('nonce').isNumeric().withMessage('Invalid nonce')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address, signature, nonce } = req.body;
      const addressLower = address.toLowerCase();

      // Check if nonce exists and is recent (5 minutes)
      global.nonces = global.nonces || {};
      const storedNonce = global.nonces[addressLower];
      
      if (!storedNonce) {
        return res.status(400).json({ error: 'Nonce not found' });
      }

      if (Date.now() - storedNonce.timestamp > 5 * 60 * 1000) {
        delete global.nonces[addressLower];
        return res.status(400).json({ error: 'Nonce expired' });
      }

      if (storedNonce.nonce !== parseInt(nonce)) {
        return res.status(400).json({ error: 'Invalid nonce' });
      }

      // Verify signature
      const message = `Sign this message to authenticate: ${nonce}`;
      const messageHash = ethers.hashMessage(message);
      const recoveredAddress = ethers.recoverAddress(messageHash, signature);

      if (recoveredAddress.toLowerCase() !== addressLower) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Clean up nonce
      delete global.nonces[addressLower];

      // Generate JWT
      const token = jwt.sign(
        { 
          address: addressLower,
          timestamp: Date.now()
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        address: addressLower,
        message: 'Authentication successful'
      });
    } catch (error) {
      console.error('Error verifying signature:', error);
      res.status(500).json({ error: 'Failed to verify signature' });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh',
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        
        // Issue new token
        const newToken = jwt.sign(
          { 
            address: decoded.address,
            timestamp: Date.now()
          },
          process.env.JWT_SECRET || 'default-secret',
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          token: newToken,
          address: decoded.address
        });
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }
);

/**
 * GET /api/auth/profile
 * Get user profile
 */
router.get('/profile',
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        
        // In production, fetch user data from database
        const profile = {
          address: decoded.address,
          isAuthenticated: true,
          authTimestamp: decoded.timestamp
        };

        res.json({ profile });
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
);

module.exports = router;