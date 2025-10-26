'use client'

import { useEffect, useState, useRef } from 'react'
import { Room } from 'livekit-client'
import { Hand, CheckCircle, XCircle, Heart, Waves } from 'lucide-react'

interface GestureDetectorProps {
  room: Room
  meetingId: string
  participantName: string
}

interface DetectedGesture {
  type: string
  confidence: number
  timestamp: Date
  description: string
}

export default function GestureDetector({ room, meetingId, participantName }: GestureDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [recentGestures, setRecentGestures] = useState<DetectedGesture[]>([])
  const [currentGesture, setCurrentGesture] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startGestureDetection()
    return () => {
      stopGestureDetection()
    }
  }, [room])

  const startGestureDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setIsDetecting(true)
      
      // Capture and analyze frames every 2 seconds
      intervalRef.current = setInterval(() => {
        captureAndAnalyzeFrame()
      }, 2000)

    } catch (err) {
      console.error('Error starting gesture detection:', err)
    }
  }

  const stopGestureDetection = () => {
    setIsDetecting(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8)

    try {
      const response = await fetch('/api/gestures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          imageData,
          userId: room.localParticipant.identity,
          userName: participantName,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.detected && result.confidence > 0.5) {
          const gesture: DetectedGesture = {
            type: result.gesture_type,
            confidence: result.confidence,
            timestamp: new Date(),
            description: result.description || '',
          }

          setCurrentGesture(result.gesture_type)
          setRecentGestures(prev => [gesture, ...prev.slice(0, 4)]) // Keep last 5 gestures

          // Clear current gesture after 3 seconds
          setTimeout(() => {
            setCurrentGesture(null)
          }, 3000)
        }
      }
    } catch (err) {
      console.error('Error analyzing gesture:', err)
    }
  }

  const getGestureIcon = (gestureType: string) => {
    switch (gestureType) {
      case 'yes':
        return <CheckCircle className="h-6 w-6 text-green-400" />
      case 'no':
        return <XCircle className="h-6 w-6 text-red-400" />
      case 'thank_you':
        return <Heart className="h-6 w-6 text-pink-400" />
      case 'hello':
      case 'goodbye':
        return <Hand className="h-6 w-6 text-blue-400" />
      case 'signing_detected':
        return <Waves className="h-6 w-6 text-purple-400" />
      default:
        return <Hand className="h-6 w-6 text-gray-400" />
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
      default:
        return 'Gesture'
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
      />
      <canvas ref={canvasRef} className="hidden" />

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

      {/* Gesture Detection Status */}
      <div className="bg-black bg-opacity-75 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white text-sm font-medium">
            {isDetecting ? 'Detecting Gestures' : 'Detection Off'}
          </span>
        </div>

        {/* Recent Gestures */}
        {recentGestures.length > 0 && (
          <div className="space-y-1">
            <p className="text-gray-300 text-xs">Recent:</p>
            {recentGestures.slice(0, 3).map((gesture, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                {getGestureIcon(gesture.type)}
                <span className="text-gray-300">
                  {getGestureLabel(gesture.type)}
                </span>
                <span className="text-gray-500">
                  {Math.round(gesture.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={isDetecting ? stopGestureDetection : startGestureDetection}
          className={`w-full mt-2 px-3 py-1 rounded text-xs font-medium ${
            isDetecting
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors`}
        >
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
      </div>
    </div>
  )
}
