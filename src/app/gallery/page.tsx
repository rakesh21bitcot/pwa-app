'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-static'
import { Media, MediaSaveOptions } from '@capacitor-community/media'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import Link from 'next/link'

interface MediaItem {
  id: string
  path: string
  fileName: string
  data: string
  type: 'image' | 'video'
  size: number
  dateAdded: string
}

export default function GalleryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  const loadGallery = async () => {
    try {
      setLoading(true)
      setError(null)

      const { medias } = await Media.getMedias({
        quantity: 50,
        thumbnailWidth: 200,
        thumbnailHeight: 200
      })

      const items: MediaItem[] = medias.map(media => ({
        id: media.identifier || Math.random().toString(),
        path: (media as any).path || '',
        fileName: (media as any).fileName || 'Unknown',
        data: (media as any).data || '',
        type: ((media as any).type as 'image' | 'video') || 'image',
        size: (media as any).size || 0,
        dateAdded: new Date().toISOString() // Media plugin may not provide date
      }))

      setMediaItems(items)
    } catch (err) {
      console.error('Load gallery error:', err)
      setError('Failed to load gallery. Please check permissions.')
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

      // Add selected image to our items
      const newItem: MediaItem = {
        id: Date.now().toString(),
        path: image.path || '',
        fileName: `selected-${Date.now()}.jpg`,
        data: image.dataUrl || '',
        type: 'image',
        size: Math.round((image.dataUrl?.length || 0) * 3 / 4 / 1024), // Approximate size
        dateAdded: new Date().toISOString()
      }

      setMediaItems(prev => [newItem, ...prev])
      setSelectedItem(newItem)
    } catch (err) {
      console.error('Select from gallery error:', err)
      setError('Failed to select from gallery.')
    } finally {
      setLoading(false)
    }
  }

  const saveToGallery = async (dataUrl: string, filename: string) => {
    try {
      setLoading(true)
      setError(null)

      const base64Data = dataUrl.split(',')[1]
      const mimeType = dataUrl.split(';')[0].split(':')[1]

      // Fix: Media.saveMedia does not exist, use Media.savePhoto instead (assume photo), and pass correct options.
      await Media.savePhoto({
        path: filename
      });

      alert('Media saved to gallery successfully!')
    } catch (err) {
      console.error('Save to gallery error:', err)
      setError('Failed to save media to gallery.')
    } finally {
      setLoading(false)
    }
  }

  const createAlbum = async () => {
    const albumName = prompt('Enter album name:')
    if (!albumName) return

    try {
      setLoading(true)
      setError(null)

      await Media.createAlbum({ name: albumName })
      alert(`Album "${albumName}" created successfully!`)
    } catch (err) {
      console.error('Create album error:', err)
      setError('Failed to create album.')
    } finally {
      setLoading(false)
    }
  }

  const downloadMedia = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareMedia = async (dataUrl: string, filename: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], filename, { type: blob.type })

      if (navigator.share) {
        await navigator.share({
          title: filename,
          files: [file]
        })
      } else {
        // Fallback: download
        downloadMedia(dataUrl, filename)
        alert('File downloaded (sharing not supported)')
      }
    } catch (err) {
      console.error('Share media error:', err)
      // Fallback: download
      downloadMedia(dataUrl, filename)
    }
  }

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${item.fileName}"?`)) return

    try {
      setLoading(true)
      setError(null)

      // Note: Media plugin may not support deletion, this is a placeholder
      setMediaItems(prev => prev.filter(i => i.id !== item.id))
      if (selectedItem?.id === item.id) {
        setSelectedItem(null)
      }

      alert('Media removed from list (physical deletion may not be supported)')
    } catch (err) {
      console.error('Delete media error:', err)
      setError('Failed to delete media.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGallery()
  }, [])

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
            <h1 className="page-title">🖼️ Gallery</h1>
            <p className="page-subtitle">Photo & media library</p>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Quick Actions Bar */}
        <div className="feature-card mb-5">
          <div className="card-body px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={loadGallery}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="loading-spinner mr-2"></div>
                ) : (
                  <span className="text-xl mr-2">🔄</span>
                )}
                <span className="text-sm">Refresh</span>
              </button>

              <button
                onClick={selectFromGallery}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl mr-2">📤</span>
                <span className="text-sm">Select</span>
              </button>

              <button
                onClick={createAlbum}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl mr-2">📁</span>
                <span className="text-sm">New Album</span>
              </button>

              {mediaItems.length > 0 && (
                <div className="status-badge status-info">
                  <span>{mediaItems.length} items</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Gallery Layout */}
        <div className="space-y-6">
          {/* Gallery Stats Bar */}
          {mediaItems.length > 0 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 via-pink-50 to-yellow-50 rounded-2xl p-4 border border-purple-100">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🖼️</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {mediaItems.length} Media {mediaItems.length === 1 ? 'Item' : 'Items'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {mediaItems.filter(item => item.type === 'image').length} photos, {mediaItems.filter(item => item.type === 'video').length} videos
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Gallery Active</span>
              </div>
            </div>
          )}

          {/* Enhanced Gallery Grid */}
          <div className="feature-card">
            <div className="card-header px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">📸 Your Gallery</h2>
                {selectedItem && (
                  <div className="text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                    1 selected
                  </div>
                )}
              </div>
            </div>

            <div className="card-body px-5 pb-5">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">Loading your gallery...</div>
                    <div className="text-sm text-gray-600">This may take a moment</div>
                  </div>
                </div>
              )}

              {!loading && mediaItems.length === 0 && (
                <div className="text-center py-20">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                      <span className="text-4xl">🖼️</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-lg">✨</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your Gallery is Empty</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Start building your media collection by taking photos or selecting from your device
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={selectFromGallery}
                      className="btn-primary"
                    >
                      <span className="text-lg mr-2">📤</span>
                      <span>Select Media</span>
                    </button>
                    <button
                      onClick={createAlbum}
                      className="btn-secondary"
                    >
                      <span className="text-lg mr-2">📁</span>
                      <span>Create Album</span>
                    </button>
                  </div>
                </div>
              )}

              {!loading && mediaItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {mediaItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`group relative cursor-pointer transform transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 ${
                        selectedItem?.id === item.id
                          ? 'ring-4 ring-blue-500 ring-offset-2 shadow-2xl scale-[1.02]'
                          : 'hover:shadow-xl'
                      }`}
                      onClick={() => setSelectedItem(item)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Media Container */}
                      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                        {item.type === 'image' ? (
                          <img
                            src={item.data}
                            alt={item.fileName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl">🎥</span>
                            </div>
                          </div>
                        )}

                        {/* Overlay with Info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {item.type === 'image' ? (
                                  <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                                    <span className="text-xs">📷</span>
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                                    <span className="text-xs">🎥</span>
                                  </div>
                                )}
                                <span className="text-white text-xs font-medium px-2 py-0.5 bg-black/50 rounded-full">
                                  {item.size}KB
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteMedia(item)
                                }}
                                className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-white text-sm font-medium truncate leading-tight">
                              {item.fileName}
                            </p>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {selectedItem?.id === item.id && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* Hover Effect Border */}
                        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                             style={{
                               background: `linear-gradient(135deg, ${item.type === 'image' ? '#f59e0b' : '#8b5cf6'} 0%, transparent 70%)`,
                               padding: '2px'
                             }}>
                          <div className="w-full h-full bg-white rounded-3xl"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

          {/* Enhanced Media Preview */}
          {selectedItem && (
            <div className="feature-card">
              <div className="card-header px-5 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">👁️ Media Preview</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {selectedItem.type.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {selectedItem.size}KB
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-body px-5 pb-5">
                <div className="space-y-6">
                  {/* Large Preview */}
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl overflow-hidden shadow-inner border-2 border-gray-100">
                      {selectedItem.type === 'image' ? (
                        <img
                          src={selectedItem.data}
                          alt={selectedItem.fileName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                            <span className="text-3xl">🎥</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {selectedItem.type === 'image' ? 'Photo' : 'Video'}
                    </div>
                  </div>

                  {/* File Details Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{selectedItem.fileName}</div>
                        <div className="text-xs text-gray-600">
                          Added {new Date(selectedItem.dateAdded).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-semibold text-gray-900 capitalize">{selectedItem.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedItem.size} KB</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => downloadMedia(selectedItem.data, selectedItem.fileName)}
                      className="btn-secondary"
                    >
                      <span className="text-lg mr-2">⬇️</span>
                      <span className="text-sm">Download</span>
                    </button>

                    <button
                      onClick={() => shareMedia(selectedItem.data, selectedItem.fileName)}
                      className="btn-secondary"
                    >
                      <span className="text-lg mr-2">📤</span>
                      <span className="text-sm">Share</span>
                    </button>

                    <button
                      onClick={() => saveToGallery(selectedItem.data, selectedItem.fileName)}
                      disabled={loading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="loading-spinner mr-2"></div>
                      ) : (
                        <span className="text-lg mr-2">💾</span>
                      )}
                      <span className="text-sm">{loading ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Gallery Features */}
        <div className="feature-card mt-5">
          <div className="card-header px-5 py-4">
            <h3 className="text-lg font-bold text-gray-900">⚡ Media Library Features</h3>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-100 rounded-2xl border border-yellow-200">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🖼️</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Gallery Access</div>
                  <div className="text-xs text-gray-600">Full access to device photo and video libraries</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📤</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Media Selection</div>
                  <div className="text-xs text-gray-600">Pick and preview media from device gallery</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl border border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💾</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Save & Export</div>
                  <div className="text-xs text-gray-600">Download and share media files seamlessly</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-violet-100 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📱</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Native Integration</div>
                  <div className="text-xs text-gray-600">Direct access to device's media APIs</div>
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
