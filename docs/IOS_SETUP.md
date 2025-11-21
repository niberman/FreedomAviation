# iOS App Setup Guide

This guide will walk you through setting up, building, and deploying the FreedomAviation iOS app using Capacitor.

## Prerequisites

Before you begin, ensure you have:

1. **macOS** - iOS development requires a Mac
2. **Xcode** - Download from the Mac App Store (minimum version 14.0)
3. **Xcode Command Line Tools** - Install via:
   ```bash
   xcode-select --install
   ```
4. **CocoaPods** - Install via:
   ```bash
   sudo gem install cocoapods
   ```
5. **Node.js** and **npm** - Already installed if you're running the web app
6. **Apple Developer Account** - Free for development, $99/year for App Store distribution

## Initial Setup (Already Completed)

The following setup steps have already been completed:

1. ✅ Installed Capacitor dependencies
2. ✅ Created `capacitor.config.ts`
3. ✅ Added iOS platform
4. ✅ Configured Info.plist with permissions
5. ✅ Added OAuth URL schemes

## Project Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift       # iOS app entry point
│   │   ├── Info.plist              # App configuration & permissions
│   │   ├── Assets.xcassets/        # App icons and images
│   │   └── public/                 # Web assets (copied from dist/)
│   ├── App.xcodeproj/              # Xcode project
│   └── Podfile                     # CocoaPods dependencies
└── capacitor-cordova-ios-plugins/  # Capacitor plugin sources
```

## Development Workflow

### 1. Install CocoaPods Dependencies

First time setup or after adding new Capacitor plugins:

```bash
cd ios/App
pod install
```

⚠️ **Important**: Always open `App.xcworkspace`, NOT `App.xcodeproj`

### 2. Build the Web App

```bash
npm run build
```

### 3. Sync Web Assets to iOS

```bash
npx cap sync ios
```

Or use the combined script:

```bash
npm run cap:sync:ios
```

### 4. Open in Xcode

```bash
npm run cap:open:ios
```

Or manually:

```bash
npx cap open ios
```

### 5. Configure Signing & Capabilities

In Xcode:

1. Select the **App** target
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer Account)
4. Xcode will automatically create a provisioning profile

#### Common Signing Issues & Solutions

**Error: "Failed to create provisioning profile"**
- Solution: Ensure you're logged into Xcode with your Apple ID (Preferences → Accounts)
- Change the Bundle Identifier if needed (e.g., `com.yourcompany.freedomaviation`)

**Error: "No profiles for 'com.freedomaviation.app' were found"**
- Solution: Let Xcode automatically manage signing, or manually create one in the Apple Developer Portal

**Error: "Signing requires a development team"**
- Solution: Add your Apple ID in Xcode Preferences → Accounts

### 6. Run on Simulator

1. Select a simulator from the device dropdown (e.g., iPhone 15 Pro)
2. Click the **Run** button (▶️) or press `Cmd+R`

### 7. Run on Physical Device

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. Select your device from the device dropdown
4. Click **Run**
5. On your device: Settings → General → VPN & Device Management → Trust Developer App

## Building for Production

### 1. Update Version & Build Numbers

In Xcode, select the **App** target and update:
- **Version**: Semantic version (e.g., 1.0.0)
- **Build**: Increment for each submission (e.g., 1, 2, 3...)

### 2. Configure for Production

1. **Build Configuration**: Set to **Release**
2. **Deployment Target**: Set minimum iOS version (recommended: iOS 14.0+)
3. **App Icons**: Ensure all icon sizes are present in Assets.xcassets

### 3. Create Archive

1. Select **Any iOS Device** as the run destination
2. Product → Archive
3. Wait for the archive to complete

### 4. Submit to App Store

1. In the Archives window, click **Distribute App**
2. Choose **App Store Connect**
3. Follow the wizard to upload
4. Complete the App Store listing in [App Store Connect](https://appstoreconnect.apple.com)

## App Configuration

### App Icons

Replace the default icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

Required sizes:
- 20x20 (2x, 3x)
- 29x29 (2x, 3x)
- 40x40 (2x, 3x)
- 60x60 (2x, 3x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x) - iPad Pro
- 1024x1024 - App Store

Use a tool like [appicon.co](https://appicon.co) to generate all sizes from a 1024x1024 master.

### Splash Screen

The splash screen is configured in:
- `ios/App/App/Assets.xcassets/Splash.imageset/`
- Default: 2732x2732 PNG with centered logo
- Customize by replacing the splash images

### App Name & Bundle Identifier

To change the app name or bundle ID:

1. Open `capacitor.config.ts`
2. Update `appId` and `appName`
3. Run `npm run cap:sync:ios`
4. In Xcode, update the Bundle Identifier if needed

### Permissions

The following permissions are already configured in `Info.plist`:

- **Camera**: For uploading aircraft photos
- **Photo Library**: For selecting photos
- **User Tracking**: For analytics (optional)

To add more permissions, edit `ios/App/App/Info.plist`.

### URL Schemes for OAuth

The app is configured to handle OAuth redirects:

- **Scheme**: `freedomaviation://`
- **URL Types**: Configured in Info.plist
- **Use case**: Google OAuth, Supabase auth callbacks

## Troubleshooting

### Build Fails with "Module not found"

```bash
cd ios/App
pod deintegrate
pod install
```

### Web Changes Not Reflecting

```bash
npm run build
npx cap sync ios
```

Then rebuild in Xcode.

### "xcodebuild: command not found"

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

### CocoaPods Issues

Update CocoaPods:

```bash
sudo gem update cocoapods
pod repo update
```

### Simulator Not Available

Run Xcode's first launch to download simulators:

```bash
xcodebuild -runFirstLaunch
```

Or download via Xcode → Preferences → Components → Simulators

### App Crashes on Launch

1. Check Xcode console for errors
2. Verify all web assets are built: `npm run build`
3. Sync again: `npx cap sync ios`
4. Clean build folder: Product → Clean Build Folder

## Testing on iOS

### Browser Developer Tools

Safari Web Inspector works with Capacitor apps:

1. Enable on Mac: Safari → Preferences → Advanced → Show Develop menu
2. Enable on Device: Settings → Safari → Advanced → Web Inspector
3. In Safari: Develop → [Your Device] → FreedomAviation

### Console Logs

Use native iOS logging in TypeScript:

```typescript
console.log('This appears in Xcode console');
```

View in Xcode: View → Debug Area → Show Debug Area

## Differences from Web App

### Native Features Available

With Capacitor, you can use:
- Camera and photo library
- Push notifications
- Biometric authentication
- Haptic feedback
- Native sharing
- File system access

See [Capacitor Plugins](https://capacitorjs.com/docs/plugins) for available APIs.

### Things to Consider

1. **No Server-Side Rendering**: The app is purely client-side
2. **API Calls**: Ensure CORS is configured for the app's domain
3. **OAuth Redirects**: Use the custom URL scheme (`freedomaviation://`)
4. **Storage**: Consider using native storage for sensitive data
5. **Offline Mode**: PWA service workers work in Capacitor

## App Store Submission Checklist

- [ ] App icons (all sizes)
- [ ] Splash screen
- [ ] Privacy Policy URL
- [ ] App description and keywords
- [ ] Screenshots (all required device sizes)
- [ ] App Store preview video (optional)
- [ ] Privacy nutrition labels
- [ ] Export compliance information
- [ ] Age rating
- [ ] Pricing and availability

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [CocoaPods](https://cocoapods.org/)

## Support

For issues specific to:
- **Capacitor**: [GitHub Issues](https://github.com/ionic-team/capacitor/issues)
- **FreedomAviation App**: Contact the development team
- **Xcode/iOS**: [Apple Developer Forums](https://developer.apple.com/forums/)


