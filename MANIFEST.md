# Project Structure Manifest

## Root Directory
```
crypto-insurance/
├── contracts/                 # Smart contracts (Solidity)
├── backend/                   # Backend API (Node.js/Express)
├── frontend/                  # Frontend DApp (React/TypeScript)
├── test/                      # Smart contract tests
├── scripts/                   # Deployment and utility scripts
├── deployments/               # Contract deployment artifacts
├── .github/workflows/         # CI/CD pipelines
├── artifacts/                 # Compiled contract artifacts
├── cache/                     # Hardhat cache
├── docker-compose.yml         # Local development setup
├── Dockerfile                 # Production container
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Root dependencies
└── README.md                  # Project documentation
```

## Smart Contracts (`/contracts/`)
- **PolicyFactory.sol**: Factory for creating insurance policies
- **Policy.sol**: Individual policy contract implementation
- **PremiumPool.sol**: Manages premium collection and claim payouts
- **ClaimManager.sol**: Handles claim lifecycle and verification
- **MockOracle.sol**: Simulates Chainlink oracle for claim verification
- **MultiSigEscrow.sol**: Multi-signature wallet for high-value claims
- **ERC20Mock.sol**: Mock stablecoin tokens for testing

## Backend API (`/backend/`)
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js            # Wallet-based authentication
│   │   ├── policies.js        # Policy management endpoints
│   │   ├── claims.js          # Claim processing endpoints
│   │   ├── admin.js           # Admin dashboard endpoints
│   │   └── kyc.js             # KYC verification endpoints
│   ├── services/
│   │   ├── contractService.js # Blockchain interaction service
│   │   └── fraudDetection.js  # Fraud detection algorithms
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── server.js              # Express server setup
├── uploads/                   # File upload storage
└── package.json               # Backend dependencies
```

## Frontend DApp (`/frontend/`)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.tsx           # Landing page
│   │   ├── Policies.tsx       # Policy marketplace
│   │   ├── Claims.tsx         # Claim management
│   │   ├── Dashboard.tsx      # User dashboard
│   │   └── Admin.tsx          # Admin panel
│   ├── components/
│   │   └── Navbar.tsx         # Navigation component
│   ├── stores/
│   │   └── walletStore.ts     # Zustand wallet state
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # React entry point
│   └── index.css              # Tailwind CSS styles
├── public/                    # Static assets
├── dist/                      # Build output
├── package.json               # Frontend dependencies
├── vite.config.js             # Vite configuration
└── tailwind.config.js         # Tailwind CSS configuration
```

## Tests (`/test/`)
- **PolicyFactory.test.js**: Unit tests for policy factory
- **Integration.test.js**: End-to-end integration tests
- Additional test files for each contract

## Scripts (`/scripts/`)
- **deploy.js**: Main deployment script for all networks
- **demo.js**: Interactive demo script showing full workflow
- **verify.js**: Contract verification script
- **upgrade.js**: Contract upgrade scripts (if using UUPS)

## Key Features by File

### Smart Contract Features
- **Gas Optimization**: Efficient storage patterns, calldata usage
- **Security**: OpenZeppelin libraries, reentrancy guards, access controls
- **Multi-sig**: High-value claim approvals require multiple signatures
- **Oracle Integration**: Mock Chainlink oracle with timeout handling

### Backend Features
- **Wallet Authentication**: MetaMask signature-based login
- **RESTful API**: Comprehensive endpoints for all operations
- **Fraud Detection**: Rule-based analysis with ML model interface
- **File Uploads**: KYC document and claim evidence handling
- **Rate Limiting**: API protection against abuse

### Frontend Features
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Wallet Integration**: MetaMask connection and transaction handling
- **State Management**: Zustand for global state
- **Real-time Updates**: React Query for data fetching
- **User Experience**: Toast notifications, loading states, error handling

### DevOps Features
- **Docker Support**: Multi-stage builds for production deployment
- **CI/CD Pipeline**: GitHub Actions with testing, security, and deployment
- **Multi-network**: Support for local, Goerli, and Mumbai networks
- **Security Scanning**: Slither static analysis, npm audit

## Environment Configuration

### Required Environment Variables
```bash
# Blockchain
PRIVATE_KEY=                   # Deployment private key
GOERLI_RPC_URL=               # Goerli testnet RPC
MUMBAI_RPC_URL=               # Polygon Mumbai RPC
ETHERSCAN_API_KEY=            # Etherscan verification
POLYGONSCAN_API_KEY=          # Polygonscan verification

# Backend
PORT=3001                     # Backend server port
DATABASE_URL=                 # Database connection string
JWT_SECRET=                   # JWT signing secret

# Frontend
REACT_APP_API_URL=            # Backend API URL
REACT_APP_CHAIN_ID=           # Target blockchain chain ID
```

## Deployment Artifacts (`/deployments/`)
- Network-specific deployment files with contract addresses
- ABI files for frontend integration
- Deployment transaction hashes and block numbers

## Development Workflow

### 1. Local Development
```bash
npm install                   # Install dependencies
npm run node                  # Start local blockchain
npm run deploy:local          # Deploy contracts
npm run start:dev             # Start all services
```

### 2. Testing
```bash
npm run test                  # Smart contract tests
npm run test:coverage         # Coverage report
npm run demo                  # End-to-end demo
```

### 3. Production Deployment
```bash
npm run deploy:goerli         # Deploy to Goerli
npm run deploy:mumbai         # Deploy to Mumbai
docker-compose up             # Production containers
```

## Security Considerations

### Smart Contract Security
- All contracts use OpenZeppelin libraries
- Reentrancy guards on state-changing functions
- Access control modifiers for admin functions
- Safe ERC20 transfers to prevent token issues
- Multi-signature requirements for high-value operations

### Application Security
- JWT-based authentication with wallet signatures
- Input validation on all API endpoints
- Rate limiting to prevent abuse
- File upload restrictions and validation
- CORS configuration for cross-origin requests

### Oracle Security
- Timeout mechanisms for oracle failures
- Multiple operator support for decentralization
- Request validation and response verification
- Fallback mechanisms for edge cases

## Performance Optimizations

### Smart Contracts
- Gas-optimized storage patterns
- Batch operations where possible
- Efficient data structures
- Minimal external calls

### Backend
- Database indexing for common queries
- Caching for frequently accessed data
- Async/await patterns for non-blocking operations
- Connection pooling for database access

### Frontend
- Code splitting for reduced bundle size
- Lazy loading for route components
- Optimized re-renders with React.memo
- Efficient state management with Zustand

This manifest provides a comprehensive overview of the project structure and implementation details for the blockchain-based insurance claim system.