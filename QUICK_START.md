# Quick Start Guide

## Running the Development Server

Just run:
```bash
npm run dev
```

That's it! The server will:
- ✅ Automatically find an available port (5000-5009)
- ✅ Work without API keys or .env.local file
- ✅ Show helpful warnings for missing configuration
- ✅ Start immediately without blocking errors

## What You'll See

```
📄 Loading environment from .env.local
🔍 Supabase environment variables check:
  - SUPABASE_URL: ⚠️  Missing (optional for development)
  ...
⚠️  WARNING: Supabase credentials not fully configured!
   This is OK for development, but some features will be disabled
   Server will continue starting with limited functionality...

7:23:51 PM [express] Attempting to start server on port 5000...
7:23:51 PM [express] ⚠️  Port 5000 is already in use, trying next port...
7:23:51 PM [express] Attempting to start server on port 5001...
7:23:51 PM [express] ✓ Server successfully listening on port 5001
7:23:51 PM [express] ✓ Environment: development
7:23:51 PM [express] ✓ Ready to accept connections
```

## Testing

Once the server is running, test it:
```bash
# Replace 5001 with whatever port the server chose
curl http://localhost:5001/api/test
```

Expected response:
```json
{"message":"API routes are working!","timestamp":"2025-11-25T02:24:21.721Z"}
```

## Optional: Enable Full Features

To enable database, authentication, and payment features:

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   - Supabase URL and keys
   - Stripe API keys
   - Other service credentials

3. Restart the server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### All ports are in use
If you see "Could not start server on any port between 5000 and 5009":
```bash
# Find and kill processes using these ports
lsof -ti:5000,5001,5002,5003,5004,5005,5006,5007,5008,5009 | xargs kill -9
```

### Permission errors
If you see permission errors with .env files:
```bash
# Remove problematic files
rm -f client/.env
```

### Server won't start
Check the terminal output in:
```bash
cat ~/.cursor/projects/Users-noah-FreedomAviation-FreedomAviation-1/terminals/*.txt
```

## Benefits

- 🚀 **Zero Setup**: Start coding immediately
- 🔧 **Auto-Recovery**: Handles port conflicts automatically
- 📝 **Clear Feedback**: Know exactly what's missing and why
- 🛡️ **Safe**: All production checks remain intact
- 💡 **Developer Friendly**: Helpful messages guide you through setup

