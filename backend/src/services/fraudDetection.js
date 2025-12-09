/**
 * Fraud Detection Service
 * Basic rule-based fraud detection with ML model interface placeholder
 */

class FraudDetectionService {
  constructor() {
    this.rules = [
      this.checkClaimFrequency,
      this.checkAmountPattern,
      this.checkEvidenceQuality,
      this.checkTimingPattern,
      this.checkAddressReputation
    ];
  }

  /**
   * Analyze claim for fraud indicators
   * @param {Object} claimData - Claim data to analyze
   * @returns {Object} Analysis result with risk score and flags
   */
  async analyzeClaim(claimData) {
    const flags = [];
    let riskScore = 0;

    // Run all fraud detection rules
    for (const rule of this.rules) {
      try {
        const result = await rule.call(this, claimData);
        if (result.flag) {
          flags.push(result);
          riskScore += result.weight;
        }
      } catch (error) {
        console.error('Error in fraud detection rule:', error);
      }
    }

    // Normalize risk score (0-1)
    riskScore = Math.min(riskScore, 1);

    // ML model integration placeholder
    const mlScore = await this.getMlRiskScore(claimData);
    riskScore = Math.max(riskScore, mlScore);

    return {
      riskScore,
      flags,
      recommendation: this.getRecommendation(riskScore),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check claim frequency for user
   */
  async checkClaimFrequency(claimData) {
    // Mock implementation - in production, query database
    const recentClaims = await this.getRecentClaims(claimData.userAddress, 30); // 30 days
    
    if (recentClaims.length > 3) {
      return {
        flag: true,
        type: 'HIGH_FREQUENCY',
        message: 'User has submitted multiple claims recently',
        weight: 0.4,
        details: { recentClaimsCount: recentClaims.length }
      };
    }

    return { flag: false };
  }

  /**
   * Check for suspicious amount patterns
   */
  async checkAmountPattern(claimData) {
    const amount = parseFloat(claimData.amount);
    
    // Check for round numbers (potential indicator of fraud)
    if (amount % 1000 === 0 && amount >= 10000) {
      return {
        flag: true,
        type: 'ROUND_AMOUNT',
        message: 'Claim amount is suspiciously round',
        weight: 0.2,
        details: { amount }
      };
    }

    // Check for amounts just under policy limits
    const policyLimit = await this.getPolicyLimit(claimData.policyId);
    if (amount > policyLimit * 0.95) {
      return {
        flag: true,
        type: 'NEAR_LIMIT',
        message: 'Claim amount is very close to policy limit',
        weight: 0.3,
        details: { amount, policyLimit }
      };
    }

    return { flag: false };
  }

  /**
   * Check evidence quality
   */
  async checkEvidenceQuality(claimData) {
    const flags = [];
    let weight = 0;

    // Check description quality
    if (claimData.description.length < 50) {
      flags.push('Short description');
      weight += 0.1;
    }

    // Check for generic/template language
    const genericPhrases = ['lost funds', 'hacked', 'stolen', 'disappeared'];
    const hasGenericLanguage = genericPhrases.some(phrase => 
      claimData.description.toLowerCase().includes(phrase)
    );

    if (hasGenericLanguage && claimData.description.length < 100) {
      flags.push('Generic description');
      weight += 0.2;
    }

    // Check transaction hashes
    if (!claimData.txHashes || claimData.txHashes.length === 0) {
      flags.push('No transaction evidence');
      weight += 0.3;
    }

    // Check file evidence
    if (!claimData.files || claimData.files.length === 0) {
      flags.push('No supporting documents');
      weight += 0.2;
    }

    if (flags.length > 0) {
      return {
        flag: true,
        type: 'POOR_EVIDENCE',
        message: 'Evidence quality is insufficient',
        weight,
        details: { flags }
      };
    }

    return { flag: false };
  }

  /**
   * Check timing patterns
   */
  async checkTimingPattern(claimData) {
    const incidentDate = new Date(claimData.incidentDate);
    const now = new Date();
    const daysSinceIncident = (now - incidentDate) / (1000 * 60 * 60 * 24);

    // Too quick to report (same day)
    if (daysSinceIncident < 1) {
      return {
        flag: true,
        type: 'QUICK_REPORT',
        message: 'Claim reported very quickly after incident',
        weight: 0.2,
        details: { daysSinceIncident: daysSinceIncident.toFixed(1) }
      };
    }

    // Too long to report (over 30 days)
    if (daysSinceIncident > 30) {
      return {
        flag: true,
        type: 'DELAYED_REPORT',
        message: 'Claim reported long after incident',
        weight: 0.3,
        details: { daysSinceIncident: daysSinceIncident.toFixed(1) }
      };
    }

    return { flag: false };
  }

  /**
   * Check address reputation
   */
  async checkAddressReputation(claimData) {
    // Mock implementation - in production, check against reputation databases
    const reputation = await this.getAddressReputation(claimData.userAddress);
    
    if (reputation.riskScore > 0.7) {
      return {
        flag: true,
        type: 'BAD_REPUTATION',
        message: 'Address has poor reputation score',
        weight: 0.5,
        details: { reputationScore: reputation.riskScore }
      };
    }

    return { flag: false };
  }

  /**
   * Get ML model risk score (placeholder)
   */
  async getMlRiskScore(claimData) {
    // Placeholder for ML model integration
    // In production, this would call a trained model API
    
    // Mock ML score based on simple heuristics
    let score = 0;
    
    // Factor in claim amount
    const amount = parseFloat(claimData.amount);
    if (amount > 50000) score += 0.1;
    if (amount > 100000) score += 0.2;
    
    // Factor in description length
    if (claimData.description.length < 100) score += 0.1;
    
    // Add some randomness to simulate ML uncertainty
    score += Math.random() * 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Get recommendation based on risk score
   */
  getRecommendation(riskScore) {
    if (riskScore < 0.3) {
      return 'AUTO_APPROVE';
    } else if (riskScore < 0.7) {
      return 'MANUAL_REVIEW';
    } else {
      return 'REJECT';
    }
  }

  /**
   * Mock helper methods (in production, these would query databases)
   */
  async getRecentClaims(userAddress, days) {
    // Mock: return random number of recent claims
    return Array(Math.floor(Math.random() * 5)).fill({});
  }

  async getPolicyLimit(policyId) {
    // Mock: return policy limit
    return 100000; // $100k default
  }

  async getAddressReputation(address) {
    // Mock: return reputation data
    return {
      riskScore: Math.random() * 0.5, // Most addresses have low risk
      sources: ['blockchain_analysis', 'community_reports']
    };
  }

  /**
   * Train ML model (placeholder)
   */
  async trainModel(trainingData) {
    console.log('Training fraud detection model with', trainingData.length, 'samples');
    // Placeholder for model training
    return {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.78,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update model with new data (placeholder)
   */
  async updateModel(newData) {
    console.log('Updating fraud detection model with new data');
    // Placeholder for model updates
    return {
      updated: true,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new FraudDetectionService();