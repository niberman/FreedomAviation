#!/bin/bash
# Setup environment files
cd "$(dirname "$0")/.."

if [ -f "env.local" ] && [ ! -f ".env.local" ]; then
    echo "📋 Copying env.local → .env.local..."
    cp env.local .env.local
    echo "✅ .env.local created"
elif [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
else
    echo "❌ env.local not found"
    exit 1
fi

