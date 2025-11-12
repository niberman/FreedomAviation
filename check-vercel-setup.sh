#!/bin/bash
# Quick script to verify Git setup for Vercel

echo "🔍 Checking Git setup for Vercel..."
echo ""

echo "📋 Current branch:"
git branch --show-current
echo ""

echo "📋 Remote repository:"
git remote -v
echo ""

echo "📋 Recent commits (last 5):"
git log --oneline -5
echo ""

echo "📋 Commits on remote preview branch:"
git fetch origin preview 2>/dev/null
git log origin/preview --oneline -5
echo ""

echo "📋 Commits not pushed (should be empty):"
UNPUSHED=$(git log origin/preview..HEAD --oneline)
if [ -z "$UNPUSHED" ]; then
  echo "✅ All commits are pushed to GitHub"
else
  echo "⚠️  Unpushed commits:"
  echo "$UNPUSHED"
  echo "Run: git push origin preview"
fi
echo ""

echo "📋 Git user configuration:"
echo "  Name: $(git config user.name)"
echo "  Email: $(git config user.email)"
echo ""

echo "✅ If all commits are pushed but Vercel isn't detecting them:"
echo "   1. Go to Vercel Dashboard → Project Settings → Git"
echo "   2. Click 'Disconnect Repository'"
echo "   3. Click 'Connect Git Repository'"
echo "   4. Re-select your repository"
echo "   5. This will recreate the webhook"
echo ""

echo "📝 Check GitHub webhook:"
echo "   https://github.com/niberman/FreedomAviation/settings/hooks"
echo ""

