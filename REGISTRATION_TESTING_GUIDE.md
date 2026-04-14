# Registration Flow - Testing & Troubleshooting Guide

## How the Registration Flow Works Now

### Architecture Overview

The registration check is now handled by the **ProtectedRoute** component in `App.jsx`. This ensures that **every time** a user tries to access a protected page (like `/dashboard`), the system checks if they are registered.

### Flow Diagram

```
User Action → Connect Wallet → Try to Access Dashboard
                                        ↓
                                 ProtectedRoute Check
                                        ↓
                    ┌───────────────────┴───────────────────┐
                    ↓                                       ↓
            User in Database?                        User NOT in Database?
                    ↓                                       ↓
            Allow Access to Dashboard              Redirect to /register
```

### Step-by-Step Flow

1. **User connects wallet** (from Home page or Navbar)
2. **User tries to access `/dashboard`**
3. **ProtectedRoute component activates:**
   - Checks if wallet is connected ✓
   - Makes API call to `/api/users/:walletAddress`
   - If user exists (200 OK) → Allow access to dashboard
   - If user NOT found (404) → Redirect to `/register`
4. **User completes registration**
5. **User is redirected to dashboard**

## Testing Instructions

### Test Case 1: New User (First Time Connection)

**Prerequisites:**
- Backend server running on `http://localhost:5000`
- MongoDB running and connected
- Use a wallet address that has NEVER been registered

**Steps:**
1. Open browser to `http://localhost:5173` (or your Vite dev server URL)
2. Click "Connect Wallet" or "Get Started"
3. Approve MetaMask connection
4. **Expected:** You should be redirected to `/register`
5. Fill out the registration form
6. Click "Complete Registration"
7. **Expected:** You should be redirected to `/dashboard`

**What to Check:**
- Browser console should show:
  ```
  🔍 Checking registration status for: 0x...
  ⚠️ User not registered
  ```
- Network tab should show:
  - GET `/api/users/0x...` → 404 Not Found
  - POST `/api/users` → 200 OK (after form submission)

### Test Case 2: Existing User (Returning User)

**Prerequisites:**
- Same wallet address that was used in Test Case 1 (already registered)

**Steps:**
1. Logout if currently connected
2. Refresh the page
3. Click "Connect Wallet"
4. Approve MetaMask connection
5. **Expected:** You should be redirected directly to `/dashboard` (skip registration)

**What to Check:**
- Browser console should show:
  ```
  🔍 Checking registration status for: 0x...
  ✅ User is registered
  ```
- Network tab should show:
  - GET `/api/users/0x...` → 200 OK

### Test Case 3: Connecting from Navbar

**Prerequisites:**
- Use a NEW wallet address (not registered)

**Steps:**
1. On the home page, click "Connect Wallet" button in the navbar
2. Approve MetaMask connection
3. Try to click "Dashboard" link in navbar
4. **Expected:** You should be redirected to `/register`

### Test Case 4: Account Switching

**Prerequisites:**
- Have 2 MetaMask accounts
- Account A: Registered
- Account B: Not registered

**Steps:**
1. Connect with Account A
2. Navigate to dashboard (should work)
3. Switch to Account B in MetaMask
4. **Expected:** You should be automatically redirected to `/register`

## Troubleshooting

### Problem: User goes directly to dashboard without registration

**Possible Causes:**

1. **Backend is not running**
   ```bash
   # Check if backend is running
   cd backend
   npm start
   ```
   
2. **User already exists in database**
   ```bash
   # Check MongoDB
   mongosh
   use supply_chain_db
   db.users.find({ walletAddress: "0x..." })
   ```
   
   If user exists, delete them to test:
   ```bash
   db.users.deleteOne({ walletAddress: "0x..." })
   ```

3. **API URL is wrong**
   - Check `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
   - Restart frontend dev server after changing .env

4. **Network error is being caught**
   - Open browser console
   - Check Network tab for failed requests
   - If API call fails, ProtectedRoute assumes user is registered (to avoid blocking access)

### Problem: Registration page shows but user is already registered

**Solution:**
- Clear the user from database
- Or update the user's information via the registration form (it will update existing user)

### Problem: Infinite redirect loop

**Possible Cause:**
- Registration page is also protected by ProtectedRoute

**Solution:**
- Verify that `/register` route is NOT wrapped in `<ProtectedRoute>`
- Check `App.jsx`:
  ```javascript
  <Route path="/register" element={<Register />} />  // ✓ Correct
  // NOT:
  <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />  // ✗ Wrong
  ```

### Problem: Loading spinner shows forever

**Possible Causes:**
1. API call is hanging
2. Backend is not responding

**Solution:**
- Check backend logs
- Verify MongoDB connection
- Check browser Network tab for pending requests

## Debugging Tips

### Enable Detailed Logging

Add this to your browser console to see all registration checks:
```javascript
localStorage.setItem('debug', 'trustcure:*');
```

### Check Current User in Database

```bash
# Connect to MongoDB
mongosh

# Switch to database
use supply_chain_db

# Find user by wallet address
db.users.find({ walletAddress: "0x1234..." }).pretty()

# See all users
db.users.find().pretty()

# Delete a user (for testing)
db.users.deleteOne({ walletAddress: "0x1234..." })
```

### Check API Endpoint Manually

```bash
# Check if user exists
curl http://localhost:5000/api/users/0x1234...

# Should return:
# - 200 + user data if exists
# - 404 if not found
```

### Monitor Network Requests

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for requests to `/api/users/`
5. Check status codes:
   - 200 = User exists
   - 404 = User not found
   - 500 = Server error

## Key Files Modified

1. **`frontend/src/App.jsx`**
   - Enhanced `ProtectedRoute` component
   - Added registration check with API call
   - Redirects to `/register` if user not found

2. **`frontend/src/pages/Home.jsx`**
   - Simplified - removed duplicate registration check
   - Just connects wallet and navigates to dashboard
   - ProtectedRoute handles the rest

3. **`frontend/src/pages/Register.jsx`**
   - Registration form
   - Submits to `/api/users` endpoint
   - Redirects to dashboard after success

4. **`frontend/src/contexts/Web3Context.jsx`**
   - Fixed logout logic
   - Uses `window.location.replace('/')`
   - Proper state cleanup

## Environment Setup

### Required Services

1. **MongoDB**
   ```bash
   # Start MongoDB (if using local installation)
   mongod
   ```

2. **Backend Server**
   ```bash
   cd backend
   npm install
   npm start
   # Should run on http://localhost:5000
   ```

3. **Frontend Dev Server**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Should run on http://localhost:5173
   ```

### Environment Variables

**`frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

**`backend/.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/supply_chain_db
PORT=5000
```

## Expected Behavior Summary

| Scenario | Expected Behavior |
|----------|------------------|
| New user connects wallet | Redirected to `/register` |
| New user completes registration | Redirected to `/dashboard` |
| Existing user connects wallet | Redirected to `/dashboard` |
| User clicks logout | Redirected to `/` (home) |
| User switches MetaMask account | Registration check runs again |
| Backend is down | User allowed to dashboard (fail-safe) |
| User tries to access protected route without wallet | Redirected to `/` (home) |

## Common Issues & Solutions

### Issue: "User goes to dashboard without registering"

**Check:**
1. Is backend running? `curl http://localhost:5000/api/users/0x...`
2. Does user already exist in DB? Check MongoDB
3. Is VITE_API_URL correct in `.env`?
4. Check browser console for errors

**Solution:**
- Delete user from database to test fresh registration
- Verify backend is running and accessible
- Check API URL environment variable

### Issue: "Registration form doesn't submit"

**Check:**
1. Backend logs for errors
2. MongoDB connection status
3. Browser Network tab for failed POST request
4. Form validation errors

**Solution:**
- Ensure all required fields are filled
- Check backend error logs
- Verify MongoDB is running

### Issue: "Logout doesn't work"

**Check:**
1. Browser console for errors
2. localStorage is being cleared
3. Page redirects to home

**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Check Web3Context.jsx disconnectWallet function

## Success Criteria

✅ New users are redirected to registration page
✅ Existing users go directly to dashboard
✅ Registration form submits successfully
✅ User data is saved to MongoDB
✅ Logout clears session and redirects to home
✅ Account switching triggers new registration check
✅ Protected routes are inaccessible without registration

## Next Steps

After confirming the registration flow works:

1. **Add email verification** (optional)
2. **Add profile editing page**
3. **Add admin approval for business roles**
4. **Add user profile pictures**
5. **Add company verification**
