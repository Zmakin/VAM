# Google Drive API Setup for Developers

## ?? URGENT FIX - Origin Registration Error

**If you're getting this error:**
> "Not a valid origin for the client: http://localhost:5173 has not been registered"

**Follow these steps immediately:**

### Quick Fix Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** ? **"Credentials"**
4. Click on your **OAuth 2.0 Client ID** (the one that starts with your client ID number)
5. Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**
6. Add exactly: `http://localhost:5173`
7. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**  
8. Add exactly: `http://localhost:5173`
9. Click **"SAVE"** at the bottom
10. **Wait 5-10 minutes** for changes to propagate
11. Try signing in again

---

## One-Time Setup (Developer Only)

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" 
3. Name it something like "Virtual Account Manager"
4. Click "Create"

### 2. Enable Google Drive API
1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and click "Enable"

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Name it (e.g., "VAM Web Client")
5. **IMPORTANT:** Add authorized origins:
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
6. **IMPORTANT:** Add authorized redirect URIs:
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
7. Copy the **Client ID** (you'll need this)

### 4. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Fill in required fields:
   - App name: "Virtual Account Manager"
   - User support email: your email
   - Developer contact: your email
4. **Add scopes**: Click "ADD OR REMOVE SCOPES" and add:
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users (optional for development)

### 5. Add Client ID to Your App
Create `.env` file in your project:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

## What Users Experience

Users simply:
1. Open your app
2. Click "Sign in with Google" 
3. Grant permission to store files in their Drive
4. That's it! No API setup needed.

## Security Notes

- The Client ID can be public (it's not a secret)
- Each user's data stays in their own Google Drive
- Users can revoke access anytime through their Google Account settings
- Your app never sees other users' data

## Production Deployment

When you deploy your app:
1. Add your production domain to authorized origins in Google Cloud Console
2. Update OAuth consent screen with production info
3. Consider publishing the OAuth consent screen for public use

# Google Drive API Setup - Troubleshooting Guide

## Quick Fix for Sign-in Errors

If you're getting Google Drive sign-in errors, follow these steps:

### 1. ? Check Your .env File
Create a `.env` file in your project root with your Google Client ID:
```
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
```

?? **Common mistakes:**
- Missing the `.env` file entirely
- Typo in the variable name (must be exactly `VITE_GOOGLE_CLIENT_ID`)
- Wrong Client ID format (should end with `.apps.googleusercontent.com`)

### 2. ?? Restart Development Server
After creating/updating `.env`, restart your dev server:
```bash
npm run dev
```

### 3. ?? Verify Google Cloud Console Setup

#### OAuth Client Configuration:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, ensure you have:
   ```
   http://localhost:5173
   ```
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173
   ```

#### OAuth Consent Screen:
1. Go to **APIs & Services > OAuth consent screen**
2. Set **User Type** to "External" (unless you have Google Workspace)
3. Fill required fields:
   - **App name**: "Virtual Account Manager" (or your preferred name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. **Scopes**: Add `https://www.googleapis.com/auth/drive.file`
5. **Test users**: Add your email address for testing

## Common Error Solutions

### Error: "Not a valid origin for the client"
**Cause**: `http://localhost:5173` not added to authorized origins
**Solution**: 
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click your OAuth 2.0 Client ID
3. Add `http://localhost:5173` to **both** "Authorized JavaScript origins" AND "Authorized redirect URIs"
4. Click Save and wait 5-10 minutes
5. Try again

### Error: "Google Drive sign-in failed: Object"
**Cause**: Missing or incorrect Client ID
**Solution**: 
1. Check your `.env` file has the correct `VITE_GOOGLE_CLIENT_ID`
2. Restart development server
3. Clear browser cache

### Error: "Popup blocked by browser"
**Cause**: Browser is blocking the OAuth popup
**Solution**:
1. Allow popups for `localhost:5173`
2. Try signing in again
3. Or use different browser (Chrome/Edge work best)

### Error: "access_denied"
**Cause**: User denied permission or OAuth scope issues
**Solution**:
1. Try signing in again and click "Allow"
2. Check OAuth consent screen has correct scopes
3. Make sure app is not restricted to organization users only

### Error: "CSP violations" or "iframe sandbox errors"
**Cause**: Content Security Policy blocking Google APIs
**Solution**: ? Already fixed in the updated `index.html`

### Error: "Failed to load resource: 400"
**Cause**: OAuth configuration mismatch
**Solution**:
1. Verify authorized origins in Google Cloud Console
2. Make sure redirect URIs are set correctly
3. Check if app domain matches configured domain

## Step-by-Step Verification

### 1. Environment Setup ?
- [ ] `.env` file exists in project root
- [ ] Contains `VITE_GOOGLE_CLIENT_ID=your_client_id`
- [ ] Development server restarted after adding .env

### 2. Google Cloud Console ?
- [ ] Project created and Google Drive API enabled
- [ ] OAuth 2.0 Client ID created
- [ ] **Authorized JavaScript origins includes `http://localhost:5173`**
- [ ] **Authorized redirect URIs includes `http://localhost:5173`**
- [ ] OAuth consent screen configured with external user type
- [ ] Scopes include `https://www.googleapis.com/auth/drive.file`

### 3. Browser Setup ?
- [ ] Popups allowed for localhost:5173
- [ ] JavaScript enabled
- [ ] No ad blockers interfering
- [ ] Using supported browser (Chrome, Edge, Firefox, Safari)

## Testing Your Setup

1. Open your app in browser
2. Go to Settings ? Data Synchronization
3. Look for Google Drive Sync section
4. If you see "Google Drive sync requires setup" - check your .env file
5. If you see "Sign in with Google" button - your setup is correct!
6. Click the button and grant permissions
7. You should see "Successfully signed in to Google Drive!"

## Still Having Issues?

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Common issues:
   - `CLIENT_ID not configured` ? Check .env file
   - `Failed to load Google API` ? Check internet connection
   - `Invalid client_id` ? Verify Client ID in Google Cloud Console
   - `Not a valid origin` ? Add localhost:5173 to authorized origins

### Try These Browsers
- ? **Chrome** - Best support
- ? **Edge** - Full compatibility  
- ? **Firefox** - Good support
- ?? **Safari** - May have popup restrictions
- ?? **Mobile browsers** - Limited popup support

## Development vs Production

### Development (localhost)
- Use `http://localhost:5173` in authorized origins
- Can use "External" OAuth consent screen
- Test users don't need verification

### Production
- Must use `https://yourdomain.com` in authorized origins
- Consider publishing OAuth consent screen for public use
- HTTPS required for OAuth to work

## Quick Troubleshooting Commands

```bash
# Check if .env file exists and has content
cat .env

# Restart dev server
npm run dev

# Clear npm cache if needed
npm cache clean --force

# Reinstall dependencies if needed
rm -rf node_modules package-lock.json
npm install
```

---

**Need more help?** Check the browser console for specific error messages and search for the exact error text.