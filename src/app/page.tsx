
'use client'

import Link from 'next/link'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { Device } from '@capacitor/device'
import { Network } from '@capacitor/network'
import { Capacitor } from '@capacitor/core'

const features = [
  {
    id: 'microphone',
    title: 'Microphone',
    icon: '🎤',
    href: '/microphone',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    textColor: 'text-white'
  },
  {
    id: 'camera',
    title: 'Camera',
    icon: '📷',
    href: '/camera',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
    textColor: 'text-white'
  },
  {
    id: 'location',
    title: 'Location',
    icon: '📍',
    href: '/location',
    bgColor: 'bg-gradient-to-br from-red-500 to-red-600',
    textColor: 'text-white'
  },
  {
    id: 'contact',
    title: 'Contacts',
    icon: '👥',
    href: '/contact',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    textColor: 'text-white'
  },
  // {
  //   id: 'gallery',
  //   title: 'Gallery',
  //   icon: '🖼️',
  //   href: '/gallery',
  //   bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  //   textColor: 'text-white'
  // },
  {
    id: 'notifications',
    title: 'Alerts',
    icon: '🔔',
    href: '/notifications',
    bgColor: 'bg-gradient-to-br from-pink-500 to-pink-600',
    textColor: 'text-white'
  }
]

interface DeviceStatus {
  batteryLevel: number
  isCharging: boolean
  networkStatus: 'wifi' | 'cellular' | 'none' | 'unknown'
  networkType: string
  deviceInfo: {
    manufacturer: string
    model: string
    platform: string
    version: string
  }
}

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    batteryLevel: 85,
    isCharging: false,
    networkStatus: 'wifi',
    networkType: 'WiFi',
    deviceInfo: {
      manufacturer: 'Unknown',
      model: 'Unknown',
      platform: 'web',
      version: '1.0'
    }
  })

  useEffect(() => {
    getDeviceStatus()

    // Listen for network changes
    if (Capacitor.isNativePlatform()) {
      Network.addListener('networkStatusChange', (status) => {
        setDeviceStatus(prev => ({
          ...prev,
          networkStatus: status.connected ? (status.connectionType === 'wifi' ? 'wifi' : 'cellular') : 'none',
          networkType: status.connectionType || 'Unknown'
        }))
      })
    }

    return () => {
      // Cleanup listeners
      if (Capacitor.isNativePlatform()) {
        Network.removeAllListeners()
      }
    }
  }, [])

  const getDeviceStatus = async () => {
    if (!Capacitor.isNativePlatform()) {
      // For web/PWA, keep mock data
      return
    }

    try {
      // Get device info
      const deviceInfo = await Device.getInfo()
      const deviceId = await Device.getId()

      // Get network status
      const networkStatus = await Network.getStatus()

      // Get battery info (if available)
      let batteryLevel = 85
      let isCharging = false

      // Note: Battery API is not available in Capacitor core, would need separate plugin
      // For now, we'll keep mock battery data

      setDeviceStatus({
        batteryLevel,
        isCharging,
        networkStatus: networkStatus.connected ? (networkStatus.connectionType === 'wifi' ? 'wifi' : 'cellular') : 'none',
        networkType: networkStatus.connectionType || 'Unknown',
        deviceInfo: {
          manufacturer: deviceInfo.manufacturer || 'Unknown',
          model: deviceInfo.model || 'Unknown',
          platform: deviceInfo.platform || 'unknown',
          version: deviceInfo.osVersion || '1.0'
        }
      })
    } catch (error) {
      console.error('Error getting device status:', error)
      // Keep default values on error
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 max-w-full overflow-hidden">
      {/* Enhanced Status Bar */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">SmartHub</div>
              <div className="text-xs text-gray-500">AI Companion</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-700 font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🔋</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Enhanced Welcome Section */}
        <div className="text-center mb-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-3xl">🚀</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SmartHub
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto px-4">
            Your complete device companion with full native access and permissions
          </p>
          <div className="flex justify-center mt-4 space-x-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Microphone</div>
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Native Access</div>
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Device Control</div>
          </div>
        </div>

        {/* Premium Feature Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-bold text-gray-900">Features</h2>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1.5 rounded-full border border-blue-100/50">
                <span className="font-medium">{features.length}</span> available
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <Link
                key={feature.id}
                href={feature.href}
                className="block group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 active:scale-[0.98] transform hover:-translate-y-2 border border-gray-100/50 backdrop-blur-sm overflow-hidden animate-in slide-in-from-left">
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full transform translate-x-16 -translate-y-16"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                          <span className="text-2xl drop-shadow-sm">{feature.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                            Native device access
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-sm">
                          <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">→</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                        feature.id === 'microphone' ? 'bg-blue-100 text-blue-700' :
                        feature.id === 'camera' ? 'bg-green-100 text-green-700' :
                        feature.id === 'location' ? 'bg-red-100 text-red-700' :
                        feature.id === 'contact' ? 'bg-teal-100 text-teal-700' :
                        feature.id === 'files' ? 'bg-purple-100 text-purple-700' :
                        feature.id === 'gallery' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-pink-100 text-pink-700'
                      }`}>
                        <div className="w-1.5 h-1.5 bg-current rounded-full mr-2 opacity-60"></div>
                        Ready to use
                      </div>

                      <div className="text-xs text-gray-400 flex items-center space-x-1">
                        <span>Tap to open</span>
                        <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs">⚡</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                       style={{
                         background: `linear-gradient(135deg, ${feature.id === 'microphone' ? '#3b82f6' :
                                                                  feature.id === 'camera' ? '#10b981' :
                                                                  feature.id === 'location' ? '#ef4444' :
                                                                  feature.id === 'contact' ? '#14b8a6' :
                                                                  feature.id === 'files' ? '#8b5cf6' :
                                                                  feature.id === 'gallery' ? '#eab308' :
                                                                  '#ec4899'} 0%, transparent 50%)`,
                         padding: '1px'
                       }}>
                    <div className="w-full h-full bg-white rounded-3xl"></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>


        {/* Real Device Status */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 text-lg">Device Status</h3>
            <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Status</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🔋</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Battery</div>
                  <div className="text-xs text-gray-600">
                    {deviceStatus.isCharging ? 'Charging' : 'Power remaining'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{deviceStatus.batteryLevel}%</div>
                <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      deviceStatus.batteryLevel > 60 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      deviceStatus.batteryLevel > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${deviceStatus.batteryLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">
                    {deviceStatus.networkStatus === 'wifi' ? '📶' :
                     deviceStatus.networkStatus === 'cellular' ? '📱' : '❌'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Network</div>
                  <div className="text-xs text-gray-600">
                    {deviceStatus.networkType === 'wifi' ? 'WiFi connected' :
                     deviceStatus.networkType === 'cellular' ? 'Cellular data' :
                     deviceStatus.networkType === 'none' ? 'No connection' : 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${
                  deviceStatus.networkStatus === 'wifi' ? 'text-blue-600' :
                  deviceStatus.networkStatus === 'cellular' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {deviceStatus.networkStatus === 'wifi' ? 'WiFi' :
                   deviceStatus.networkStatus === 'cellular' ? 'Cellular' :
                   deviceStatus.networkStatus === 'none' ? 'Offline' : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {deviceStatus.networkStatus === 'wifi' ? 'Fast' :
                   deviceStatus.networkStatus === 'cellular' ? 'Mobile' : 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📱</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Device</div>
                  <div className="text-xs text-gray-600">
                    {deviceStatus.deviceInfo.model} • {deviceStatus.deviceInfo.platform}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-600">{deviceStatus.deviceInfo.manufacturer}</div>
                <div className="text-xs text-gray-500">v{deviceStatus.deviceInfo.version}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">SmartHub</div>
                  <div className="text-xs text-gray-600">App status</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-orange-600">
                  {Capacitor.isNativePlatform() ? 'Native' : 'Web App'}
                </div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
