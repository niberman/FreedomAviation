# Fix Vercel Production Deployment - Complete Guide
**Issue**: API returning HTML instead of JSON  
**Status**: NEEDS CONFIGURATION

---

## 🎯 The Problem

Your Vercel deployment has **Deployment Protection** enabled, causing:
- All API calls return 401 Authentication Required (HTML)
- JavaScript tries to parse HTML as JSON → Error
- React Query retries infinitely → Console spam
- No data loads on the site

---

## ✅ STEP 1: Disable Deployment Protection

**Go to**: https://vercel.com/niberman/freedom-aviation/settings/deployment-protection

**Current**: Likely "Standard Protection" or "Protection for All Deployments"  
**Change to**: **"Disabled"** (or "Only Preview Deployments")

**Click**: Save

This will stop the 401 errors immediately.

---

## ✅ STEP 2: Add Environment Variables

**Go to**: https://vercel.com/niberman/freedom-aviation/settings/environment-variables

**Add each variable below** (click "Add" button for each):

### Supabase - Client Side (Build Time)

```
Name: VITE_SUPABASE_URL
Value: https://wsepwuxkwjnsgmkddkjw.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI
Environments: ✓ Production ✓ Preview ✓ Development
```

### Supabase - Server Side (Runtime)

```
Name: SUPABASE_URL
Value: https://wsepwuxkwjnsgmkddkjw.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: (check your .env.local file - the service_role key)
Environments: ✓ Production ✓ Preview ✓ Development
```

### Email (Resend)

```
Name: EMAIL_SERVICE
Value: resend
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: RESEND_API_KEY
Value: (check your .env.local file)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: EMAIL_FROM
Value: Freedom Aviation <info@freedomaviationco.com>
Environments: ✓ Production ✓ Preview ✓ Development
```

### Stripe

```
Name: STRIPE_SECRET_KEY
Value: (check your .env.local file)
Environments: ✓ Production ✓ Preview ✓ Development
```

---

## ✅ STEP 3: Redeploy

**Go to**: https://vercel.com/niberman/freedom-aviation/deployments

**Click**: "..." menu on latest deployment → **"Redeploy"**

**OR**

**Go to**: https://vercel.com/niberman/freedom-aviation

**Click**: **"Deploy"** button → Select **"preview"** branch

---

## ✅ STEP 4: Verify Deployment

Once redeployed:

**Test API**:
```
https://freedom-aviation.vercel.app/api/test
```

Should return:
```json
{"message":"API routes are working!","timestamp":"2025-11-20T..."}
```

**NOT**:
```html
<!DOCTYPE html>...Authentication Required...
```

---

## ✅ STEP 5: Test the Site

1. **Clear browser cache** (Cmd+Shift+R on Mac)
2. **Open**: https://freedom-aviation.vercel.app
3. **Check console**: Should NOT see infinite errors
4. **Log in**: noah@freedomaviationco.com
5. **Test staff dashboard**: Should load data

---

## 🎯 Summary - Do These 3 Things:

1. **Disable deployment protection**: https://vercel.com/niberman/freedom-aviation/settings/deployment-protection
2. **Add environment variables**: https://vercel.com/niberman/freedom-aviation/settings/environment-variables
3. **Redeploy**: https://vercel.com/niberman/freedom-aviation/deployments

---

**After this, your production site will work!** 🚀

