# Quick Fix: Missing .js Extensions

## 🎯 Root Cause Found!

The 500 errors for `/api/service-requests`, `/staff`, and `/demo` were ALL caused by:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/lib/email'
```

**Problem:** ES modules in Node.js require `.js` extensions in import statements.

## ✅ Files Fixed

1. `server/lib/service-request-email.ts`
   - Changed `from './email'` → `from './email.js'` (2 places)

2. `server/lib/google-calendar.ts`
   - Changed `from './supabase'` → `from './supabase.js'`

3. `server/lib/email.test.ts`
   - Changed `from './email'` → `from './email.js'`

## 🚀 Deploy NOW

```bash
git add server/lib/
git commit -m "Fix: Add .js extensions to ES module imports"
git push origin preview
```

## 📊 What This Fixes

After deployment, these should all work:
- ✅ `/api/service-requests` - will load service requests
- ✅ `/staff` - staff dashboard will load
- ✅ `/demo` - demo mode will work
- ✅ Google Calendar integration - will work properly

## ⏰ Expected Timeline

1. **Git push** - triggers Vercel deployment (~2-3 minutes)
2. **Wait for build** - check Vercel dashboard
3. **Test** - hard refresh browser (Cmd+Shift+R)
4. **Verify** - no more 500 errors in console

## 🔍 How to Verify It Worked

After deployment:

1. **Go to:** https://freedom-aviation.vercel.app
2. **Log in** as founder
3. **Check browser console:**
   - Should NOT see "Cannot find module '/var/task/server/lib/email'"
   - Should NOT see 500 errors for /api/service-requests
   - Should see "Service requests fetched successfully" in Vercel logs

4. **Check staff dashboard:**
   - Should load without errors
   - Service requests section should show (even if empty)
   - Clients section should show (even if empty)

## 🎉 Issues This Resolves

- ✅ Service requests 500 error
- ✅ Staff dashboard 500 error  
- ✅ Demo endpoint 500 error
- ✅ Google Calendar integration
- ✅ All routes that use email notifications

## ⏳ Remaining Issue

**manifest.webmanifest 401** - This is a separate issue:
- Not related to the module imports
- Likely a Vercel build/deployment configuration
- Low priority (doesn't break core functionality)
- Can investigate after verifying the main fix works

## 🆘 If Still Getting Errors

If you still see 500 errors after deployment:

1. **Check Vercel deployment status:**
   - Go to https://vercel.com/dashboard
   - Make sure deployment succeeded
   - Check for any build errors

2. **Hard refresh browser:**
   - Mac: Cmd + Shift + R
   - Windows: Ctrl + Shift + R
   - This clears cached JavaScript

3. **Check Vercel logs:**
   ```bash
   vercel logs freedom-aviation --follow
   ```
   - Look for new errors
   - Should NOT see "Cannot find module" anymore

4. **Verify the change deployed:**
   - Check Vercel deployment's file contents
   - Look for `server/lib/service-request-email.js`
   - Should have `from './email.js'` not `from './email'`

## 💡 Why This Happened

When using ES modules (`"type": "module"` in package.json or `.mjs` files), Node.js requires:
- ✅ `import { x } from './file.js'` - CORRECT
- ❌ `import { x } from './file'` - ERROR in production

TypeScript allows omitting extensions during development, but they're required at runtime in Node.js ES modules.

## 🎯 Action Required

**Deploy the changes NOW:**

```bash
git add .
git commit -m "Fix: Add .js extensions to ES module imports (fixes 500 errors)"
git push origin preview
```

Then wait 2-3 minutes for Vercel to deploy and test!

