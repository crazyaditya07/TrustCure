# TrustCure - Logout Fix & Registration Page Implementation

## Overview
This document describes the changes made to fix the logout functionality and implement a user registration flow for the TrustCure supply chain tracking application.

## Changes Made

### 1. Fixed Logout Logic

#### File: `frontend/src/contexts/Web3Context.jsx`

**Problem:**
- The logout function was using `window.location.href = '/'` which caused inconsistent behavior
- State wasn't being properly cleared before navigation
- Users experienced issues when trying to log out

**Solution:**
- Updated `disconnectWallet()` function to:
  - Use `window.location.replace('/')` instead of `window.location.href`
  - Added `setTimeout` to ensure state updates complete before navigation
  - Added proper error state clearing
  - Improved console logging for debugging

**Changes:**
```javascript
const disconnectWallet = useCallback(() => {
    console.log('🔄 Disconnecting wallet...');
    
    // Clear localStorage session
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    
    // Clear all state
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setUserRoles(['CONSUMER']);
    setContracts({ supplyChainNFT: null, accessManager: null });
    setError(null);
    
    console.log('✅ Wallet disconnected and session cleared');
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
        window.location.replace('/');
    }, 100);
}, []);
```

### 2. Created Registration Page

#### File: `frontend/src/pages/Register.jsx` (NEW)

**Features:**
- Beautiful glassmorphism design matching the app aesthetic
- Form fields:
  - **Full Name** (required)
  - **Email Address** (optional)
  - **Role** (required) - Dropdown: Consumer, Manufacturer, Distributor, Retailer
  - **Company/Organization** (optional)
  - **Address** (optional)
  - **City** (optional)
  - **Country** (optional)
- Wallet address display
- Form validation
- Error handling
- Loading states
- Redirects to dashboard after successful registration

**API Integration:**
- Sends POST request to `/api/users` endpoint
- Includes wallet address and form data
- Handles response and errors gracefully

### 3. Updated Application Routing

#### File: `frontend/src/App.jsx`

**Changes:**
- Added import for Register component
- Added `/register` route to the application routes

```javascript
import Register from './pages/Register';

// In routes:
<Route path="/register" element={<Register />} />
```

### 4. Enhanced Home Page Flow

#### File: `frontend/src/pages/Home.jsx`

**Changes:**
- Updated `handleGetStarted()` function to check if user exists in database
- Added logic to redirect new users to registration page
- Existing users go directly to dashboard
- Improved account availability handling after wallet connection

**Flow:**
```javascript
const handleGetStarted = async () => {
    // 1. Connect wallet if not connected
    // 2. Get user account
    // 3. Check if user exists in database via API
    // 4. Redirect based on user status:
    //    - New user → /register
    //    - Existing user → /dashboard
};
```

## User Flow

### New User Registration Flow
1. User visits home page (`/`)
2. Clicks "Connect Wallet" or "Get Started"
3. MetaMask prompts for wallet connection
4. User approves connection
5. System checks if user exists in database
6. **New user** → Redirected to `/register`
7. User fills out registration form
8. Submits form
9. User data saved to MongoDB via backend API
10. Redirected to `/dashboard`

### Existing User Flow
1. User visits home page (`/`)
2. Clicks "Connect Wallet" or "Get Started"
3. MetaMask prompts for wallet connection
4. User approves connection
5. System checks if user exists in database
6. **Existing user** → Redirected directly to `/dashboard`

### Logout Flow
1. User clicks logout button in navbar
2. `disconnectWallet()` is called
3. All state is cleared:
   - Provider, signer, account
   - User roles reset to ['CONSUMER']
   - Contracts cleared
   - localStorage session removed
4. Logout flag set to prevent auto-reconnect
5. User redirected to home page (`/`)
6. Clean state ensures fresh start on next login

## API Endpoints Used

### Check User Exists
```
GET /api/users/:walletAddress
```
- Returns 200 with user data if user exists
- Returns 404 if user not found

### Create/Update User
```
POST /api/users
```
**Request Body:**
```json
{
  "walletAddress": "0x...",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "role": "MANUFACTURER",
  "roles": ["MANUFACTURER"]
}
```

## Testing Instructions

### Test Logout Functionality
1. Start the frontend: `cd frontend && npm run dev`
2. Start the backend: `cd backend && npm start`
3. Connect your wallet
4. Navigate to dashboard
5. Click the logout button in navbar
6. Verify:
   - You're redirected to home page
   - Wallet is disconnected
   - No errors in console
   - Page reload doesn't auto-reconnect

### Test Registration Flow
1. Use a wallet address that hasn't been registered
2. Click "Connect Wallet" on home page
3. Approve MetaMask connection
4. Verify you're redirected to `/register`
5. Fill out the registration form
6. Submit the form
7. Verify:
   - No errors in console
   - User data saved to database
   - Redirected to dashboard
   - User info appears in navbar

### Test Existing User Flow
1. Use a wallet address that's already registered
2. Click "Connect Wallet" on home page
3. Approve MetaMask connection
4. Verify you're redirected directly to `/dashboard`
5. No registration page shown

## Environment Variables

Make sure these are set in `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## Database Schema

The User model in MongoDB should have these fields:
- `walletAddress` (String, required, unique)
- `name` (String, required)
- `email` (String, optional)
- `company` (String, optional)
- `location` (Object with address, city, country)
- `role` (String, enum)
- `roles` (Array of Strings)
- `isVerified` (Boolean)
- `isActive` (Boolean)
- `registeredAt` (Date)
- `lastLogin` (Date)

## Styling

The registration page uses existing CSS classes from `frontend/src/styles/index.css`:
- `.card` - Glass card container
- `.form-label` - Form field labels
- `.form-input` - Input fields and select dropdowns
- `.btn`, `.btn-primary`, `.btn-lg` - Buttons
- CSS variables for colors, spacing, and effects

## Future Enhancements

1. **Email Verification**
   - Send verification email after registration
   - Verify email before allowing full access

2. **Profile Editing**
   - Add `/profile` page
   - Allow users to update their information

3. **Role Verification**
   - Admin approval for manufacturer/distributor/retailer roles
   - Prevent self-assignment of privileged roles

4. **Social Login**
   - Optional email/password authentication
   - Link multiple wallets to one account

5. **KYC Integration**
   - Identity verification for business roles
   - Document upload and verification

## Troubleshooting

### Issue: Logout doesn't work
- Check browser console for errors
- Verify localStorage is being cleared
- Check that LOGOUT_FLAG_KEY is set
- Try hard refresh (Ctrl+Shift+R)

### Issue: Registration page doesn't show
- Verify backend API is running
- Check API_URL environment variable
- Look for 404 errors in network tab
- Verify user doesn't already exist in database

### Issue: Form submission fails
- Check backend logs for errors
- Verify MongoDB connection
- Check request payload in network tab
- Ensure all required fields are filled

## Files Modified

1. `frontend/src/contexts/Web3Context.jsx` - Fixed logout logic
2. `frontend/src/pages/Register.jsx` - NEW registration page
3. `frontend/src/App.jsx` - Added register route
4. `frontend/src/pages/Home.jsx` - Enhanced user flow logic

## Dependencies

No new dependencies were added. The implementation uses existing packages:
- React Router for navigation
- Existing Web3 context for wallet management
- Fetch API for backend communication
- Existing CSS framework for styling
