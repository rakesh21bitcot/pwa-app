'use client'

import { useState, useRef } from 'react'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-dynamic'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import Link from 'next/link'

export default function CameraPage() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const takePhoto = async () => {
    try {
      setLoading(true)
      setError(null)

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 600
      })

      setPhoto(image.dataUrl!)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Failed to access camera. Please check permissions.')
    } finally {
      setLoading(false)
    }
  }

  const selectFromGallery = async () => {
    try {
      setLoading(true)
      setError(null)

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      })

      setPhoto(image.dataUrl!)
    } catch (err) {
      console.error('Gallery error:', err)
      setError('Failed to access gallery. Please check permissions.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPhoto = () => {
    if (!photo) return

    const link = document.createElement('a')
    link.href = photo
    link.download = `photo-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearPhoto = () => {
    setPhoto(null)
    setError(null)
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
            <h1 className="page-title">📷 Camera</h1>
            <p className="page-subtitle">Photo capture & gallery access</p>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Camera Controls Card */}
        <div className="feature-card mb-5">
          <div className="card-header px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">📷 Camera Controls</h2>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={takePhoto}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && photo === null ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <span className="text-xl mr-2">📷</span>
                )}
                <span>{loading && photo === null ? 'Taking Photo...' : 'Take Photo'}</span>
              </button>

              <button
                onClick={selectFromGallery}
                disabled={loading}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && photo === null ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <span className="text-xl mr-2">🖼️</span>
                )}
                <span>{loading && photo === null ? 'Loading...' : 'Select from Gallery'}</span>
              </button>

              {photo && (
                <div className="flex space-x-3">
                  <button
                    onClick={downloadPhoto}
                    className="btn-primary flex-1"
                  >
                    <span className="text-lg mr-2">⬇️</span>
                    <span>Download</span>
                  </button>

                  <button
                    onClick={clearPhoto}
                    className="btn-danger flex-1"
                  >
                    <span className="text-lg mr-2">🗑️</span>
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center">
                  <span className="text-red-600 mr-3 text-lg">⚠️</span>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Photo Display */}
        {photo && (
          <div className="feature-card mb-5">
            <div className="card-header px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">🖼️ Captured Photo</h3>
                <div className="status-badge status-success">
                  <span>Ready</span>
                </div>
              </div>
            </div>

            <div className="card-body px-5 pb-5">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 mb-4">
                <div className="flex justify-center">
                  <img
                    src={photo}
                    alt="Captured photo"
                    className="max-w-full max-h-80 rounded-2xl shadow-lg border-4 border-white"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Captured:</span>
                    <span className="font-semibold text-gray-900">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-semibold text-gray-900">{Math.round((photo.length * 3) / 4 / 1024)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-semibold text-gray-900">JPEG</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Camera Features */}
        <div className="feature-card">
          <div className="card-header px-5 py-4">
            <h3 className="text-lg font-bold text-gray-900">⚡ Camera Features</h3>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📷</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">High-Quality Capture</div>
                  <div className="text-xs text-gray-600">90% quality, optimized resolution</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🖼️</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Gallery Integration</div>
                  <div className="text-xs text-gray-600">Access photos from device gallery</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💾</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">File Export</div>
                  <div className="text-xs text-gray-600">Download photos to device storage</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📱</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Native Camera API</div>
                  <div className="text-xs text-gray-600">Full Capacitor camera integration</div>
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
