'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-dynamic'
import Link from 'next/link'

interface NotificationItem {
  id: string
  title: string
  body: string
  timestamp: Date
  data?: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkPermissions()
    setupNotificationListeners()
  }, [])

  const checkPermissions = async () => {
    try {
      if (!('Notification' in window)) {
        setError('This browser does not support notifications.')
        return
      }

      setPermissionGranted(Notification.permission === 'granted')
    } catch (err) {
      console.error('Check permissions error:', err)
      setError('Failed to check notification permissions.')
    }
  }

  const requestPermissions = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!('Notification' in window)) {
        setError('This browser does not support notifications.')
        return
      }

      const result = await Notification.requestPermission()
      setPermissionGranted(result === 'granted')

      if (result === 'granted') {
        // Show a test notification to confirm it works
        showTestNotification('Notifications enabled!', 'You can now receive notifications from this app.')
      }
    } catch (err) {
      console.error('Request permissions error:', err)
      setError('Failed to request notification permissions.')
    } finally {
      setLoading(false)
    }
  }

  const setupNotificationListeners = () => {
    // For browser notifications, we don't need listeners as notifications are created programmatically
    // In a real PWA, you might want to listen for service worker messages for push notifications
    console.log('Notification listeners setup complete')
  }

  const sendLocalNotification = async () => {
    const title = prompt('Enter notification title:')
    const body = prompt('Enter notification body:')

    if (!title || !body) return

    try {
      setLoading(true)
      setError(null)

      if (Notification.permission !== 'granted') {
        setError('Notification permission not granted. Please request permission first.')
        return
      }

      showTestNotification(title, body)
      alert('Notification sent!')
    } catch (err) {
      console.error('Send local notification error:', err)
      setError('Failed to send local notification.')
    } finally {
      setLoading(false)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const showTestNotification = (title: string, body: string, data?: any) => {
    try {
      const notification = new Notification(title, {
        body: body,
        icon: '/icons/icon-192x192.png', // Use your app icon
        badge: '/icons/icon-72x72.png',
        tag: 'smarthub-notification', // Group similar notifications
        data: data || {}
      })

      // Add to our notifications list
      const newNotification: NotificationItem = {
        id: Date.now().toString(),
        title: title,
        body: body,
        timestamp: new Date(),
        data: data || {}
      }

      setNotifications(prev => [newNotification, ...prev])

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    } catch (err) {
      console.error('Failed to show notification:', err)
      throw err
    }
  }

  const testNotification = () => {
    if (Notification.permission !== 'granted') {
      setError('Notification permission not granted. Please request permission first.')
      return
    }

    try {
      showTestNotification(
        'Test Notification',
        'This is a test notification to demonstrate the notification system.',
        { test: true }
      )
    } catch (err) {
      setError('Failed to show test notification.')
    }
  }

  return (
    <div className="min-h-screen mobile-gradient-bg">
      {/* Enhanced Header */}
      <header className="page-header">
        <div className="flex items-center justify-between">
          <Link href="/" className="btn-ghost text-blue-600 hover:text-blue-700 p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="ml-2 font-medium">Back</span>
          </Link>
          <div className="text-center">
            <h1 className="page-title">🔔 Notifications</h1>
            <p className="page-subtitle">Push & local notifications</p>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Notification Controls Card */}
        <div className="feature-card mb-5">
          <div className="card-header px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">⚙️ Controls</h2>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-3 mb-4">
              {permissionGranted === null && (
                <button
                  onClick={checkPermissions}
                  className="btn-secondary w-full"
                >
                  <span className="text-xl mr-2">🔍</span>
                  <span>Check Permissions</span>
                </button>
              )}

              {permissionGranted === false && (
                <button
                  onClick={requestPermissions}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <span className="text-xl mr-2">🔔</span>
                  )}
                  <span>{loading ? 'Requesting...' : 'Request Permissions'}</span>
                </button>
              )}

              {permissionGranted === true && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={sendLocalNotification}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="loading-spinner mr-2"></div>
                    ) : (
                      <span className="text-lg mr-2">📤</span>
                    )}
                    <span className="text-sm">{loading ? 'Sending...' : 'Send Local'}</span>
                  </button>

                  <button
                    onClick={testNotification}
                    className="btn-secondary"
                  >
                    <span className="text-lg mr-2">🧪</span>
                    <span className="text-sm">Test</span>
                  </button>
                </div>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="btn-danger w-full"
                >
                  <span className="text-lg mr-2">🗑️</span>
                  <span>Clear All Notifications</span>
                </button>
              )}
            </div>

            {/* Enhanced Permission Status */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Permission Status</span>
                <div className={`status-badge ${
                  permissionGranted === true ? 'status-success' :
                  permissionGranted === false ? 'status-error' :
                  'status-warning'
                }`}>
                  {permissionGranted === true && <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>}
                  {permissionGranted === false && <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>}
                  {permissionGranted === null && <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>}
                  <span>
                    {permissionGranted === true ? 'Granted' :
                     permissionGranted === false ? 'Denied' :
                     'Unknown'}
                  </span>
                </div>
              </div>

              {/* Browser notifications don't use registration tokens */}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center">
                  <span className="text-red-600 mr-3 text-lg">⚠️</span>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Notifications List */}
        <div className="feature-card mb-5">
          <div className="card-header px-5 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                📋 Notifications ({notifications.length})
              </h3>
              {notifications.length > 0 && (
                <div className="status-badge status-info">
                  <span>{notifications.filter(n => n.timestamp > new Date(Date.now() - 60000)).length} recent</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="space-y-3">
              {notifications.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔔</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">No notifications yet</p>
                  <p className="text-sm text-gray-600">Send a test notification or wait for push notifications</p>
                </div>
              )}

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-sm">🔔</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{notification.title}</h4>
                          <p className="text-xs text-gray-500 flex items-center">
                            <span>{notification.timestamp.toLocaleTimeString()}</span>
                            <span className="mx-2">•</span>
                            <span>{notification.timestamp.toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">{notification.body}</p>
                      {notification.data && (
                        <details className="mt-3">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                            View additional data
                          </summary>
                          <div className="mt-2 bg-gray-50 rounded-lg p-3">
                            <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="btn-ghost text-red-500 hover:text-red-700 p-2 ml-3 flex-shrink-0"
                      title="Remove notification"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Notification Features */}
        <div className="feature-card">
          <div className="card-header px-5 py-4">
            <h3 className="text-lg font-bold text-gray-900">⚡ Features</h3>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🌐</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Browser Notifications</div>
                  <div className="text-xs text-gray-600">Native browser notification support</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🔔</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Instant Notifications</div>
                  <div className="text-xs text-gray-600">Send notifications immediately</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🔐</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Permission Management</div>
                  <div className="text-xs text-gray-600">Request and manage notification permissions</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Notification History</div>
                  <div className="text-xs text-gray-600">View and manage notification history</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
