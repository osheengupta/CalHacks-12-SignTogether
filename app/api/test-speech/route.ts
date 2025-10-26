import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { meetingId } = await request.json()

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      )
    }

    // First ensure the meeting exists
    let meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      // Create the meeting if it doesn't exist
      meeting = await prisma.meeting.create({
        data: {
          id: meetingId,
          roomName: `room_${meetingId}`,
          title: 'Test Meeting',
          isActive: true,
        },
      })
    }

    // Create a test transcript
    const testTranscript = await prisma.transcript.create({
      data: {
        meetingId,
        speakerId: 'test_user',
        speakerName: 'Test User',
        text: 'This is a test transcript from Deepgram API integration. The system is working!',
        confidence: 0.95,
        language: 'en',
      },
    })

    return NextResponse.json({
      success: true,
      transcript: testTranscript,
      text: testTranscript.text,
      confidence: testTranscript.confidence,
    })
  } catch (error) {
    console.error('Error creating test transcript:', error)
    return NextResponse.json(
      { error: 'Failed to create test transcript', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
