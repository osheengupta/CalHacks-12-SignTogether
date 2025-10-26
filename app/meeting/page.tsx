'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mic, MicOff, Camera, CameraOff, PhoneOff, MessageSquare, Users, Settings } from 'lucide-react'
import RealTimeCaptions from '@/components/RealTimeCaptions'
import RealGestureDetector from '@/components/RealGestureDetector'
import RealMeetingSummary from '@/components/RealMeetingSummary'

export default function MeetingPage() {
  const searchParams = useSearchParams()
  const [meetingId, setMeetingId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showCaptions, setShowCaptions] = useState(true)
  const [showSummary, setShowSummary] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const roomName = searchParams.get('room') || ''
  const participantName = searchParams.get('name') || ''
  const audioEnabled = searchParams.get('audio') === 'true'
  const videoEnabled = searchParams.get('video') === 'true'

  useEffect(() => {
    if (!roomName || !participantName) {
      setError('Missing room name or participant name')
      setIsLoading(false)
      return
    }

    const initializeMeeting = async () => {
      try {
        // Simulate meeting creation
        setMeetingId('demo_meeting_' + Date.now())
        
        // Start user's camera
        if (videoEnabled && videoRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: audioEnabled 
            })
            videoRef.current.srcObject = stream
            console.log('Camera access granted')
          } catch (cameraError) {
            console.error('Camera access denied:', cameraError)
            setError('Camera access denied. Please allow camera permission and refresh.')
            return
          }
        }
        
        setIsConnected(true)
        
        // Meeting initialized successfully
        console.log('Meeting initialized:', meetingId)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize meeting')
      } finally {
        setIsLoading(false)
      }
    }

    initializeMeeting()
  }, [roomName, participantName, videoEnabled, audioEnabled])

  const handleDisconnect = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    window.location.href = '/'
  }

  const generateSummary = () => {
    setShowSummary(true)
    setShowCaptions(false)
  }

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: isAudioEnabled 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsVideoEnabled(true)
      setError('')
    } catch (err) {
      setError('Camera permission denied. Please check browser settings.')
    }
  }

  const handleGestureDetected = (gesture: string, confidence: number) => {
    setDetectedGesture(gesture)
    console.log(`Gesture detected: ${gesture} (${Math.round(confidence * 100)}%)`)
    
    // Clear gesture after 4 seconds
    setTimeout(() => {
      setDetectedGesture(null)
    }, 4000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Joining meeting...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Video Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 h-full">
            {/* Local Video */}
            <div className="bg-gray-800 rounded-lg relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                {participantName} (You)
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center flex-col">
                  <CameraOff className="h-12 w-12 text-gray-400 mb-4" />
                  <button
                    onClick={enableCamera}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Enable Camera
                  </button>
                </div>
              )}
            </div>

            {/* Demo Participant */}
            <div className="bg-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <p className="text-white">Demo Participant</p>
                <p className="text-gray-400 text-sm">Camera off</p>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                Alex Rivera
              </div>
            </div>
          </div>

          {/* Real Gesture Detection */}
          <RealGestureDetector 
            meetingId={meetingId}
            participantName={participantName}
            onGestureDetected={handleGestureDetected}
          />

          {/* Meeting Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-3 rounded-full ${
                  isAudioEnabled 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                } transition-colors`}
                aria-label="Toggle microphone"
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-3 rounded-full ${
                  isVideoEnabled 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                } transition-colors`}
                aria-label="Toggle camera"
              >
                {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`p-3 rounded-full ${
                  showCaptions 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } transition-colors`}
                aria-label="Toggle captions"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              
              {/* Quick Test Button */}
              <button
                onClick={() => {
                  alert(`Button works! Meeting ID: ${meetingId || 'Not set'}`)
                  console.log('Test button clicked! MeetingId:', meetingId)
                  // Force show captions panel
                  setShowCaptions(true)
                  setShowSummary(false)
                }}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                Test UI
              </button>
              
              <button
                onClick={() => setShowSummary(!showSummary)}
                className={`p-3 rounded-full ${
                  showSummary 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                } transition-colors`}
                aria-label="Toggle summary"
              >
                <Users className="h-5 w-5" />
              </button>

              <button
                onClick={handleDisconnect}
                className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                aria-label="Leave meeting"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {(showCaptions || showSummary) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => {
                  setShowCaptions(true)
                  setShowSummary(false)
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showCaptions && !showSummary
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Live Captions
              </button>
              <button
                onClick={() => {
                  setShowSummary(true)
                  setShowCaptions(false)
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showSummary && !showCaptions
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Summary
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {showCaptions && !showSummary && meetingId && (
                <RealTimeCaptions 
                  meetingId={meetingId}
                  participantName={participantName}
                />
              )}
              
              {showSummary && !showCaptions && meetingId && (
                <RealMeetingSummary meetingId={meetingId} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
