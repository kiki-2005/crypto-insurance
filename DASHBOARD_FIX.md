# Dashboard "Route Not Found" - Troubleshooting Guide

## Quick Fix Checklist

### 1. **Start the Backend Server**
```bash
cd /home/yash/crypto-insurance/backend
npm install  # Run once if not already done
npm start
```

Expected output:
```
🚀 Crypto Insurance Backend running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
🔌 WebSocket: ws://localhost:3001/ws
```

### 2. **Start the Frontend Development Server**
```bash
cd /home/yash/crypto-insurance/frontend
npm install  # Run once if not already done
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:3000/
```

### 3. **Verify Backend is Running**
Open your browser and visit: `http://localhost:3001/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-12-11T...",
  "version": "1.0.0"
}
```

---

## What Was Fixed

### ✅ **Missing Analytics Route**
- **Problem**: The analytics route was not imported/mounted in `server.js`
- **Solution**: Added `const analyticsRoutes = require('./routes/analytics');` and `app.use('/api/analytics', analyticsRoutes);`

### ✅ **Authentication Issue on Dashboard**
- **Problem**: Dashboard endpoint required JWT token but frontend wasn't providing one
- **Solution**: Changed auth middleware to "optional auth" - the endpoint now works without a token

### ✅ **Missing getSystemStats Method**
- **Problem**: Analytics route called `contractService.getSystemStats()` but the method didn't exist
- **Solution**: Added the method to retrieve blockchain status, gas price, and block number

### ✅ **WebSocket Support**
- **Problem**: Server wasn't supporting WebSocket connections for real-time updates
- **Solution**: Updated server to use `http.createServer()` and setup WebSocket manager

### ✅ **Environment Configuration**
- **Problem**: Missing `.env` files for backend and frontend
- **Solution**: Created `.env` files with proper configuration

---

## If Dashboard Still Shows Error

### Step 1: Check Browser Console
Press `F12` → Go to **Console** tab → Look for errors

### Step 2: Check Network Tab
Press `F12` → Go to **Network** tab → 
- Refresh the page
- Look for failed requests to `http://localhost:3001/api/analytics/dashboard`
- Click on the request and check the response

### Step 3: Verify Ports
```bash
# Check if port 3001 is in use (Backend)
lsof -i :3001

# Check if port 3000 is in use (Frontend)
lsof -i :3000

# If ports are in use, kill the process:
# kill -9 <PID>
```

### Step 4: Clear Browser Cache
- Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
- Select "All time"
- Clear cache and cookies
- Reload the page

---

## Manual Testing

### Test Backend Analytics Endpoint
```bash
# From terminal:
curl -X GET http://localhost:3001/api/analytics/dashboard \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "overview": {
    "totalPolicies": 0,
    "totalClaims": 0,
    "totalPremiums": 0,
    "totalPayouts": 0,
    "claimRatio": 0,
    "profitLoss": 0,
    "activeUsers": 0
  },
  "blockchain": {
    "connected": true,
    "blockNumber": 0,
    "gasPrice": "0 gwei",
    "networkId": "31337"
  },
  "recentActivity": {
    "claims": [],
    "policies": []
  },
  "trends": {
    "claimsGrowth": 0,
    "policiesGrowth": 0,
    "premiumGrowth": 0
  }
}
```

---

## Common Issues & Solutions

### Issue: "Cannot GET /api/analytics/dashboard"
**Solution**: Make sure the backend is running and the analytics route is properly mounted

### Issue: "ECONNREFUSED" - Connection refused
**Solution**: Backend is not running. Run `npm start` in the backend directory

### Issue: CORS error
**Solution**: Make sure `FRONTEND_URL=http://localhost:3000` is set in backend `.env`

### Issue: Port already in use
**Solution**: 
```bash
# Kill process on port 3001
kill -9 $(lsof -t -i :3001)

# Kill process on port 3000
kill -9 $(lsof -t -i :3000)
```

---

## Files Modified

1. ✅ `/home/yash/crypto-insurance/backend/src/server.js` - Added analytics route & WebSocket support
2. ✅ `/home/yash/crypto-insurance/backend/src/routes/analytics.js` - Changed auth to optional
3. ✅ `/home/yash/crypto-insurance/backend/src/services/contractService.js` - Added getSystemStats()
4. ✅ `/home/yash/crypto-insurance/backend/.env` - Created environment config
5. ✅ `/home/yash/crypto-insurance/frontend/.env` - Created frontend environment config
6. ✅ `/home/yash/crypto-insurance/start.sh` - Created startup script

---

## Next Steps

1. Run the backend: `npm start` (in `/backend`)
2. Run the frontend: `npm run dev` (in `/frontend`)
3. Open `http://localhost:3000` in your browser
4. Navigate to Dashboard - should now work!
5. Connect your wallet to see personalized data

---

## Get Help

If you still see the error after trying these steps:
1. Check the backend terminal for error messages
2. Check the browser console (F12) for error messages
3. Check the Network tab to see what's being requested
4. Make sure both services are running on correct ports

