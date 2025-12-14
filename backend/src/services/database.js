const fs = require('fs');
const path = require('path');

// Simple in-memory database for demo purposes
// In production, use PostgreSQL/MongoDB with Prisma
class Database {
  constructor() {
    this.data = {
      users: new Map(),
      policies: new Map(),
      claims: new Map(),
      notifications: new Map(),
      analytics: {
        totalPolicies: 0,
        totalClaims: 0,
        totalPremiums: 0,
        totalPayouts: 0
      }
    };
    this.loadData();
  }

  loadData() {
    try {
      const dataPath = path.join(__dirname, '../data/db.json');
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const parsedData = JSON.parse(rawData);
        
        // Convert arrays back to Maps
        this.data.users = new Map(parsedData.users || []);
        this.data.policies = new Map(parsedData.policies || []);
        this.data.claims = new Map(parsedData.claims || []);
        this.data.notifications = new Map(parsedData.notifications || []);
        this.data.analytics = parsedData.analytics || this.data.analytics;
      }
    } catch (error) {
      console.log('No existing database found, starting fresh');
    }
  }

  saveData() {
    try {
      const dataPath = path.join(__dirname, '../data');
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }

      const dataToSave = {
        users: Array.from(this.data.users.entries()),
        policies: Array.from(this.data.policies.entries()),
        claims: Array.from(this.data.claims.entries()),
        notifications: Array.from(this.data.notifications.entries()),
        analytics: this.data.analytics
      };

      fs.writeFileSync(
        path.join(dataPath, 'db.json'),
        JSON.stringify(dataToSave, null, 2)
      );
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  // User operations
  createUser(userData) {
    const id = Date.now().toString();
    const user = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.set(id, user);
    this.saveData();
    return user;
  }

  getUserByAddress(address) {
    for (const [id, user] of this.data.users) {
      if (user.walletAddress === address) {
        return user;
      }
    }
    return null;
  }

  updateUser(id, updates) {
    const user = this.data.users.get(id);
    if (user) {
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.data.users.set(id, updatedUser);
      this.saveData();
      return updatedUser;
    }
    return null;
  }

  // Policy operations
  createPolicy(policyData) {
    const id = Date.now().toString();
    const policy = {
      id,
      ...policyData,
      status: policyData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.policies.set(id, policy);
    this.data.analytics.totalPolicies++;
    this.saveData();
    return policy;
  }

  updatePolicy(id, updates) {
    const policy = this.data.policies.get(id);
    if (policy) {
      const updatedPolicy = {
        ...policy,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.data.policies.set(id, updatedPolicy);
      this.saveData();
      return updatedPolicy;
    }
    return null;
  }

  getPoliciesByUser(userAddress) {
    const policies = [];
    for (const [id, policy] of this.data.policies) {
      if (policy.holderAddress === userAddress || policy.userAddress === userAddress) {
        policies.push(policy);
      }
    }
    return policies;
  }

  // Claim operations
  createClaim(claimData) {
    const id = Date.now().toString();
    const claim = {
      id,
      ...claimData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.claims.set(id, claim);
    this.data.analytics.totalClaims++;
    this.saveData();
    return claim;
  }

  updateClaim(id, updates) {
    const claim = this.data.claims.get(id);
    if (claim) {
      const updatedClaim = {
        ...claim,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.data.claims.set(id, updatedClaim);
      this.saveData();
      return updatedClaim;
    }
    return null;
  }

  getClaimsByUser(userAddress) {
    const claims = [];
    for (const [id, claim] of this.data.claims) {
      if (claim.claimantAddress === userAddress) {
        claims.push(claim);
      }
    }
    return claims;
  }

  // Analytics operations
  updateAnalytics(type, amount) {
    switch (type) {
      case 'premium':
        this.data.analytics.totalPremiums += amount;
        break;
      case 'payout':
        this.data.analytics.totalPayouts += amount;
        break;
    }
    this.saveData();
  }

  getAnalytics() {
    return this.data.analytics;
  }

  // Notification operations
  createNotification(notificationData) {
    const id = Date.now().toString();
    const notification = {
      id,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.set(id, notification);
    this.saveData();
    return notification;
  }

  getNotificationsByUser(userAddress) {
    const notifications = [];
    for (const [id, notification] of this.data.notifications) {
      if (notification.userAddress === userAddress) {
        notifications.push(notification);
      }
    }
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

const db = new Database();

const initializeDatabase = () => {
  console.log('Database initialized');
  return db;
};

module.exports = { db, initializeDatabase };