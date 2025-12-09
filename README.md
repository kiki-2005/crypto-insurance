# Blockchain-Based Insurance Claim System for Crypto-Asset Risks

A comprehensive full-stack decentralized insurance platform that provides coverage for crypto-asset risks including DeFi protocol exploits, exchange hacks, and smart contract vulnerabilities.

## 🚀 Features

### Core Functionality
- **Wallet-based Authentication**: MetaMask integration with signature-based login
- **Policy Management**: Create, purchase, and manage insurance policies
- **Premium Payments**: Support for stablecoin payments (USDT/USDC)
- **Claim Processing**: Oracle-verified claim submission and automated payouts
- **Multi-signature Support**: High-value claims require multi-sig approval
- **Fraud Detection**: Rule-based fraud detection with ML model interface
- **KYC Integration**: Mock document verification system
- **Admin Dashboard**: System monitoring and management tools

### Technical Stack
- **Smart Contracts**: Solidity 0.8.19, OpenZeppelin, Hardhat
- **Backend**: Node.js, Express, TypeScript, Ethers.js
- **Frontend**: React, TypeScript, Tailwind CSS, Zustand
- **Database**: SQLite with Prisma (for prototype)
- **Testing**: Hardhat + Chai, Jest, Playwright
- **DevOps**: Docker, GitHub Actions, Multi-network deployment

## 📋 Prerequisites

### Windows
```bash
# Install Node.js 18 or 20
# Download from: https://nodejs.org/

# Install Git
# Download from: https://git-scm.com/

# Install Yarn (optional, can use npm)
npm install -g yarn

# Install Python (for Slither)
# Download from: https://python.org/
```

### Linux/macOS
```bash
# Install Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Yarn
npm install -g yarn

# Install Python and pip
sudo apt-get install python3 python3-pip  # Ubuntu/Debian
brew install python3                       # macOS
```

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd crypto-insurance
```

### 2. Install Dependencies
```bash
# Install root dependencies (Hardhat, contracts)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# For local development, you can use the defaults
```

### 4. Compile Smart Contracts
```bash
npm run compile
```

## 🚀 Running the Application

### Option 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Manual Setup
```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts (wait for blockchain to start)
npm run deploy:local

# Terminal 3: Start backend
npm run backend:dev

# Terminal 4: Start frontend
npm run frontend:dev
```

### Option 3: Development Script
```bash
# Start all services with one command
npm run start:dev
```

## 🧪 Testing

### Run All Tests
```bash
# Smart contract tests
npm run test

# Test coverage
npm run test:coverage

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Run Demo Script
```bash
# Demonstrates full claim lifecycle
npm run demo
```

## 🌐 Deployment

### Local Hardhat Network
```bash
npm run deploy:local
```

### Goerli Testnet
```bash
# Set environment variables in .env
PRIVATE_KEY=your_private_key
GOERLI_RPC_URL=https://goerli.infura.io/v3/your_key
ETHERSCAN_API_KEY=your_etherscan_key

npm run deploy:goerli
```

### Polygon Mumbai Testnet
```bash
# Set environment variables in .env
PRIVATE_KEY=your_private_key
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/your_key
POLYGONSCAN_API_KEY=your_polygonscan_key

npm run deploy:mumbai
```

## 📊 Demo Walkthrough

### 1. Connect Wallet
- Open http://localhost:3000
- Click "Connect Wallet" and approve MetaMask connection
- Ensure you're on the local Hardhat network (Chain ID: 31337)

### 2. Get Test Tokens
```bash
# The demo script automatically provides test tokens
# Or manually mint tokens using the ERC20Mock contract
```

### 3. Purchase Policy
- Navigate to "Policies" page
- Select a policy (e.g., "DeFi Protocol Insurance")
- Click "Purchase Policy" and confirm transaction

### 4. Submit Claim
- Go to "Claims" page
- Click "Submit New Claim"
- Fill in claim details with evidence containing "hack" keyword
- Submit and wait for oracle verification

### 5. View Results
- Check "Dashboard" for policy and claim status
- Admin can view system stats in "Admin" panel

## 🏗️ Architecture

### Smart Contracts
```
contracts/
├── PolicyFactory.sol      # Creates and manages policies
├── Policy.sol            # Individual policy contracts
├── PremiumPool.sol       # Manages premium collection and payouts
├── ClaimManager.sol      # Handles claim lifecycle
├── MockOracle.sol        # Simulates Chainlink oracle
├── MultiSigEscrow.sol    # Multi-signature approvals
└── ERC20Mock.sol         # Test stablecoin tokens
```

### Backend API
```
backend/src/
├── routes/
│   ├── auth.js           # Wallet authentication
│   ├── policies.js       # Policy management
│   ├── claims.js         # Claim processing
│   ├── admin.js          # Admin operations
│   └── kyc.js           # KYC verification
├── services/
│   ├── contractService.js # Blockchain interactions
│   └── fraudDetection.js # Fraud analysis
└── middleware/
    └── auth.js           # JWT authentication
```

### Frontend Components
```
frontend/src/
├── pages/
│   ├── Home.tsx          # Landing page
│   ├── Policies.tsx      # Policy marketplace
│   ├── Claims.tsx        # Claim management
│   ├── Dashboard.tsx     # User dashboard
│   └── Admin.tsx         # Admin panel
├── components/
│   └── Navbar.tsx        # Navigation
└── stores/
    └── walletStore.ts    # Wallet state management
```

## 🔒 Security Features

### Smart Contract Security
- **OpenZeppelin Libraries**: Battle-tested security patterns
- **Reentrancy Guards**: Protection against reentrancy attacks
- **Access Controls**: Role-based permissions
- **Safe ERC20 Transfers**: Prevents token transfer issues
- **Multi-signature**: High-value operations require multiple approvals

### Oracle Security
- **Timeout Handling**: Fallback for oracle failures
- **Request Validation**: Verify oracle responses
- **Multiple Operators**: Decentralized oracle network simulation

### Application Security
- **JWT Authentication**: Secure API access
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize user inputs
- **File Upload Security**: Restrict file types and sizes

## 🧪 Testing Coverage

### Smart Contract Tests
- Unit tests for all contracts
- Integration tests for contract interactions
- Edge case testing (reentrancy, unauthorized access)
- Gas optimization tests

### Backend Tests
- API endpoint testing
- Authentication flow testing
- Database integration tests
- Error handling tests

### Frontend Tests
- Component unit tests
- User interaction tests
- Wallet integration tests

## 📈 Gas Optimization

### Implemented Optimizations
- Use `calldata` instead of `memory` for external functions
- Minimize storage writes
- Batch operations where possible
- Efficient data structures

### Gas Usage Reports
```bash
# Generate gas report
REPORT_GAS=true npm run test
```

## 🔍 Static Analysis

### Slither Analysis
```bash
# Install Slither
pip3 install slither-analyzer

# Run analysis
npm run compile
slither . --print human-summary
```

## 🚨 Known Limitations (Demo)

1. **Mock Oracle**: Uses simplified verification logic
2. **Mock KYC**: Simulated document verification
3. **Local Database**: SQLite for prototype (use PostgreSQL in production)
4. **Simplified Fraud Detection**: Basic rule-based system
5. **Test Networks Only**: Not audited for mainnet deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

#### MetaMask Connection Issues
```bash
# Reset MetaMask account if needed
# Settings > Advanced > Reset Account
```

#### Contract Deployment Fails
```bash
# Ensure Hardhat node is running
npm run node

# Check account has ETH for gas
# Local accounts are pre-funded
```

#### Frontend Build Errors
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Getting Help

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review the troubleshooting section
3. Join our [Discord](https://discord.gg/your-server) community
4. Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core smart contracts
- ✅ Basic frontend and backend
- ✅ Local development setup
- ✅ Demo functionality

### Phase 2 (Future)
- [ ] Mainnet deployment
- [ ] Advanced fraud detection ML models
- [ ] Real Chainlink oracle integration
- [ ] Mobile application
- [ ] Advanced analytics dashboard

### Phase 3 (Future)
- [ ] Cross-chain support
- [ ] Governance token
- [ ] Staking mechanisms
- [ ] Insurance marketplace
- [ ] Third-party integrations

---

**⚠️ Disclaimer**: This is a prototype system for demonstration purposes. Do not use with real funds without proper security audits and testing.