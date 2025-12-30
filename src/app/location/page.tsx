'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-static'
import { Geolocation, Position } from '@capacitor/geolocation'
import Link from 'next/link'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  speed?: number
  heading?: number
  timestamp: number
}

export default function LocationPage() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [watching, setWatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<string | null>(null)

  const getCurrentLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      })

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: position.timestamp
      }

      setLocation(locationData)
    } catch (err) {
      console.error('Location error:', err)
      setError('Failed to get location. Please check permissions and try again.')
    } finally {
      setLoading(false)
    }
  }

  const startLocationTracking = async () => {
    try {
      setError(null)

      const id = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }, (position, err) => {
        if (err) {
          console.error('Watch position error:', err)
          setError('Failed to track location.')
          return
        }

        if (position) {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp
          }
          setLocation(locationData)
        }
      })

      setWatchId(id)
      setWatching(true)
    } catch (err) {
      console.error('Watch location error:', err)
      setError('Failed to start location tracking.')
    }
  }

  const stopLocationTracking = () => {
    if (watchId) {
      Geolocation.clearWatch({ id: watchId })
      setWatchId(null)
      setWatching(false)
    }
  }

  const openInMaps = () => {
    if (!location) return

    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    window.open(url, '_blank')
  }

  const shareLocation = async () => {
    if (!location) return

    const shareData = {
      title: 'My Location',
      text: `Latitude: ${location.latitude.toFixed(6)}, Longitude: ${location.longitude.toFixed(6)}`,
      url: `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.error('Share error:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
      alert('Location copied to clipboard!')
    }
  }

  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId })
      }
    }
  }, [watchId])

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
            <h1 className="page-title">📍 Location</h1>
            <p className="page-subtitle">GPS tracking & navigation</p>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Location Controls Card */}
        <div className="feature-card mb-5">
          <div className="card-header px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">🎯 Location Controls</h2>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-3 mb-4">
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <span className="text-xl mr-2">📍</span>
                )}
                <span>{loading ? 'Getting Location...' : 'Get Current Location'}</span>
              </button>

              {!watching ? (
                <button
                  onClick={startLocationTracking}
                  className="btn-secondary w-full"
                >
                  <span className="text-xl mr-2">🎯</span>
                  <span>Start Live Tracking</span>
                </button>
              ) : (
                <button
                  onClick={stopLocationTracking}
                  className="btn-danger w-full"
                >
                  <span className="text-xl mr-2">⏹️</span>
                  <span>Stop Tracking</span>
                </button>
              )}

              {location && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={openInMaps}
                    className="btn-secondary"
                  >
                    <span className="text-lg mr-2">🗺️</span>
                    <span className="text-sm">Open Maps</span>
                  </button>

                  <button
                    onClick={shareLocation}
                    className="btn-secondary"
                  >
                    <span className="text-lg mr-2">📤</span>
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tracking Status */}
            {watching && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 mb-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-sm font-semibold text-blue-900">Live Tracking Active</div>
                      <div className="text-xs text-blue-700">Location updates every few seconds</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                    GPS
                  </div>
                </div>
              </div>
            )}

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

        {/* Enhanced Location Display */}
        {location && (
          <div className="feature-card mb-5">
            <div className="card-header px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">📍 Current Location</h3>
                <div className="status-badge status-success">
                  <span>Live Data</span>
                </div>
              </div>
            </div>

            <div className="card-body px-5 pb-5">
              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-1">Latitude</div>
                  <div className="text-lg font-mono font-bold text-gray-900">{location.latitude.toFixed(6)}</div>
                  <div className="text-xs text-gray-500 mt-1">North/South position</div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-1">Longitude</div>
                  <div className="text-lg font-mono font-bold text-gray-900">{location.longitude.toFixed(6)}</div>
                  <div className="text-xs text-gray-500 mt-1">East/West position</div>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                  <div className="text-xs font-medium text-green-700 mb-1">Accuracy</div>
                  <div className="text-lg font-mono font-bold text-green-900">±{Math.round(location.accuracy)}m</div>
                  <div className="text-xs text-green-600 mt-1">GPS precision</div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1">Last Updated</div>
                  <div className="text-sm font-mono font-bold text-blue-900">{new Date(location.timestamp).toLocaleTimeString()}</div>
                  <div className="text-xs text-blue-600 mt-1">{new Date(location.timestamp).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Additional Data */}
              {(location.altitude !== undefined || location.speed !== undefined || location.heading !== undefined) && (
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {location.altitude !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">⛰️</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Altitude</div>
                          <div className="text-xs text-gray-600">Height above sea level</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-purple-700">{Math.round(location.altitude)}m</div>
                    </div>
                  )}

                  {location.speed !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">💨</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Speed</div>
                          <div className="text-xs text-gray-600">Movement velocity</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-700">{Math.round(location.speed * 3.6)} km/h</div>
                    </div>
                  )}

                  {location.heading !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">🧭</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Heading</div>
                          <div className="text-xs text-gray-600">Direction of travel</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-indigo-700">{Math.round(location.heading)}°</div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Map Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-bold text-gray-900">🗺️ Map View</h4>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    Google Maps
                  </div>
                </div>
                <div className="aspect-video bg-white rounded-xl overflow-hidden shadow-inner">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO6x0n5f0d6n8&center=${location.latitude},${location.longitude}&zoom=15`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Location Features */}
        <div className="feature-card">
          <div className="card-header px-5 py-4">
            <h3 className="text-lg font-bold text-gray-900">⚡ GPS Features</h3>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">High-Accuracy GPS</div>
                  <div className="text-xs text-gray-600">Precise location with sub-meter accuracy</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📡</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Real-Time Tracking</div>
                  <div className="text-xs text-gray-600">Continuous location updates and monitoring</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Motion Data</div>
                  <div className="text-xs text-gray-600">Speed, heading, and altitude information</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🗺️</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Map Integration</div>
                  <div className="text-xs text-gray-600">Seamless integration with mapping services</div>
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
