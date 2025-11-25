#!/bin/bash
# Development server startup script that handles missing .env.local gracefully

# Check if .env.local exists and load it
if [ -f ".env.local" ]; then
  echo "📄 Loading environment from .env.local"
  # Use a safer way to load env vars
  set -a
  source .env.local 2>/dev/null || true
  set +a
else
  echo "⚠️  .env.local not found - starting with system environment only"
  echo "📝 To enable full functionality:"
  echo "   1. Copy .env.local.example to .env.local"
  echo "   2. Add your credentials"
  echo "   3. Restart the server"
  echo ""
fi

# Start the server
NODE_ENV=development tsx server/index.ts

