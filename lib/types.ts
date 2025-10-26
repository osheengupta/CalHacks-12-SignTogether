// Type definitions for SignTogether application

export interface Meeting {
  id: string
  roomName: string
  title?: string
  description?: string
  startTime: Date
  endTime?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Participant {
  id: string
  name: string
  meetingId: string
  joinTime: Date
  leaveTime?: Date
  isActive: boolean
  role: string
}

export interface Transcript {
  id: string
  meetingId: string
  speakerId?: string
  speakerName?: string
  text: string
  confidence?: number
  timestamp: Date
  language: string
  isProcessed: boolean
}

export interface Gesture {
  id: string
  meetingId: string
  userId?: string
  userName?: string
  gestureType: string
  confidence?: number
  timestamp: Date
  metadata?: string
}

export interface Summary {
  id: string
  meetingId: string
  content: string
  summaryType: string
  generatedAt: Date
  language: string
}

export interface Analytics {
  id: string
  meetingId?: string
  eventType: string
  value: number
  metadata?: string
  timestamp: Date
}

export type GestureType = 'yes' | 'no' | 'thank_you' | 'hello' | 'goodbye' | 'signing_detected' | 'none'

export type SummaryType = 'meeting' | 'action_items' | 'key_points'
