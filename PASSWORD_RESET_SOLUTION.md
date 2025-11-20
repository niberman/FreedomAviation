# Password Reset 403 Error - Solution
**Issue**: Getting 403 when accessing /reset-password on localhost:5000  
**Root Cause**: Port 5000 is taken by Apple AirPlay  
**Solution**: Use port 3001 or disable AirPlay on port 5000

---

## ✅ Quick Fix - Option 1: Use Port 3001

Your server is now running on **port 3001** instead of 5000!

### Update Supabase Redirect URLs:

**Go here**: https://supabase.com/dashboard/project/wsepwuxkwjnsgmkddkjw/auth/url-configuration

**Add** (click "Add URL" button):
```
http://localhost:3001/reset-password
```

### Test Password Reset:

```bash
# 1. Request new reset (from terminal)
curl -X POST http://localhost:3001/api/test

# 2. Or manually copy env.local to .env.local:
cp env.local .env.local

# 3. Request password reset via app:
Open: http://localhost:3001/forgot-password
Email: nibthebib@gmail.com
Click: Send Reset Link

# 4. Check email and click link
# Should go to: http://localhost:3001/reset-password#access_token=...
```

---

## ✅ Quick Fix - Option 2: Disable AirPlay on Port 5000

### On macOS:

1. Open **System Settings**
2. Go to **General** → **AirDrop & Handoff**
3. Turn OFF **"AirPlay Receiver"**
4. Port 5000 will be freed up

Then restart your dev server:
```bash
npm run dev
```

---

## 🔧 Fix Environment Variables Not Loading

The server started but couldn't read `.env.local`. Here's why and how to fix:

### Manual Fix (Easiest):

```bash
# Copy env.local to .env.local manually:
cp env.local .env.local

# Then restart server:
npm run dev
```

### Or Update package.json:

Change the dev script from:
```json
"dev": "NODE_ENV=development tsx --env-file=.env.local server/index.ts"
```

To:
```json
"dev": "NODE_ENV=development tsx --env-file=env.local server/index.ts"
```

---

## 🎯 Recommended Steps Right Now:

1. **Add redirect URL for port 3001**:
   - Go to Supabase → URL Configuration
   - Add: `http://localhost:3001/reset-password`
   - Save

2. **Copy environment file**:
   ```bash
   cp env.local .env.local
   ```

3. **Kill current server and restart**:
   ```bash
   pkill -f "tsx.*server"
   npm run dev
   ```

4. **Test password reset**:
   - Go to: http://localhost:3001/forgot-password
   - Request reset for: nibthebib@gmail.com
   - Click link in email
   - Should work! ✅

---

## 📊 Current Status:

- ✅ Server running on port 3001
- ✅ API endpoints working
- ⚠️ Environment variables not loaded (need .env.local)
- ⚠️ Supabase redirect needs port 3001 URL
- ✅ Resend API key configured
- ✅ All code fixes applied

---

**Quick Action**: Copy `env.local` to `.env.local` and restart the server!

```bash
cp env.local .env.local
pkill -f "tsx.*server"
npm run dev
```

Then test at: **http://localhost:3001/reset-password**

