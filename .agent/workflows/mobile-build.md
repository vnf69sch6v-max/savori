---
description: How to test and build mobile apps with Capacitor
---
// turbo-all

# Mobile App Development Workflow

## Test on iOS Simulator
```bash
cd /path/to/smartsaver
npx cap sync
npx cap open ios
```
Then in Xcode: Select iPhone simulator → Press ▶️ Run

## Test on Android Emulator
```bash
cd /path/to/smartsaver
npx cap sync
npx cap open android
```
Then in Android Studio: Select device → Press ▶️ Run

## Live Reload (dev)
```bash
npm run dev  # Start Next.js dev server
# Update capacitor.config.ts: server.url = 'http://YOUR_LOCAL_IP:3000'
npx cap run ios --livereload --external
```

## After Code Changes
```bash
npx cap sync  # Syncs web assets to native projects
npx cap run ios  # Or android
```

## Build for Release
### iOS (App Store)
1. Open Xcode: `npx cap open ios`
2. Product → Archive
3. Distribute App → App Store Connect

### Android (Google Play)
1. Open Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle (AAB)
3. Upload to Play Console
