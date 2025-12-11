const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.wss = null;
  }

  setupWebSocketServer(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: (info) => {
        // Basic verification - in production, add proper auth
        return true;
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        // Remove client from active connections
        for (const [address, client] of this.clients) {
          if (client.ws === ws) {
            this.clients.delete(address);
            console.log(`Client ${address} disconnected`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server setup complete');
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'auth':
        this.authenticateClient(ws, data);
        break;
      case 'subscribe':
        this.subscribeToUpdates(ws, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  authenticateClient(ws, data) {
    try {
      const { walletAddress, signature } = data;
      
      // In production, verify the signature properly
      if (walletAddress && signature) {
        this.clients.set(walletAddress, {
          ws,
          address: walletAddress,
          authenticated: true,
          connectedAt: Date.now()
        });

        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'Successfully authenticated'
        }));

        console.log(`Client ${walletAddress} authenticated`);
      } else {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Invalid authentication data'
        }));
      }
    } catch (error) {
      console.error('Authentication error:', error);
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
    }
  }

  subscribeToUpdates(ws, data) {
    const { topics } = data;
    const client = this.getClientByWs(ws);
    
    if (client) {
      client.subscriptions = topics || ['claims', 'policies', 'notifications'];
      ws.send(JSON.stringify({
        type: 'subscription_success',
        topics: client.subscriptions
      }));
    }
  }

  getClientByWs(ws) {
    for (const [address, client] of this.clients) {
      if (client.ws === ws) {
        return client;
      }
    }
    return null;
  }

  // Broadcast methods
  broadcastToUser(userAddress, message) {
    const client = this.clients.get(userAddress);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcastToAll(message) {
    for (const [address, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  notifyClaimUpdate(claimId, status, userAddress) {
    this.broadcastToUser(userAddress, {
      type: 'claim_update',
      data: {
        claimId,
        status,
        timestamp: Date.now()
      }
    });
  }

  notifyPolicyUpdate(policyId, status, userAddress) {
    this.broadcastToUser(userAddress, {
      type: 'policy_update',
      data: {
        policyId,
        status,
        timestamp: Date.now()
      }
    });
  }

  notifyNewNotification(notification, userAddress) {
    this.broadcastToUser(userAddress, {
      type: 'new_notification',
      data: notification
    });
  }

  getConnectedClients() {
    return Array.from(this.clients.keys());
  }

  getClientCount() {
    return this.clients.size;
  }
}

const wsManager = new WebSocketManager();

const setupWebSocketServer = (server) => {
  wsManager.setupWebSocketServer(server);
};

module.exports = { wsManager, setupWebSocketServer };