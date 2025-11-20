# iOS Quick Start Guide

Quick reference for building and running the FreedomAviation iOS app.

## Prerequisites

- macOS with Xcode installed
- CocoaPods installed: `sudo gem install cocoapods`
- Node.js and npm installed

## First Time Setup

1. **Install CocoaPods dependencies**:
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

## Daily Development Workflow

### 1. Make changes to the web app

Edit files in `client/src/`

### 2. Build and sync to iOS

```bash
npm run cap:sync:ios
```

This command:
- Builds the web app (`npm run build`)
- Copies web assets to `ios/App/App/public/`
- Syncs Capacitor plugins

### 3. Open in Xcode

```bash
npm run cap:open:ios
```

⚠️ **Important**: Always open `App.xcworkspace`, NOT `App.xcodeproj`

### 4. Run in Simulator

1. Select a simulator (e.g., iPhone 15 Pro)
2. Click Run (▶️) or press `Cmd+R`

### 5. Run on Real Device

1. Connect iPhone via USB
2. Select device in Xcode
3. Trust the computer on your device
4. Click Run (▶️)

## Common Commands

```bash
# Full rebuild and open
npm run cap:run:ios

# Just sync (after code changes)
npm run cap:sync:ios

# Just open Xcode
npm run cap:open:ios

# Build web app only
npm run build
```

## Troubleshooting

### Build Fails

```bash
cd ios/App
pod deintegrate
pod install
```

### Changes Not Appearing

```bash
npm run build
npx cap sync ios
```

Then rebuild in Xcode (Product → Clean Build Folder, then Run).

### Xcode Signing Issues

1. Open Xcode → Preferences → Accounts
2. Add your Apple ID
3. Select the App target → Signing & Capabilities
4. Choose your Team

### CocoaPods Issues

```bash
sudo gem update cocoapods
cd ios/App
pod repo update
pod install
```

## App Configuration

- **App Name**: FreedomAviation
- **Bundle ID**: com.freedomaviation.app
- **URL Scheme**: freedomaviation://

## File Locations

- Xcode project: `ios/App/App.xcworkspace`
- App icons: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Splash screen: `ios/App/App/Assets.xcassets/Splash.imageset/`
- Info.plist: `ios/App/App/Info.plist`
- Web assets: `ios/App/App/public/` (auto-generated)

## Detailed Documentation

For comprehensive iOS setup, deployment, and App Store submission:

👉 **[Full iOS Setup Guide](docs/IOS_SETUP.md)**

## Support

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Xcode Help](https://developer.apple.com/documentation/xcode)
- Project Issues: Contact development team

