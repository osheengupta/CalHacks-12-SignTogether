'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Users, Mic, MicOff, Camera, CameraOff, Settings } from 'lucide-react'

export default function HomePage() {
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const router = useRouter()

  const handleJoinMeeting = () => {
    if (userName.trim() && roomName.trim()) {
      const params = new URLSearchParams({
        name: userName,
        room: roomName,
        audio: isAudioEnabled.toString(),
        video: isVideoEnabled.toString()
      })
      router.push(`/meeting?${params.toString()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Video className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">SignTogether</h1>
          </div>
          <p className="text-gray-600">
            Inclusive video meetings with AI-powered accessibility
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Room
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Media Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-3 rounded-full ${
                isAudioEnabled 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              } transition-colors`}
              aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-3 rounded-full ${
                isVideoEnabled 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              } transition-colors`}
              aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </button>
          </div>

          <button
            onClick={handleJoinMeeting}
            disabled={!userName.trim() || !roomName.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Join Meeting
          </button>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Features</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time speech-to-text captions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI-powered sign language detection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Smart meeting summaries</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Gesture recognition & translation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
