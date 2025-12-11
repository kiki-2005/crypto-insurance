const express = require('express');
const { db } = require('../services/database');
const { wsManager } = require('../services/websocket');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', auth, (req, res) => {
  try {
    const { walletAddress } = req.user;
    const notifications = db.getNotificationsByUser(walletAddress);
    
    res.json({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.user;
    
    const notification = db.data.notifications.get(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notification.userAddress !== walletAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    notification.read = true;
    notification.readAt = new Date().toISOString();
    db.data.notifications.set(id, notification);
    db.saveData();
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, (req, res) => {
  try {
    const { walletAddress } = req.user;
    
    for (const [id, notification] of db.data.notifications) {
      if (notification.userAddress === walletAddress && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        db.data.notifications.set(id, notification);
      }
    }
    
    db.saveData();
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.user;
    
    const notification = db.data.notifications.get(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notification.userAddress !== walletAddress) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    db.data.notifications.delete(id);
    db.saveData();
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification (internal use)
function createNotification(userAddress, type, title, message, data = {}) {
  const notification = db.createNotification({
    userAddress,
    type,
    title,
    message,
    data
  });
  
  // Send real-time notification
  wsManager.notifyNewNotification(notification, userAddress);
  
  return notification;
}

// Notification types and templates
const NotificationTypes = {
  POLICY_PURCHASED: 'policy_purchased',
  POLICY_EXPIRING: 'policy_expiring',
  CLAIM_SUBMITTED: 'claim_submitted',
  CLAIM_APPROVED: 'claim_approved',
  CLAIM_REJECTED: 'claim_rejected',
  CLAIM_PAID: 'claim_paid',
  PREMIUM_DUE: 'premium_due',
  SYSTEM_UPDATE: 'system_update'
};

const NotificationTemplates = {
  [NotificationTypes.POLICY_PURCHASED]: {
    title: 'Policy Purchased Successfully',
    message: 'Your insurance policy has been activated and is now providing coverage.'
  },
  [NotificationTypes.POLICY_EXPIRING]: {
    title: 'Policy Expiring Soon',
    message: 'Your insurance policy will expire in {days} days. Renew now to maintain coverage.'
  },
  [NotificationTypes.CLAIM_SUBMITTED]: {
    title: 'Claim Submitted',
    message: 'Your claim has been submitted and is under review. Claim ID: {claimId}'
  },
  [NotificationTypes.CLAIM_APPROVED]: {
    title: 'Claim Approved',
    message: 'Great news! Your claim has been approved. Payment will be processed shortly.'
  },
  [NotificationTypes.CLAIM_REJECTED]: {
    title: 'Claim Rejected',
    message: 'Unfortunately, your claim has been rejected. Reason: {reason}'
  },
  [NotificationTypes.CLAIM_PAID]: {
    title: 'Claim Payment Processed',
    message: 'Your claim payment of {amount} has been processed and sent to your wallet.'
  },
  [NotificationTypes.PREMIUM_DUE]: {
    title: 'Premium Payment Due',
    message: 'Your premium payment is due in {days} days. Pay now to avoid policy cancellation.'
  },
  [NotificationTypes.SYSTEM_UPDATE]: {
    title: 'System Update',
    message: 'The insurance system has been updated with new features and improvements.'
  }
};

// Helper function to create typed notifications
function createTypedNotification(userAddress, type, data = {}) {
  const template = NotificationTemplates[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }
  
  let message = template.message;
  
  // Replace placeholders in message
  Object.keys(data).forEach(key => {
    message = message.replace(`{${key}}`, data[key]);
  });
  
  return createNotification(userAddress, type, template.title, message, data);
}

// Bulk notification endpoints (admin only)
router.post('/bulk', auth, (req, res) => {
  try {
    // Check if user is admin (implement proper admin check)
    const { type, message, userAddresses } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }
    
    const notifications = [];
    const addresses = userAddresses || Array.from(db.data.users.values()).map(u => u.walletAddress);
    
    addresses.forEach(address => {
      const notification = createNotification(address, type, 'System Notification', message);
      notifications.push(notification);
    });
    
    res.json({ 
      message: `Sent ${notifications.length} notifications`,
      notifications: notifications.length
    });
  } catch (error) {
    console.error('Bulk notification error:', error);
    res.status(500).json({ error: 'Failed to send bulk notifications' });
  }
});

// Get notification statistics (admin only)
router.get('/stats', auth, (req, res) => {
  try {
    const notifications = Array.from(db.data.notifications.values());
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {},
      recent: notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };
    
    // Count by type
    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

module.exports = { 
  router, 
  createNotification, 
  createTypedNotification, 
  NotificationTypes 
};