# SmartHub - Device Access Companion

A comprehensive mobile-first Progressive Web App (PWA) built with Next.js that provides full access to device native capabilities through Capacitor. Access microphone, camera, location, contacts, file system, notifications, and gallery - all with native device permissions in a beautiful mobile interface.

## 🚀 Features

### Core Functionality
- **AI Voice Assistant**: Voice-powered conversations with AI
- **Camera Integration**: Take photos and access camera with native controls
- **Location Services**: GPS tracking and location sharing
- **File System Access**: Read, write, and manage files natively
- **Push Notifications**: Native push notification support
- **Gallery Access**: Browse and manage media from device gallery
- **PWA Ready**: Installable as a native app on any device

### Technical Features
- **Progressive Web App**: Full PWA capabilities with service workers
- **Capacitor Integration**: Native mobile app functionality
- **Responsive Design**: Modern UI with Tailwind CSS
- **TypeScript**: Full type safety
- **Cross-platform**: Works on web, iOS, and Android

## 📱 Device Capabilities

| Feature | Web | iOS | Android | Description |
|---------|-----|-----|---------|-------------|
| 🎤 Microphone | ✅ | ✅ | ✅ | Audio recording with noise suppression |
| 📷 Camera | ✅ | ✅ | ✅ | Photo/video capture and gallery access |
| 📍 Location | ✅ | ✅ | ✅ | GPS tracking and location services |
| 👥 Contacts | ❌ | ✅ | ✅ | Device contacts access and management |
| 📁 Files | ❌ | ✅ | ✅ | Native file system access |
| 🔔 Notifications | ❌ | ✅ | ✅ | Push notifications |
| 🖼️ Gallery | ❌ | ✅ | ✅ | Media library access |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **PWA**: Service Workers, Web App Manifest
- **Native**: Capacitor 6 with plugins
- **Audio**: RecordRTC for voice recording
- **Build**: Next.js static export

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-capacitor-ai-voice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Capacitor Setup

### iOS Development
```bash
npm run cap:sync
npm run cap:ios
```

### Android Development
```bash
npm run cap:sync
npm run cap:android
```

## 🔧 Capacitor Plugins

The app includes the following Capacitor plugins:

- `@capacitor/camera` - Camera and photo capture
- `@capacitor/filesystem` - File system access
- `@capacitor/geolocation` - GPS and location services
- `@capacitor/push-notifications` - Push notifications
- `@capacitor-community/media` - Media gallery access

## 🎨 App Structure

```
app/
├── page.tsx              # Main dashboard
├── layout.tsx            # Root layout
├── globals.css           # Global styles
├── voice/
│   └── page.tsx          # Voice assistant
├── camera/
│   └── page.tsx          # Camera interface
├── location/
│   └── page.tsx          # Location services
├── files/
│   └── page.tsx          # File system
├── notifications/
│   └── page.tsx          # Push notifications
└── gallery/
    └── page.tsx          # Media gallery
```

## 🚀 Deployment

### Web Deployment
The app is configured for static export and can be deployed to any static hosting service:

```bash
npm run build
# Deploy the 'out' directory
```

### Native App Deployment
1. Build the web app
2. Sync with Capacitor
3. Open in native IDE for deployment

```bash
npm run build
npm run cap:sync
npm run cap:ios    # or cap:android
```

## 🔒 Permissions

The app requests the following permissions:

### iOS
- Camera access
- Microphone access
- Location services
- Contacts access
- Photo library access
- Push notifications
- File system access

### Android
- Camera permission
- Location permission
- Contacts permission
- Storage permission
- Notification permission
- Microphone permission

## 🎯 Usage

1. **Install as PWA**: On mobile devices, install the app from your browser
2. **Grant Permissions**: Allow camera, microphone, location, and other permissions when prompted
3. **Explore Features**: Use the dashboard to access different device capabilities
4. **Voice Assistant**: Click the voice button to start AI conversations
5. **Native Experience**: All features work with native device integration

## 🔧 Configuration

### PWA Manifest
Located in `public/manifest.json` - customize app icons, name, and display options.

### Capacitor Config
Located in `capacitor.config.ts` - configure plugins and native app settings.

### Environment Variables
Create `.env.local` for any environment-specific configurations.

## 🐛 Troubleshooting

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

### Capacitor Issues
- Re-sync: `npm run cap:sync`
- Clean and rebuild: `npm run cap:sync && npm run cap:ios`

### Permission Issues
- Check device settings for app permissions
- Reinstall the app if permissions are denied
- Restart the app after granting permissions

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the Capacitor documentation
- Review Next.js documentation

---

Built with ❤️ using Next.js, Capacitor, and modern web technologies.
