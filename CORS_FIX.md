# CORS Fix Applied

## Issue
CORS error: Backend was allowing `http://localhost:5173` but frontend is running on `http://localhost:3000`.

## Fix
Updated CORS configuration in `backend/src/server.js` to:
1. Allow both common development ports (3000 and 5173)
2. In development mode, allow all localhost origins automatically
3. Properly handle preflight requests

## Action Required
**You must restart your backend server** for the changes to take effect:

```bash
# Stop the current backend (Ctrl+C)
# Then restart it:
cd backend
npm start
```

## What Changed
- CORS now allows: `localhost:3000`, `localhost:5173`, `127.0.0.1:3000`, `127.0.0.1:5173`
- In development mode, any localhost origin is automatically allowed
- Preflight OPTIONS requests are properly handled

After restarting the backend, try connecting your wallet again!

