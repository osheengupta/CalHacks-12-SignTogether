'use client'

import { useEffect, useState, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface Caption {
  id: string
  speakerName: string
  text: string
  timestamp: Date
  confidence?: number
  isGesture?: boolean
}

interface RealTimeCaptionsProps {
  meetingId: string
  participantName: string
  onGestureDetected?: (gesture: string, confidence: number) => void
}

export default function RealTimeCaptions({ meetingId, participantName, onGestureDetected }: RealTimeCaptionsProps) {
  const [captions, setCaptions] = useState<Caption[]>([])
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const captionsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new captions arrive
  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [captions])

  // Fetch existing captions on mount
  useEffect(() => {
    fetchExistingCaptions()
  }, [meetingId])

  // Add gesture to captions
  const addGestureCaption = (gesture: string, confidence: number) => {
    const gestureText = getGestureText(gesture)
    const newCaption: Caption = {
      id: Date.now().toString(),
      speakerName: participantName,
      text: `👋 ${gestureText}`,
      timestamp: new Date(),
      confidence,
      isGesture: true,
    }
    setCaptions(prev => [...prev, newCaption])
    onGestureDetected?.(gesture, confidence)
  }

  const getGestureText = (gesture: string): string => {
    const gestureMap: Record<string, string> = {
      'yes': 'Yes',
      'no': 'No',
      'thank_you': 'Thank you',
      'hello': 'Hello',
      'goodbye': 'Goodbye',
      'wave': 'Waving',
      'thumbs_up': 'Thumbs up',
      'peace': 'Peace sign',
      'signing_detected': 'Signing detected',
    }
    return gestureMap[gesture] || gesture
  }

  // Expose the addGestureCaption function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addGestureCaption = addGestureCaption
    }
  }, [participantName])

  const fetchExistingCaptions = async () => {
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
      console.error('Error fetching existing captions:', err)
    }
  }

  const startListening = async () => {
    console.log('Starting speech recognition...')
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      })
      
      console.log('Microphone access granted')
      streamRef.current = stream

      // Check if MediaRecorder supports the format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      console.log('Using mime type:', mimeType)

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          await processAudioChunk(audioBlob)
          audioChunksRef.current = []
        }
        
        // Continue recording if still listening
        if (isListening && mediaRecorderRef.current?.state === 'inactive') {
          setTimeout(() => {
            if (isListening && mediaRecorderRef.current) {
              mediaRecorderRef.current.start()
              // Stop after 3 seconds for processing
              setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                  mediaRecorderRef.current.stop()
                }
              }, 3000)
            }
          }, 100)
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsListening(true)
      setError('')

      // Stop after 3 seconds for first chunk
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 3000)

    } catch (err) {
      setError('Failed to access microphone. Please check permissions.')
      console.error('Error starting audio capture:', err)
    }
  }

  const stopListening = () => {
    setIsListening(false)
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const processAudioChunk = async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
      console.log('Audio chunk too small, skipping:', audioBlob.size)
      return
    }
    
    console.log('Processing audio chunk:', audioBlob.size, 'bytes')
    setIsProcessing(true)
    
    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1]
        console.log('Sending audio to API, size:', base64Audio.length)
        
        const response = await fetch('/api/captions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId,
            audioData: base64Audio,
            speakerId: 'local_participant',
            speakerName: participantName,
          }),
        })

        const result = await response.json()
        console.log('API Response:', result)

        if (response.ok) {
          const { text, confidence } = result
          
          if (text && text.trim().length > 0) {
            console.log('Adding caption:', text)
            const newCaption: Caption = {
              id: Date.now().toString(),
              speakerName: participantName,
              text: text.trim(),
              timestamp: new Date(),
              confidence,
            }
            
            setCaptions(prev => [...prev, newCaption])
          } else {
            console.log('No text returned from API')
          }
        } else {
          console.error('Caption processing error:', result.error)
          setError('Speech recognition failed: ' + result.error)
        }
      }
      
      reader.readAsDataURL(audioBlob)
    } catch (err) {
      console.error('Error processing audio chunk:', err)
      setError('Error processing audio: ' + err)
    } finally {
      setIsProcessing(false)
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
          <div>
            <h3 className="text-lg font-semibold">Live Captions</h3>
            <p className="text-green-400 text-sm mt-1">🎤 Powered by Deepgram Nova-2</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                const response = await fetch('/api/test-speech', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ meetingId }),
                })
                if (response.ok) {
                  fetchExistingCaptions()
                }
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
            >
              Test
            </button>
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
        </div>
        
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
        
        {isListening && (
          <div className="flex items-center mt-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <p className="text-green-400 text-sm">
              {isProcessing ? 'Processing speech...' : 'Listening for speech...'}
            </p>
          </div>
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
            <div key={caption.id} className={`rounded-lg p-3 ${
              caption.isGesture ? 'bg-purple-900/50 border border-purple-500' : 'bg-gray-700'
            }`}>
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
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
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
