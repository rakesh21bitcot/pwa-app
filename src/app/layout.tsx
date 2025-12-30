
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
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SmartHub" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
      <body className="h-full font-sans antialiased bg-gray-50">
        <RootLayout>
          {children}
        </RootLayout>
      </body>
    </html>
  )
}
