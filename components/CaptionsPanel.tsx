'use client'

import { useEffect, useState, useRef } from 'react'
import { Room, Track, RemoteAudioTrack, LocalAudioTrack } from 'livekit-client'
import { Volume2, VolumeX } from 'lucide-react'

interface Caption {
  id: string
  speakerName: string
  text: string
  timestamp: Date
  confidence?: number
}

interface CaptionsPanelProps {
  meetingId: string
  room: Room | null
}

export default function CaptionsPanel({ meetingId, room }: CaptionsPanelProps) {
  const [captions, setCaptions] = useState<Caption[]>([])
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string>('')
  const captionsEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto-scroll to bottom when new captions arrive
  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [captions])

  // Fetch existing captions
  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        const response = await fetch(`/api/captions?meetingId=${meetingId}`)
        if (response.ok) {
          const { transcripts } = await response.json()
          const formattedCaptions = transcripts.map((t: any) => ({
            id: t.id,
            speakerName: t.speakerName || 'Speaker',
            text: t.text,
            timestamp: new Date(t.timestamp),
            confidence: t.confidence,
          }))
          setCaptions(formattedCaptions)
        }
      } catch (err) {
        console.error('Error fetching captions:', err)
      }
    }

    if (meetingId) {
      fetchCaptions()
    }
  }, [meetingId])

  // Start audio capture and transcription
  const startListening = async () => {
    try {
      if (!room) return

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudioChunk(audioBlob)
        audioChunksRef.current = []
      }

      // Record in 3-second chunks for real-time processing
      mediaRecorder.start()
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          if (isListening) {
            setTimeout(startListening, 100) // Small delay before next chunk
          }
        }
      }, 3000)

      setIsListening(true)
      setError('')
    } catch (err) {
      setError('Failed to start audio capture')
      console.error('Error starting audio capture:', err)
    }
  }

  const stopListening = () => {
    setIsListening(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1]
        
        const response = await fetch('/api/captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId,
            audioData: base64Audio,
            speakerId: room?.localParticipant.identity,
            speakerName: room?.localParticipant.name || 'You',
          }),
        })

        if (response.ok) {
          const { text, confidence } = await response.json()
          if (text && text.trim()) {
            const newCaption: Caption = {
              id: Date.now().toString(),
              speakerName: room?.localParticipant.name || 'You',
              text: text.trim(),
              timestamp: new Date(),
              confidence,
            }
            setCaptions(prev => [...prev, newCaption])
          }
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (err) {
      console.error('Error processing audio chunk:', err)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Captions</h3>
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full ${
              isListening 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
        {isListening && (
          <p className="text-green-400 text-sm mt-2">🎤 Listening for speech...</p>
        )}
      </div>

      {/* Captions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {captions.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No captions yet.</p>
            <p className="text-sm mt-2">Click the microphone to start live transcription.</p>
          </div>
        ) : (
          captions.map((caption) => (
            <div key={caption.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-300">
                  {caption.speakerName}
                </span>
                <span className="text-xs text-gray-400">
                  {caption.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white text-sm leading-relaxed">{caption.text}</p>
              {caption.confidence && (
                <div className="mt-2 flex items-center">
                  <div className="flex-1 bg-gray-600 rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full"
                      style={{ width: `${caption.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {Math.round(caption.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={captionsEndRef} />
      </div>
    </div>
  )
}
