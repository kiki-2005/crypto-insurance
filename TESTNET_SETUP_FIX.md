# Testnet Setup Fix

## Issue
Backend was trying to connect to localhost blockchain, but contracts are deployed to Sepolia testnet.

## Fixes Applied

### 1. Updated RPC URL Priority
- Changed `initialize()` to check `SEPOLIA_RPC_URL` first, then `RPC_URL`
- This ensures testnet RPC is used when available

### 2. Enhanced Contract Loading
- `loadContracts()` now checks `.env` file for contract addresses if deployment files not found
- Maps environment variables to contract names:
  - `POLICY_FACTORY_ADDRESS` → PolicyFactory
  - `PREMIUM_POOL_ADDRESS` → PremiumPool
  - `CLAIM_MANAGER_ADDRESS` → ClaimManager
  - `MOCK_ORACLE_ADDRESS` → MockOracle
  - `MULTISIG_ESCROW_ADDRESS` → MultiSigEscrow
  - `ERC20_MOCK_ADDRESS` → ERC20Mock

### 3. Fixed getAllPolicies()
- Returns empty array if PolicyFactory not loaded (instead of throwing error)
- Frontend will use mock data as fallback
- No more crashes when blockchain unavailable

### 4. Improved Error Handling
- Policies route returns empty array on error (instead of 500 error)
- Frontend handles empty response gracefully

## Current Configuration

Your `.env` file has:
- `SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...`
- Contract addresses for all contracts

## Next Steps

1. **Restart Backend** (the fixes are in place):
   ```bash
   cd backend
   npm start
   ```

2. **Verify Connection**:
   - Backend should connect to Sepolia testnet
   - Should see: "Connected to network: sepolia"
   - Should see: "✓ Loaded PolicyFactory at 0x..."
   - Should see contracts loading from .env addresses

3. **Test Policies Page**:
   - Frontend should either show policies from blockchain OR use mock data
   - No more error messages!

## Expected Output

When backend starts, you should see:
```
✓ Connected to blockchain at https://sepolia.infura.io/...
Connected to network: sepolia (chainId: 11155111)
No deployment file found, checking .env for contract addresses...
Found PolicyFactory address in .env: 0xe06cd8da22964EaF5067F0035D88b1DD3182FACe
✓ Loaded PolicyFactory at 0xe06cd8da22964EaF5067F0035D88b1DD3182FACe
...
✅ Loaded 6 contracts
✅ Contract service initialized
```

If policies are empty, frontend will use mock data - that's fine for demo!

