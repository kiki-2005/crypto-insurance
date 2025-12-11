# Blockchain-Based Insurance Claim System

A comprehensive decentralized insurance platform for managing crypto-asset risks with automated claim processing, real-time analytics, and transparent blockchain operations.

## 🚀 Features

### Core Functionality
- **Smart Contract-Based Policies**: Automated policy creation and management
- **Decentralized Claim Processing**: Oracle-verified claims with multi-signature approval
- **Real-time Analytics**: Comprehensive dashboard with risk assessment
- **WebSocket Integration**: Live updates for claims and policy changes
- **Multi-signature Security**: Enhanced security for high-value claims
- **Fraud Detection**: AI-powered fraud indicators and risk analysis

### Technology Stack
- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket
- **Blockchain**: Solidity + Hardhat + Ethers.js
- **Database**: In-memory (demo) / PostgreSQL (production)
- **Real-time**: WebSocket for live updates

## 📁 Project Structure

```
crypto-insurance/
├── contracts/           # Smart contracts
│   ├── ClaimManager.sol
│   ├── Policy.sol
│   ├── PremiumPool.sol
│   └── PolicyFactory.sol
├── backend/            # Node.js API server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Business logic
│   │   └── middleware/ # Auth & validation
├── frontend/           # React.js application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route pages
│   │   ├── hooks/      # Custom hooks
│   │   └── services/   # API clients
├── scripts/            # Deployment scripts
└── test/              # Smart contract tests
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd crypto-insurance
```

### 2. Install Dependencies
```bash
# Root dependencies (Hardhat)
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Setup
Create `.env` files:

**Root `.env`:**
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=http://localhost:8545
POLICY_FACTORY_ADDRESS=
CLAIM_MANAGER_ADDRESS=
PREMIUM_POOL_ADDRESS=
```

**Backend `.env`:**
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
```

### 4. Start Development Environment
```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local

# Terminal 3: Start backend
npm run backend:dev

# Terminal 4: Start frontend
cd frontend && npm run dev
```

## 🔧 Smart Contracts

### ClaimManager.sol
- Handles claim lifecycle management
- Oracle integration for verification
- Multi-signature approval for high-value claims
- Automated payout processing

### Policy.sol
- Individual policy contract instances
- Premium collection and validation
- Coverage verification
- Policy holder management

### PremiumPool.sol
- Centralized premium collection
- Claim payout management
- Liquidity tracking
- Risk pool analytics

### PolicyFactory.sol
- Policy contract deployment
- Policy registry management
- Insurer authorization

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Wallet-based authentication
- `GET /api/auth/profile` - User profile

### Policies
- `GET /api/policies` - List all policies
- `POST /api/policies` - Create new policy
- `GET /api/policies/user` - User's policies
- `POST /api/policies/:id/purchase` - Purchase policy

### Claims
- `GET /api/claims` - List all claims
- `POST /api/claims` - Submit new claim
- `GET /api/claims/user` - User's claims
- `POST /api/claims/:id/approve` - Approve claim
- `POST /api/claims/:id/reject` - Reject claim

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/claims` - Claim statistics
- `GET /api/analytics/policies` - Policy analytics
- `GET /api/analytics/risk-assessment` - Risk metrics

### Notifications
- `GET /api/notifications` - User notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔄 Real-time Features

### WebSocket Events
- `claim_update` - Claim status changes
- `policy_update` - Policy modifications
- `new_notification` - System notifications
- `blockchain_event` - Smart contract events

### Event Handling
```javascript
// Frontend WebSocket integration
const { isConnected, sendMessage } = useWebSocket('ws://localhost:3001/ws', {
  onMessage: (message) => {
    switch (message.type) {
      case 'claim_update':
        // Handle claim status update
        break;
      case 'new_notification':
        // Show notification
        break;
    }
  }
});
```

## 📊 Analytics & Monitoring

### Dashboard Metrics
- Total policies and claims
- Premium collection vs payouts
- Claim approval ratios
- Active user statistics
- Blockchain network status

### Risk Assessment
- Claim frequency analysis
- Fraud detection indicators
- Policy type risk distribution
- Average processing times

## 🔐 Security Features

### Smart Contract Security
- ReentrancyGuard protection
- Access control modifiers
- Input validation
- Emergency pause functionality

### Backend Security
- JWT authentication
- Rate limiting
- Input sanitization
- CORS protection
- Helmet security headers

### Frontend Security
- Wallet signature verification
- Secure API communication
- XSS protection
- Input validation

## 🧪 Testing

### Smart Contract Tests
```bash
npm run test
npm run test:coverage
```

### Backend Tests
```bash
cd backend && npm test
```

### Integration Tests
```bash
npm run test:integration
```

## 🚀 Deployment

### Local Development
```bash
npm run start:dev
```

### Production Deployment
```bash
# Build frontend
cd frontend && npm run build

# Deploy contracts to mainnet
npm run deploy:mainnet

# Start production server
cd backend && npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## 📈 Performance Optimization

### Frontend Optimization
- Code splitting with React.lazy
- Memoization with React.memo
- Efficient state management with Zustand
- Optimized bundle size

### Backend Optimization
- Connection pooling
- Caching strategies
- Rate limiting
- Efficient database queries

### Blockchain Optimization
- Gas-efficient smart contracts
- Batch operations
- Event-based updates
- Minimal on-chain storage

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues

## 🔮 Future Enhancements

- [ ] Mobile application
- [ ] Advanced fraud detection ML models
- [ ] Cross-chain compatibility
- [ ] Decentralized governance
- [ ] Insurance marketplace
- [ ] Automated underwriting
- [ ] Parametric insurance products
- [ ] Integration with DeFi protocols

---

**Built with ❤️ for the decentralized future of insurance**