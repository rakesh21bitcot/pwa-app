
import './globals.css'
import RootLayout from '../components/RootLayout'

export const metadata = {
  title: 'SmartHub - Device Access Companion',
  description: 'Your complete device companion with microphone, camera, location, contacts, files, and native app features',
  keywords: 'SmartHub, microphone, mobile app, camera, location, contacts, files, notifications',
  manifest: '/manifest.json',
}

export default function AppLayout({ children }: { children: any }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SmartHub" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* <link rel="apple-touch-icon" href="/icon-192x192.png" /> */}
        {/* <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" /> */}
      </head>
      <body className="h-full font-sans antialiased bg-gray-50">
        <RootLayout>
          {children}
        </RootLayout>
      </body>
    </html>
  )
}
