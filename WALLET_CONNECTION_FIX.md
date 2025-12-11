# Wallet Connection Fix

## Issue
When trying to connect wallet, user sees: "Wallet disconnected" and "Failed to log in."

## Fixes Applied

### 1. Fixed Signature Verification (Backend)
**Problem:** Using incorrect ethers v6 API for signature verification.

**Solution:** 
- Changed from `ethers.hashMessage()` + `ethers.recoverAddress()` to `ethers.verifyMessage()` 
- `verifyMessage()` is the correct ethers v6 API that handles message hashing automatically

**File:** `backend/src/routes/auth.js`

### 2. Improved Error Handling (Frontend)
**Problem:** Error handling was showing both "Failed to log in" and "Wallet disconnected" toasts.

**Solution:**
- Modified `disconnect()` to accept optional parameter to suppress toast
- On authentication error, clean up state without showing disconnect toast
- Show only the actual error message

**File:** `frontend/src/stores/walletStore.ts`

### 3. Enhanced Error Messages (Backend)
**Problem:** Error messages weren't helpful for debugging.

**Solution:**
- Added detailed logging for debugging
- Improved error messages to be more descriptive
- Removed strict signature length validation (ethers v6 signatures can vary)

**File:** `backend/src/routes/auth.js`

---

## Testing

1. **Check Backend is Running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test Connection:**
   - Open frontend
   - Click "Connect Wallet"
   - Approve MetaMask connection
   - Sign the authentication message
   - Should see "Logged in successfully!"

3. **Check Backend Logs:**
   - Watch backend console for any errors
   - Should see logs like:
     ```
     Verifying signature for address: 0x...
     Recovered address: 0x...
     ```

---

## Common Issues

### Issue: "Nonce not found"
**Cause:** Nonce expired or never requested
**Solution:** The frontend automatically requests a new nonce before signing

### Issue: "Invalid signature format"
**Cause:** Signature format is incorrect or MetaMask rejected signing
**Solution:** Make sure you approve the signature request in MetaMask

### Issue: "Address mismatch"
**Cause:** Signed with different wallet address
**Solution:** Make sure you're signing with the same address that requested the nonce

### Issue: Backend not responding
**Cause:** Backend server not running or CORS issue
**Solution:** 
- Check backend is running: `cd backend && npm start`
- Check CORS settings in `server.js`

---

## Next Steps

If still experiencing issues:

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Share the error with support

2. **Check Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try connecting wallet
   - Check if `/api/auth/nonce` and `/api/auth/verify` requests succeed
   - Check response status codes and messages

3. **Check Backend Logs:**
   - Look at backend terminal
   - Check for any error messages
   - Verify signature verification logs

