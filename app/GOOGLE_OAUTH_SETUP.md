# Google OAuth Setup for Payload CMS Admin

This guide explains how to set up Google OAuth authentication for the Payload CMS admin panel.

## 🔧 Configuration Complete

The following components have been configured:

### ✅ 1. Auth Plugin Installed
- `payload-auth-plugin` added to dependencies
- Supports Google, GitHub, Apple, Facebook, Discord, and more

### ✅ 2. Collections Created
- **Users Collection**: `/src/collections/Users/index.ts` (existing)
- **Accounts Collection**: `/src/collections/Accounts/index.ts` (new)

### ✅ 3. Plugin Configuration
- Auth plugin configured in `/src/plugins/index.ts`
- Google OAuth provider enabled for admin login
- Auto-signup enabled for OAuth users

### ✅ 4. Environment Variables
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` added to `.env`

## 🚀 Setup Google OAuth Application

### Step 1: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     http://localhost:3005/api/admin/oauth/google/callback
     http://localhost:3000/api/admin/oauth/google/callback
     http://localhost:3001/api/admin/oauth/google/callback
     http://localhost:3002/api/admin/oauth/google/callback
     http://localhost:3003/api/admin/oauth/google/callback
     ```
   - For production, add your domain:
     ```
     https://yourdomain.com/api/admin/oauth/google/callback
     ```

### Step 2: Update Environment Variables

Replace the placeholder values in `.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

## 🧪 Testing the Setup

### Step 1: Initialize Database
```bash
cd /home/paulo/Programs/paulovila.org/apps/latinos/app
pnpm payload migrate
```

### Step 2: Start Development Server
```bash
pnpm dev --port 3003
```

### Step 3: Test Google OAuth
1. Navigate to `http://localhost:3003/admin`
2. You should see a "Sign in with Google" button
3. Click it to test the OAuth flow

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure the redirect URI in Google Console matches exactly
   - Format: `http://localhost:PORT/api/admin/oauth/google/callback`

2. **"Client ID not found"**
   - Verify `GOOGLE_CLIENT_ID` is correctly set in `.env`
   - Restart the development server after changing `.env`

3. **"Access blocked"**
   - Make sure Google+ API is enabled in Google Cloud Console
   - Check OAuth consent screen configuration

4. **Database errors**
   - Run `pnpm payload migrate` to create required tables
   - Ensure SQLite database file has write permissions

### Debug Mode

To enable debug logging, add to `.env`:
```env
DEBUG=payload-auth-plugin:*
```

## 📋 OAuth Flow

1. User clicks "Sign in with Google" on `/admin/login`
2. Redirected to Google OAuth consent screen
3. User authorizes the application
4. Google redirects back to `/api/admin/oauth/google/callback`
5. Plugin creates/updates user and account records
6. User is redirected to `/admin` dashboard

## 🔐 Security Notes

- Keep `GOOGLE_CLIENT_SECRET` secure and never commit to version control
- Use HTTPS in production
- Configure OAuth consent screen properly in Google Console
- Consider implementing additional security measures like 2FA

## 🎯 Next Steps

1. **Set up production OAuth app** with your production domain
2. **Configure OAuth consent screen** with proper branding
3. **Add additional providers** (GitHub, Apple, etc.) if needed
4. **Implement role-based access control** for different user types
5. **Set up email notifications** for new OAuth signups

## 📚 Additional Resources

- [Payload Auth Plugin Documentation](https://authsmith.com/docs/plugins/payload)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Payload CMS Authentication Guide](https://payloadcms.com/docs/authentication/overview)