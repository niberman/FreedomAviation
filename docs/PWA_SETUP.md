# Progressive Web App (PWA) Setup

This document describes the complete PWA implementation for the Freedom Aviation application.

## Overview

The app now includes full Progressive Web App support with:
- ✅ Offline functionality
- ✅ Installable on mobile and desktop
- ✅ Auto-update notifications
- ✅ Background sync and caching
- ✅ Lighthouse PWA compliant

## Architecture

### Core Components

#### 1. vite-plugin-pwa Configuration (`vite.config.ts`)

The PWA is configured using `vite-plugin-pwa` with the following features:

**Manifest Configuration:**
- App name: "Freedom Aviation"
- Theme colors: Black (#000000) theme, white background
- Display mode: Standalone (full-screen app experience)
- Icons: Multiple sizes for all devices
- Shortcuts: Quick access to dashboard and service requests
- Categories: Business, travel, utilities

**Workbox Caching Strategies:**

1. **CacheFirst** for:
   - Google Fonts (1 year cache)
   - Static fonts from gstatic (1 year cache)
   - Supabase storage images (30 days cache)

2. **NetworkFirst** for:
   - API calls (`/api/*`)
   - 10-second network timeout
   - 5-minute cache fallback
   - Ensures fresh data with offline fallback

**Service Worker Options:**
- `skipWaiting: true` - Activates new SW immediately
- `clientsClaim: true` - Takes control of all clients immediately
- `cleanupOutdatedCaches: true` - Removes old caches automatically
- `registerType: "autoUpdate"` - Checks for updates automatically

#### 2. Service Worker Registration (`client/src/hooks/usePWA.ts`)

Custom React hook that manages PWA lifecycle:

```typescript
const { needRefresh, offlineReady, updateServiceWorker } = usePWA();
```

Features:
- Detects when updates are available
- Shows offline-ready notification
- Automatic update checks every hour
- Error handling and logging

#### 3. UI Components (`client/src/components/PWAUpdatePrompt.tsx`)

**PWAUpdatePrompt Component:**
- Shows when app updates are available
- Displays offline-ready notification
- Allows users to manually trigger updates
- Dismissible interface

**OnlineStatus Component:**
- Monitors network connectivity
- Shows notifications when going online/offline
- Auto-dismisses after 3 seconds when back online
- Persistent when offline

#### 4. App Integration (`client/src/App.tsx`)

The PWA components are integrated at the app root level:
- Renders across all routes
- Positioned with fixed positioning (z-index: 50)
- Non-intrusive UI in bottom-right corner

## Files Modified/Created

### Modified Files:
1. `/vite.config.ts` - Added VitePWA plugin configuration
2. `/client/src/main.tsx` - Simplified (PWA logic moved to hook)
3. `/client/src/App.tsx` - Integrated PWA components
4. `/client/public/manifest.webmanifest` - Enhanced with full PWA metadata
5. `/client/public/sw.js` - Updated with build-time generation note

### Created Files:
1. `/client/src/hooks/usePWA.ts` - PWA state management hook
2. `/client/src/components/PWAUpdatePrompt.tsx` - Update UI components
3. `/client/src/pwa-register.d.ts` - TypeScript definitions for PWA virtual modules

### Icons Structure:
```
/client/public/
├── favicon.png (32x32)
├── apple-touch-icon.png (180x180)
└── icons/
    ├── icon-192.png (192x192) - Required for PWA
    └── icon-512.png (512x512) - Required for PWA
```

## Icon Requirements

### Current Icons
The app includes all required icons for PWA compliance:

| Icon | Size | Purpose | Status |
|------|------|---------|--------|
| favicon.png | 32x32 | Browser tab | ✅ Present |
| apple-touch-icon.png | 180x180 | iOS home screen | ✅ Present |
| icon-192.png | 192x192 | Android home screen | ✅ Present |
| icon-512.png | 512x512 | Splash screen | ✅ Present |

### Generating Additional Icons (Optional)

If you need to regenerate icons from a source image:

```bash
# Using ImageMagick
convert source-logo.png -resize 192x192 client/public/icons/icon-192.png
convert source-logo.png -resize 512x512 client/public/icons/icon-512.png
convert source-logo.png -resize 180x180 client/public/apple-touch-icon.png
convert source-logo.png -resize 32x32 client/public/favicon.png

# Or use online tools:
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator
```

## Manifest Configuration

The manifest (`client/public/manifest.webmanifest`) includes:

### Basic Information
- **name**: "Freedom Aviation"
- **short_name**: "Freedom Aviation"
- **description**: Full marketing description with keywords
- **theme_color**: #000000 (black - matches branding)
- **background_color**: #ffffff (white - clean launch screen)

### Display Options
- **display**: standalone (no browser chrome)
- **orientation**: portrait-primary (mobile-optimized)
- **scope**: / (entire app)
- **start_url**: / (homepage)

### Categories
- business
- travel
- utilities

### Shortcuts (Quick Actions)
1. **Dashboard** - Direct access to user dashboard
2. **New Service Request** - Quick service request creation

### Share Target
Allows sharing content to the app via OS share menu:
- Accepts title, text, and URL
- Posts to `/share` endpoint

## Build & Deployment

### Development
```bash
npm run dev
```
- Service worker is disabled in development
- Use Chrome DevTools > Application > Service Workers to debug

### Production Build
```bash
npm run build
```

The build process:
1. Generates optimized service worker with Workbox
2. Creates manifest.json from vite.config.ts
3. Precaches all static assets
4. Outputs to `dist/public/`

Generated files in production:
- `/sw.js` - Service worker with Workbox runtime
- `/manifest.webmanifest` - App manifest
- `/workbox-*.js` - Workbox runtime libraries

### Testing PWA Locally

```bash
npm run build
npm start
```

Then:
1. Open Chrome/Edge
2. Navigate to `http://localhost:5000` (or your server port)
3. Open DevTools > Application > Manifest
4. Click "Update on reload"
5. Test installation, offline mode, updates

## Lighthouse PWA Audit

To verify PWA compliance:

1. Build and serve the production app
2. Open Chrome DevTools > Lighthouse
3. Select "Progressive Web App" category
4. Run audit

### Expected Results:
- ✅ Installable
- ✅ PWA optimized
- ✅ Works offline
- ✅ Configured for a custom splash screen
- ✅ Sets a theme color
- ✅ Content sized correctly for viewport
- ✅ Has a viewport meta tag
- ✅ Provides a valid apple-touch-icon

### Common Issues & Fixes:

**Issue: "Does not work offline"**
- Check that service worker is registered
- Verify network caching strategies in vite.config.ts
- Check browser console for SW errors

**Issue: "Not installable"**
- Verify all required icons are present
- Check manifest.json is served correctly
- Ensure HTTPS in production (required for PWA)

**Issue: "Update not showing"**
- Clear browser cache
- Unregister old service worker: DevTools > Application > Service Workers > Unregister
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

## Caching Strategy Details

### Static Assets (Precached)
All built files are automatically precached:
- JavaScript bundles
- CSS stylesheets
- HTML files
- Icons and images
- Font files

### Runtime Caching

#### Google Fonts (CacheFirst)
```javascript
{
  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  handler: "CacheFirst",
  expiration: { maxAgeSeconds: 365 days }
}
```

#### API Calls (NetworkFirst)
```javascript
{
  urlPattern: /\/api\/.*/i,
  handler: "NetworkFirst",
  networkTimeout: 10 seconds,
  expiration: { maxAgeSeconds: 5 minutes }
}
```

Benefits:
- Fresh data when online
- Cached fallback when offline
- 10-second timeout prevents long waits
- Only caches successful responses (status 200)

#### Supabase Storage (CacheFirst)
```javascript
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
  handler: "CacheFirst",
  expiration: { maxAgeSeconds: 30 days }
}
```

## Update Strategy

### Automatic Updates
1. Service worker checks for updates every hour
2. When new version detected, `needRefresh` becomes true
3. PWAUpdatePrompt component appears
4. User clicks "Update Now"
5. Page reloads with new version

### Manual Update Check
Users can manually check for updates:
```typescript
// In a component
const { updateServiceWorker } = usePWA();

// Trigger update
await updateServiceWorker(true); // true = reload page
```

### Skip Waiting
The service worker is configured with `skipWaiting: true`:
- New SW activates immediately after install
- No waiting for old SW to close
- Users get updates faster
- May cause version conflicts (handled by reloading)

## Browser Support

### Full Support
- ✅ Chrome/Edge 90+
- ✅ Safari 15+ (iOS 15+)
- ✅ Firefox 90+
- ✅ Samsung Internet 15+

### Partial Support
- ⚠️ Safari 11.1-14 (basic PWA, limited features)
- ⚠️ Chrome/Edge 80-89 (older Workbox version)

### No Support
- ❌ IE 11 (service workers not supported)
- ❌ Safari 11.0 and below

## Security Considerations

### HTTPS Required
PWAs require HTTPS in production:
- Service workers only work on HTTPS
- Exception: localhost for development
- Use Vercel/Netlify for automatic HTTPS

### Content Security Policy
If using CSP headers, allow:
```
script-src 'self' 'unsafe-inline';
worker-src 'self' blob:;
```

### Permissions
PWA requests minimal permissions:
- Notification (optional, for updates)
- No camera, location, or other sensitive permissions

## Monitoring & Analytics

### Service Worker Lifecycle Events

Monitor in production:
```typescript
// In usePWA.ts hook
onRegistered(registration) {
  console.log("SW registered", registration);
  // Send to analytics
}

onRegisterError(error) {
  console.error("SW error", error);
  // Send to error tracking (Sentry, etc.)
}
```

### Cache Performance

Check cache hit rates:
```javascript
// In browser console
caches.keys().then(keys => console.log(keys));
caches.open('cache-name').then(cache => cache.keys());
```

## Troubleshooting

### Clear Everything
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
location.reload();
```

### Check Service Worker Status
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered SWs:', registrations.length);
  registrations.forEach(reg => {
    console.log('SW:', reg.active?.scriptURL);
    console.log('State:', reg.active?.state);
  });
});
```

## Future Enhancements

Potential improvements:
- [ ] Background sync for offline service requests
- [ ] Push notifications for updates/alerts
- [ ] Periodic background sync for data updates
- [ ] Advanced offline page with cached data
- [ ] Share target implementation
- [ ] Badging API for unread counts
- [ ] Web app install prompts

## References

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA Checklist](https://web.dev/pwa-checklist/)


