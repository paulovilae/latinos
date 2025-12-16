# Google OAuth Setup Guide

## 🚀 Complete Setup Instructions for Google Sign-In

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" dropdown
   - Click "New Project"
   - Enter project name: `AI Trading Platform`
   - Click "Create"

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on "Google+ API"
   - Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - In the left sidebar, click "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Consent Screen** (if prompted)
   - Click "Configure Consent Screen"
   - Choose "External" (for testing) or "Internal" (for organization use)
   - Fill in required fields:
     - App name: `AI Trading Platform`
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Add scopes: `email`, `profile`, `openid`
   - Click "Save and Continue"
   - Add test users (your email addresses)
   - Click "Save and Continue"

3. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: `AI Trading Platform Web Client`
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com (for production)
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback (for production)
     ```
   - Click "Create"

4. **Copy Your Credentials**
   - Copy the "Client ID" (starts with numbers, ends with `.apps.googleusercontent.com`)
   - Copy the "Client Secret" (if needed for server-side auth)

### Step 4: Configure Environment Variables

1. **Create/Update `.env.local`**
   ```bash
   # In ai-trading-platform/apps/trading/.env.local
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

2. **Restart Your Development Server**
   ```bash
   # Stop the current server (Ctrl+C)
   pnpm dev
   ```

### Step 5: Test the Integration

1. **Visit the Login Page**
   - Go to: http://localhost:3000/admin/login
   - You should now see the official Google "Sign in with Google" button

2. **Test Google Sign-In**
   - Click the Google button
   - Complete the OAuth flow
   - Check browser console for JWT token logs
   - User should be created/logged in automatically

### Step 6: Production Deployment

1. **Update Environment Variables**
   ```bash
   # For production deployment
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

2. **Update Authorized Domains**
   - In Google Cloud Console → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add your production domain to:
     - Authorized JavaScript origins: `https://yourdomain.com`
     - Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`

## 🔧 Current Implementation Features

### ✅ What's Working
- **Official Google Sign-In Button**: Uses Google's native JavaScript API
- **JWT Token Processing**: Receives and decodes Google's JWT credentials
- **User Creation**: Automatically creates new users from Google profile data
- **Payload Integration**: Seamlessly integrates with Payload CMS user system
- **Error Handling**: Proper error handling and logging
- **Separated UI**: "Don't have an account" link is properly separated
- **No Multiple Request Errors**: Fixed FedCM initialization issues

### ✅ Components Created
- `GoogleSignInButton`: Official Google Sign-In button component
- `CreateAccountLink`: Separated account creation link
- `/api/auth/google`: Backend endpoint for JWT processing

### 🎯 Expected Behavior After Setup

1. **With Real Credentials**:
   - Google button will render properly
   - Clicking opens Google OAuth popup
   - User can sign in with Google account
   - JWT token is sent to backend
   - User is created/logged in automatically
   - Page refreshes to show logged-in state

2. **User Experience**:
   - Traditional email/password login
   - Google Sign-In option below login form
   - Separate "Create account" link
   - Seamless authentication flow

## 🚨 Troubleshooting

### Common Issues

1. **Button Not Rendering**
   - Check if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
   - Verify client ID format (should end with `.apps.googleusercontent.com`)
   - Check browser console for errors

2. **"Invalid Client" Error**
   - Verify the client ID is correct
   - Check authorized JavaScript origins in Google Cloud Console
   - Ensure the domain matches exactly (including http/https)

3. **Redirect URI Mismatch**
   - Add the exact redirect URI to Google Cloud Console
   - Format: `http://localhost:3000/api/auth/google/callback`

4. **CORS Errors**
   - Verify authorized JavaScript origins in Google Cloud Console
   - Ensure origins match your development/production URLs

### Debug Steps

1. **Check Environment Variables**
   ```bash
   # In your terminal
   echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
   ```

2. **Check Browser Console**
   - Open Developer Tools → Console
   - Look for Google Sign-In related logs
   - Check for JWT token output

3. **Verify API Endpoint**
   - Test: `POST http://localhost:3000/api/auth/google`
   - Should accept JWT credential in request body

## 📝 Next Steps

After setting up Google OAuth:

1. **Enhance User Experience**
   - Add loading states
   - Improve error messages
   - Add success notifications

2. **Security Improvements**
   - Verify JWT signatures server-side
   - Add rate limiting
   - Implement session management

3. **Production Readiness**
   - Set up proper error monitoring
   - Configure logging
   - Add analytics tracking

---

**Need Help?** Check the browser console for detailed error messages and refer to Google's official documentation: https://developers.google.com/identity/gsi/web