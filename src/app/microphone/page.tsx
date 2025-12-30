
'use client'

import { useState, useRef, useEffect } from 'react'
import { startRecording, stopRecording } from '../../../lib/recorder'
import Link from 'next/link'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-dynamic'

export default function MicrophonePage() {
  const [recording, setRecording] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only check permissions in browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      checkMicrophonePermission()
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const checkMicrophonePermission = async () => {
    try {
      // Check if we're in browser environment and APIs are available
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setPermissionGranted(permission.state === 'granted')
      }
    } catch (err) {
      console.log('Permission check not supported')
      setPermissionGranted(null)
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      setError(null)
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices) {
        setError('Microphone access not available in this environment.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream
      setPermissionGranted(true)
    } catch (err) {
      console.error('Permission denied:', err)
      setError('Microphone permission denied. Please allow microphone access.')
      setPermissionGranted(false)
    }
  }

  const startRecordingHandler = async () => {
    try {
      setError(null)
      setRecordingTime(0)

      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices) {
        setError('Recording not available in this environment.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      await startRecording(stream)
      setRecording(true)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Recording start error:', err)
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecordingHandler = async () => {
    try {
    const blob = await stopRecording()
    setRecording(false)
      setAudioBlob(blob)

      // Create audio URL for playback
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Reset recording time after a brief delay
      setTimeout(() => setRecordingTime(0), 1000)

    } catch (err) {
      console.error('Recording stop error:', err)
      setError('Failed to stop recording.')
    }
  }

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const downloadRecording = () => {
    if (audioBlob && audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `recording-${Date.now()}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
            <h1 className="page-title">🎤 Microphone</h1>
            <p className="page-subtitle">Audio recording & capture</p>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Permission Status Card */}
        <div className="feature-card mb-5">
          <div className="card-header px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Permission Status</h2>
              <div className={`status-badge ${
                permissionGranted === true ? 'status-success' :
                permissionGranted === false ? 'status-error' :
                'status-warning'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  permissionGranted === true ? 'bg-green-500' :
                  permissionGranted === false ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                <span>
                  {permissionGranted === true ? 'Granted' :
                   permissionGranted === false ? 'Denied' :
                   'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="card-body px-5 pb-5">
            {permissionGranted === false && (
              <div className="mb-4">
                <button
                  onClick={requestMicrophonePermission}
                  className="btn-primary w-full"
                >
                  <span>🔓</span>
                  <span>Request Microphone Permission</span>
                </button>
              </div>
            )}

            {permissionGranted !== false && (
              <div className="space-y-6">
                {/* Recording Status */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {recording ? 'Recording Active' : 'Ready to Record'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {recording ? `Duration: ${formatTime(recordingTime)}` : 'Tap the record button to start'}
                        </div>
                      </div>
                    </div>
                    {recording && (
                      <div className="text-xs font-mono text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        LIVE
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Recording Controls */}
                <div className="flex justify-center">
                  <button
                    onClick={recording ? stopRecordingHandler : startRecordingHandler}
                    disabled={permissionGranted === null}
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
                      recording
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-300'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-300'
                    } ${permissionGranted === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-white">
                      {recording ? (
                        <div className="w-6 h-6 bg-white rounded-sm mx-auto"></div>
                      ) : (
                        <div className="w-0 h-0 border-l-4 border-l-white border-t-3 border-t-transparent border-b-3 border-b-transparent ml-1"></div>
                      )}
                    </div>
                  </button>
                </div>

                {recording && (
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-full border border-red-200">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">Recording in progress...</span>
                    </div>
                  </div>
                )}
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

        {/* Recorded Audio */}
        {audioBlob && audioUrl && (
          <div className="feature-card mb-5">
            <div className="card-header px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">🎵 Recorded Audio</h3>
            </div>

            <div className="card-body px-5 pb-5">
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full"
                  controls
                />
              </div>

              <div className="flex space-x-3 mb-4">
                <button
                  onClick={playRecording}
                  disabled={isPlaying}
                  className="btn-success flex-1 disabled:opacity-50"
                >
                  <span>{isPlaying ? '⏸️' : '▶️'}</span>
                  <span>{isPlaying ? 'Playing...' : 'Play Recording'}</span>
                </button>
                <button
                  onClick={downloadRecording}
                  className="btn-primary flex-1"
                >
                  <span>⬇️</span>
                  <span>Download</span>
                </button>
              </div>

              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>File size:</span>
                    <span className="font-medium text-gray-900">{(audioBlob.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium text-gray-900">WebM Audio</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recorded:</span>
                    <span className="font-medium text-gray-900">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Microphone Features */}
        <div className="feature-card">
          <div className="card-header px-5 py-4">
            <h3 className="text-lg font-bold text-gray-900">⚡ Features</h3>
          </div>

          <div className="card-body px-5 pb-5">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🎙️</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">High-Quality Recording</div>
                  <div className="text-xs text-gray-600">44.1kHz sample rate with noise reduction</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🔇</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Noise Suppression</div>
                  <div className="text-xs text-gray-600">Advanced echo cancellation & filtering</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">💾</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">File Export</div>
                  <div className="text-xs text-gray-600">Download recordings in multiple formats</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">📱</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">Native Integration</div>
                  <div className="text-xs text-gray-600">Full Capacitor microphone permissions</div>
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
