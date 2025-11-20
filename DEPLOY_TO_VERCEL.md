# Deploy Preview Branch to Vercel - Quick Guide
**Branch**: preview  
**Target**: freedom-aviation.vercel.app  
**Status**: Ready to deploy

---

## ⚡ Fastest Method: GitHub Integration

Vercel likely auto-deploys when you push. Check:

1. **Go to**: https://vercel.com/niberman/freedom-aviation/deployments
2. **Look for**: "preview" branch deployment
3. **If building**: Wait for it to complete
4. **If not building**: Click "Deploy" → Select "preview" branch

---

## 🔧 Method 2: Vercel CLI

```bash
# Install Vercel CLI (if needed)
npm i -g vercel

# Login
vercel login

# Link project (first time only)
vercel link

# Deploy preview branch
vercel --prod
```

---

## ⚙️ CRITICAL: Set Environment Variables First!

**Go to**: https://vercel.com/niberman/freedom-aviation/settings/environment-variables

**Add each of these** (click "Add" for each):

### Supabase (Client - Build Time)
```
Name: VITE_SUPABASE_URL
Value: https://wsepwuxkwjnsgmkddkjw.supabase.co
Environment: Production, Preview, Development
```

```
Name: VITE_SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI
Environment: Production, Preview, Development
```

### Supabase (Server - Runtime)
```
Name: SUPABASE_URL
Value: https://wsepwuxkwjnsgmkddkjw.supabase.co
Environment: Production, Preview, Development
```

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODg5ODUsImV4cCI6MjA3NTM2NDk4NX0.B4KktUFp_WLh55A5ZEP64NApI_ZttDZLA1IqP5FK9BI
Environment: Production, Preview, Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZXB3dXhrd2puc2dta2Rka2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc4ODk4NSwiZXhwIjoyMDc1MzY0OTg1fQ.lItDlHwaa4Kc1aXw9ScZY7zmf5njL_jNZMeucbF7568
Environment: Production, Preview, Development
```

### Email
```
Name: EMAIL_SERVICE
Value: resend
Environment: Production, Preview, Development
```

```
Name: RESEND_API_KEY
Value: re_Z3Xdz4Q5_NP4hM4HvhFNbunCre7WR6uA2
Environment: Production, Preview, Development  
```

```
Name: EMAIL_FROM
Value: Freedom Aviation <info@freedomaviationco.com>
Environment: Production, Preview, Development
```

### Stripe
```
Name: STRIPE_SECRET_KEY
Value: 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
Environment: Production, Preview, Development
```

---

## 🎯 After Deployment

1. **Clear browser cache** (important!)
2. **Open in incognito** for clean test
3. **Visit**: https://freedom-aviation.vercel.app
4. **Check console**: Should NOT see errors
5. **Test login**: noah@freedomaviationco.com
6. **Test staff dashboard**: Should load without errors

---

## 🐛 If Still Seeing Errors

The infinite loop is caused by React Query retrying failed API calls. To fix:

1. **Ensure environment variables are set** (most common issue)
2. **Redeploy** after adding variables
3. **Check build logs** for errors
4. **Test API endpoint directly**:
   ```
   https://freedom-aviation.vercel.app/api/test
   ```

---

## ✅ Success Criteria

After successful deployment:

- ✅ No build errors
- ✅ API returns JSON (not HTML)
- ✅ No infinite retry loops
- ✅ Staff dashboard loads
- ✅ Can fetch owners and aircraft
- ✅ Password reset works
- ✅ All schema fixes deployed

---

**Ready to deploy!** The preview branch has all fixes and is waiting in GitHub.

