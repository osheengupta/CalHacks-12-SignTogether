'use client'

import { useEffect, useState, useRef } from 'react'
import { Hand, CheckCircle, XCircle, Heart, Waves, Camera, CameraOff, ThumbsUp } from 'lucide-react'

interface RealGestureDetectorProps {
  meetingId: string
  participantName: string
  onGestureDetected?: (gesture: string, confidence: number) => void
}

interface DetectedGesture {
  type: string
  confidence: number
  timestamp: Date
  description: string
}

export default function RealGestureDetector({ 
  meetingId, 
  participantName, 
  onGestureDetected 
}: RealGestureDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [recentGestures, setRecentGestures] = useState<DetectedGesture[]>([])
  const [currentGesture, setCurrentGesture] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [frameCount, setFrameCount] = useState(0)
  const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isDetectingRef = useRef<boolean>(false)

  useEffect(() => {
    return () => {
      stopGestureDetection()
    }
  }, [])

  const startGestureDetection = async () => {
    try {
      console.log('Starting gesture detection...')
      
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        } 
      })
      
      streamRef.current = stream
      console.log('Camera stream obtained')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to load metadata first
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!
          
          const onLoadedMetadata = () => {
            console.log('Video metadata loaded:', { width: video.videoWidth, height: video.videoHeight })
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            resolve()
          }
          
          const onError = (e: Event) => {
            console.error('Video error:', e)
            video.removeEventListener('error', onError)
            reject(new Error('Video failed to load'))
          }
          
          video.addEventListener('loadedmetadata', onLoadedMetadata)
          video.addEventListener('error', onError)
          
          // Start playing
          video.play().catch(reject)
        })
      }
      
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        await previewVideoRef.current.play()
      }

      // Set detection state BEFORE starting interval
      isDetectingRef.current = true
      setIsDetecting(true)
      setError('')
      console.log('Detection state set to true')
      
      // Wait a moment for state to update, then start interval
      setTimeout(() => {
        console.log('Starting frame capture interval')
        intervalRef.current = setInterval(() => {
          captureAndAnalyzeFrame()
        }, 1500)
        
        // Capture first frame immediately
        setTimeout(() => captureAndAnalyzeFrame(), 500)
      }, 100)

    } catch (err) {
      setError('Failed to access camera for gesture detection.')
      console.error('Error starting gesture detection:', err)
    }
  }

  const stopGestureDetection = () => {
    isDetectingRef.current = false
    setIsDetecting(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null
    }
  }

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isDetectingRef.current) {
      console.log('Detection is not active or refs not available', {
        videoRef: !!videoRef.current,
        canvasRef: !!canvasRef.current,
        isDetecting: isDetectingRef.current
      })
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready:', { 
        videoWidth: video.videoWidth, 
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        srcObject: !!video.srcObject 
      })
      return
    }

    setIsProcessing(true)
    setFrameCount(prev => prev + 1)
    setLastCaptureTime(new Date())

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64 image (JPEG with higher compression for faster API calls)
      const imageData = canvas.toDataURL('image/jpeg', 0.5)

      // Send to gesture recognition API
      const response = await fetch('/api/gestures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          imageData,
          userId: 'local_participant',
          userName: participantName,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.detected && result.confidence > 0.25) {
          const gesture: DetectedGesture = {
            type: result.gesture_type,
            confidence: result.confidence,
            timestamp: new Date(),
            description: result.description || '',
          }

          // Update current gesture
          setCurrentGesture(result.gesture_type)
          
          // Add to recent gestures
          setRecentGestures(prev => [gesture, ...prev.slice(0, 4)])

          // Notify parent component
          onGestureDetected?.(result.gesture_type, result.confidence)
          
          // Add to live captions
          if (typeof window !== 'undefined' && (window as any).addGestureCaption) {
            (window as any).addGestureCaption(result.gesture_type, result.confidence)
          }

          // Clear current gesture after 3 seconds for more responsive updates
          setTimeout(() => {
            setCurrentGesture(null)
          }, 3000)
        }
      } else {
        const errorText = await response.text()
        console.error('Gesture detection API error:', errorText)
        setError(`API Error: ${response.status}`)
      }
    } catch (err) {
      console.error('Error analyzing gesture:', err)
      setError(`Analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getGestureIcon = (gestureType: string) => {
    switch (gestureType) {
      case 'yes':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'no':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'thank_you':
        return <Heart className="h-5 w-5 text-pink-400" />
      case 'hello':
      case 'goodbye':
        return <Hand className="h-5 w-5 text-blue-400" />
      case 'signing_detected':
        return <Waves className="h-5 w-5 text-purple-400" />
      case 'wave':
        return <Hand className="h-5 w-5 text-yellow-400" />
      case 'thumbs_up':
        return <ThumbsUp className="h-5 w-5 text-green-400" />
      case 'peace':
        return <Hand className="h-5 w-5 text-blue-400" />
      default:
        return <Hand className="h-5 w-5 text-gray-400" />
    }
  }

  const getGestureLabel = (gestureType: string) => {
    switch (gestureType) {
      case 'yes':
        return 'Yes'
      case 'no':
        return 'No'
      case 'thank_you':
        return 'Thank You'
      case 'hello':
        return 'Hello'
      case 'goodbye':
        return 'Goodbye'
      case 'signing_detected':
        return 'Signing'
      case 'wave':
        return 'Wave'
      case 'thumbs_up':
        return 'Thumbs Up'
      case 'peace':
        return 'Peace'
      default:
        return 'Gesture'
    }
  }

  const toggleDetection = () => {
    if (isDetecting) {
      stopGestureDetection()
    } else {
      startGestureDetection()
    }
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Hidden video and canvas for capture */}
      <video
        ref={videoRef}
        className="hidden"
        muted
        playsInline
        width="640"
        height="480"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Debug: Show small video preview when detecting */}
      {isDetecting && (
        <div className="mb-2">
          <video
            ref={previewVideoRef}
            className="w-32 h-24 rounded border border-gray-600 object-cover"
            muted
            playsInline
          />
        </div>
      )}

      {/* Current Gesture Display */}
      {currentGesture && (
        <div className="bg-black bg-opacity-75 rounded-lg p-3 mb-2 gesture-indicator">
          <div className="flex items-center space-x-2">
            {getGestureIcon(currentGesture)}
            <span className="text-white font-medium">
              {getGestureLabel(currentGesture)}
            </span>
          </div>
        </div>
      )}

      {/* Gesture Detection Panel */}
      <div className="bg-black bg-opacity-75 rounded-lg p-3 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isDetecting ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-white text-sm font-medium">
              Gesture AI
            </span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={async () => {
                // Diagnostic function
                console.log('=== CAMERA DIAGNOSTIC ===')
                console.log('isDetecting:', isDetecting)
                console.log('videoRef.current:', !!videoRef.current)
                console.log('canvasRef.current:', !!canvasRef.current)
                console.log('streamRef.current:', !!streamRef.current)
                
                if (videoRef.current) {
                  console.log('Video element:', {
                    videoWidth: videoRef.current.videoWidth,
                    videoHeight: videoRef.current.videoHeight,
                    readyState: videoRef.current.readyState,
                    srcObject: !!videoRef.current.srcObject,
                    paused: videoRef.current.paused
                  })
                }
                
                // Test capture
                if (isDetecting) {
                  captureAndAnalyzeFrame()
                } else {
                  alert('Camera not active. Click the camera button first!')
                }
              }}
              className="px-1 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Debug
            </button>
            <button
              onClick={toggleDetection}
              className={`p-1 rounded ${
                isDetecting
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
              aria-label={isDetecting ? 'Stop detection' : 'Start detection'}
            >
              {isDetecting ? <CameraOff className="h-3 w-3" /> : <Camera className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <p className="text-gray-300 text-xs mb-2">
          🤖 Powered by Gemini Vision
        </p>

        {error && (
          <p className="text-red-400 text-xs mb-2">{error}</p>
        )}

        {isDetecting && (
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <div className={`w-1 h-1 rounded-full mr-1 ${
                isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
              }`} />
              <p className="text-gray-300 text-xs">
                {isProcessing ? 'Analyzing...' : 'Watching'}
              </p>
            </div>
            <p className="text-gray-400 text-xs">
              Frames: {frameCount} | Last: {lastCaptureTime?.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Recent Gestures */}
        {recentGestures.length > 0 && (
          <div className="space-y-1">
            <p className="text-gray-300 text-xs font-medium">Recent:</p>
            {recentGestures.slice(0, 3).map((gesture, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  {getGestureIcon(gesture.type)}
                  <span className="text-gray-300">
                    {getGestureLabel(gesture.type)}
                  </span>
                </div>
                <span className="text-gray-500">
                  {Math.round(gesture.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {!isDetecting && recentGestures.length === 0 && (
          <p className="text-gray-400 text-xs">
            Click camera to start detecting gestures
          </p>
        )}
      </div>
    </div>
  )
}
