
let RecordRTC: any = null
let recorder: any = null

// Dynamically import RecordRTC only in browser environment
if (typeof window !== 'undefined') {
  import('recordrtc').then((module) => {
    RecordRTC = module.default
  }).catch((err) => {
    console.warn('RecordRTC not available:', err)
  })
}

export async function startRecording(stream: MediaStream) {
  if (!RecordRTC) {
    throw new Error('Recording not available in this environment')
  }
  recorder = new RecordRTC(stream, {
    type: 'audio',
    mimeType: 'audio/webm',
    desiredSampRate: 16000,
  })
  recorder.startRecording()
}

export async function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!recorder) {
      reject(new Error('No active recording'))
      return
    }
    recorder.stopRecording(() => {
      resolve(recorder.getBlob())
    })
  })
}
