# Vercel Git Integration Troubleshooting

## Issue: Vercel Not Detecting GitHub Commits

If Vercel is not detecting new commits, follow these steps:

### 1. Verify Commits Are Pushed
```bash
git log origin/preview -5
git status
```
Ensure commits are pushed to GitHub.

### 2. Check Vercel Project Settings

**In Vercel Dashboard:**
1. Go to your project → Settings → Git
2. Verify the repository is connected: `niberman/FreedomAviation`
3. Check which branches are enabled for deployments
4. Verify the "Production Branch" is set correctly

### 3. Verify GitHub Webhook

**In GitHub:**
1. Go to: https://github.com/niberman/FreedomAviation/settings/hooks
2. Look for a Vercel webhook
3. Check recent deliveries - should show recent push events
4. If webhook is missing or failing:
   - Go to Vercel → Project Settings → Git
   - Click "Disconnect" then "Connect" again
   - This will recreate the webhook

### 4. Check Commit Author

Vercel requires the commit author to be:
- A member of the Vercel team, OR
- The repository owner, OR
- Someone with write access to the repo

Verify your Git config:
```bash
git config user.email
git config user.name
```

### 5. Manual Deployment Trigger

If automatic deployments aren't working:
1. Go to Vercel → Deployments
2. Click "..." on latest deployment
3. Select "Redeploy" or "Create Deployment"
4. Select the commit you want to deploy

### 6. Check Vercel Deployment Limits

- Free plan: 100 deployments/day
- Check if you've hit the limit in Vercel dashboard

### 7. Reconnect Git Integration

**Nuclear option (if nothing else works):**
1. Vercel → Project Settings → Git
2. Click "Disconnect Repository"
3. Click "Connect Git Repository"
4. Re-select your repository
5. Configure branch settings
6. This will recreate the webhook

### 8. Verify Branch Protection Rules

In GitHub:
1. Go to repository Settings → Branches
2. Check if branch protection rules are blocking webhooks
3. Ensure Vercel webhook has proper permissions

## Quick Fix Script

Run this to verify everything is set up correctly:
```bash
# Check if commits are pushed
git fetch origin
git log HEAD..origin/preview --oneline

# If empty, commits are pushed
# If not empty, push them:
git push origin preview

# Verify remote
git remote -v

# Check current branch
git branch --show-current
```

## Common Issues

1. **Webhook not firing**: Reconnect Git integration in Vercel
2. **Wrong branch**: Verify Vercel is watching the `preview` branch
3. **Commit author**: Ensure commits are by a team member
4. **Rate limiting**: Check if you've hit deployment limits
5. **Branch protection**: Ensure webhooks aren't blocked

## Next Steps

If the issue persists:
1. Check Vercel dashboard for error messages
2. Check GitHub webhook delivery logs
3. Contact Vercel support with:
   - Project name
   - Repository URL
   - Latest commit SHA
   - Screenshot of webhook delivery logs

