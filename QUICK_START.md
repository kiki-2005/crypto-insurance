# 🚀 Quick Start Guide - Crypto Insurance System

## Prerequisites
- Node.js 16+ installed
- npm or yarn
- MetaMask or similar wallet extension

## Installation & Setup

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Start Local Blockchain (Hardhat)
```bash
# Terminal 1
npm run node
```
Keep this running in a separate terminal.

### 3. Deploy Contracts (Optional - for full functionality)
```bash
# Terminal 2
npm run deploy:local
```

### 4. Start Backend Server
```bash
# Terminal 3
cd backend
npm start
```

Expected output:
```
✅ Contract service initialized
🚀 Crypto Insurance Backend running on port 3001
```

### 5. Start Frontend
```bash
# Terminal 4
cd frontend
npm run dev
```

The frontend will open at `http://localhost:3000` (or the port shown in terminal).

---

## 🔑 Admin Access

To access the admin panel:
1. Connect your wallet with the admin address:
   ```
   0xaa91592fd2e0ad8575e292aa71a284c6c59adcff
   ```
2. Navigate to `/admin` route
3. All admin tabs should now work!

---

## ✅ What Was Fixed

1. ✅ **Admin page** - Fully implemented with all tabs working
2. ✅ **Dashboard** - Working properly with analytics
3. ✅ **Backend routes** - All endpoints accessible
4. ✅ **Contract service** - Resilient error handling
5. ✅ **Authentication** - Optional auth for admin/analytics routes

---

## 📖 More Details

See `FIXES_COMPLETE.md` for detailed information about all fixes.

---

**Your project is now ready to use! 🎉**

