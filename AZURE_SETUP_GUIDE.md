# 🔧 Complete Azure App Registration Setup Guide

## Step-by-Step: Create New App Registration for Personal Outlook Accounts

### Step 1: Access Azure Portal
1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft account
3. Search for "Azure Active Directory" in the top search bar
4. Click on **Azure Active Directory**

### Step 2: Create New App Registration
1. In the left menu, click **App registrations**
2. Click **+ New registration** (blue button at the top)
3. Fill in the form:

**Name:** `My Outlook Mail App` (or any name you prefer)

**Supported account types:** 
- ❌ **Don't select:** "Accounts in this organizational directory only"
- ✅ **SELECT:** "Accounts in any organizational directory (Any Azure AD directory - Multitenant)" (for multiple organizations)
- ❌ **Don't select:** "Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox, Outlook.com)"

**Redirect URI:**
- Platform: **Single-page application (SPA)**
- URI: `http://localhost:4200`

4. Click **Register**

### Step 3: Copy Your New Client ID
1. On the **Overview** page, copy the **Application (client) ID**
2. This is your new `clientId` - save it somewhere safe

### Step 4: Configure Authentication
1. In the left menu, click **Authentication**
2. Scroll down to **Single-page application**
3. Verify `http://localhost:4200` is listed
4. If not, click **Add URI** and add it
5. Scroll down to **Advanced settings**
6. Enable **Allow public client flows** (toggle ON)
7. Click **Save**

### Step 5: Add API Permissions
1. In the left menu, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Search and add these permissions:
   - ✅ `User.Read`
   - ✅ `Mail.Read`
   - ✅ `Mail.Send`
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

### Step 6: Update Your Angular Code
Replace your `clientId` in `src/app/auth.config.ts`:

```typescript
export const azureAd = {
  clientId: 'YOUR_NEW_CLIENT_ID_HERE', // Replace with the new Client ID from Step 3
  redirectUri: 'http://localhost:4200',
  authority: "https://login.microsoftonline.com/organizations", // Only allows organizational accounts
};
```

### Step 7: Test Your App
1. Run your Angular app: `ng serve`
2. Try logging in with an organizational account (work/school email)
3. The login should work without the "unauthorized_client" error

## 🔍 Troubleshooting

### If you still get "unauthorized_client" error:
1. **Double-check Step 2:** Make sure you selected "Accounts in any organizational directory and personal Microsoft accounts"
2. **Verify Client ID:** Make sure you're using the new Client ID from the new app registration
3. **Clear browser cache:** Clear your browser's local storage and cookies
4. **Check redirect URI:** Ensure `http://localhost:4200` is exactly correct (no trailing slash)

### If you get permission errors:
1. **Check API Permissions:** Make sure all three permissions (User.Read, Mail.Read, Mail.Send) are added
2. **Grant admin consent:** Click "Grant admin consent" in the API permissions page
3. **Wait a few minutes:** Sometimes it takes a few minutes for permissions to propagate

## ✅ Success Indicators

When everything is working correctly, you should see:
- ✅ Login popup opens without errors
- ✅ You can sign in with @outlook.com, @hotmail.com accounts
- ✅ Your app can read emails from the inbox
- ✅ No "unauthorized_client" errors in the console

## 🚨 Important Notes

- **Don't use the old app registration** - create a new one with the correct settings
- **The "common" authority** supports both personal and work accounts
- **Personal accounts** need the specific "personal Microsoft accounts" option selected
- **Work/school accounts** will also work with this configuration

---

**Need help?** If you're still having issues, check the browser console for specific error messages and let me know what you see!
