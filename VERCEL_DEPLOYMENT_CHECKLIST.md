# Vercel Deployment Checklist - Preview Branch
**Date**: November 20, 2025  
**Branch**: preview  
**Status**: Ready to deploy

---

## 🚀 Deploy Preview Branch to Vercel

### Step 1: Push Preview Branch (Already Done ✅)

Your preview branch is already pushed to GitHub with all schema fixes.

---

### Step 2: Deploy to Vercel

**Option A: Automatic Deployment (if enabled)**
- Vercel auto-deploys when you push to preview branch
- Check: https://vercel.com/niberman/freedom-aviation/deployments

**Option B: Manual Deployment**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy preview branch
vercel --prod
```

---

### Step 3: Set Environment Variables in Vercel

**CRITICAL**: The production site needs these environment variables!

Go to: https://vercel.com/niberman/freedom-aviation/settings/environment-variables

**Add these variables**:

```bash
# Supabase - Client Side (VITE_ prefix for build time)
VITE_SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI

# Supabase - Server Side (NO prefix for runtime)
SUPABASE_URL=https://wsepwuxkwjnsgmkddkjw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc4ODk4NSwiZXhwIjoyMDc1MzY0OTg1fQ.lItDlHwaa4Kc1aXw9ScZY7zmf5njL_jNZMeucbF7568

# Email (Resend)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_Z3Xdz4Q5_NP4hM4HvhFNbunCre7WR6uA2
EMAIL_FROM=Freedom Aviation <info@freedomaviationco.com>

# Stripe
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Site Configuration
SITE_URL=https://www.freedomaviationco.com
FRONTEND_URL=https://www.freedomaviationco.com
```

**Important**: Each variable should be added separately in Vercel dashboard!

---

### Step 4: Verify Deployment

After deployment completes:

1. **Check deployment logs**:
   - Go to Vercel dashboard
   - Click on latest deployment
   - Check build logs for errors

2. **Test the site**:
   ```
   https://freedom-aviation.vercel.app
   # or
   https://www.freedomaviationco.com
   ```

3. **Check browser console**:
   - Should NOT see "No owners found" spam
   - Should NOT see "Unexpected token '<'" errors
   - Should see data loading properly

---

### Step 5: Test API Endpoints

```bash
# Test from command line
curl https://freedom-aviation.vercel.app/api/test

# Should return:
# {"message":"API routes are working!","timestamp":"..."}
```

---

## 🔧 Troubleshooting Production Errors

### Error: "No owners found in database" (infinite loop)

**Cause**: API endpoint returning HTML instead of JSON

**Fix**:
1. Verify environment variables are set in Vercel
2. Check API endpoint works: `/api/clients`
3. Restart deployment if needed

### Error: "Unexpected token '<', '<!DOCTYPE'..."

**Cause**: API route not found, returning 404 HTML page

**Fix**:
1. Verify `vercel.json` routes configuration
2. Check serverless functions are deployed
3. Verify `api/` directory structure

### Error: "SUPABASE_URL missing"

**Cause**: Environment variables not set or wrong prefix

**Fix**:
1. Add BOTH `VITE_SUPABASE_URL` and `SUPABASE_URL`
2. Same for `SUPABASE_ANON_KEY`
3. Redeploy after adding variables

---

## 📊 What to Check After Deployment

- [ ] Build succeeds without errors
- [ ] All environment variables are set
- [ ] API endpoints return JSON (not HTML)
- [ ] No infinite retry loops
- [ ] Users can log in
- [ ] Staff can view dashboard
- [ ] No "No owners found" spam in console
- [ ] Service requests load properly
- [ ] Aircraft data loads

---

## 🎯 Quick Deployment Steps

1. **Ensure preview branch is current**:
   ```bash
   git status
   # Should show: On branch preview, up to date with origin/preview
   ```

2. **Trigger deployment**:
   - Push triggers auto-deploy (if enabled)
   - OR manually deploy via Vercel dashboard
   - OR use `vercel --prod`

3. **Add environment variables** in Vercel dashboard

4. **Wait for build** (~2-3 minutes)

5. **Test deployment**

---

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/niberman/freedom-aviation
- **Deployments**: https://vercel.com/niberman/freedom-aviation/deployments
- **Environment Variables**: https://vercel.com/niberman/freedom-aviation/settings/environment-variables
- **Build Logs**: Check latest deployment

---

## ⚡ Fast Track

If you want to deploy RIGHT NOW:

1. Go to: https://vercel.com/niberman/freedom-aviation
2. Click: **"Deploy"** button
3. Select branch: **preview**
4. Click: **"Deploy"**
5. Add environment variables while it builds
6. Wait for deployment
7. Test the site

---

**Next**: Deploy preview branch to Vercel and set environment variables!

