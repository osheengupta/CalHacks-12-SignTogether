import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { meetingId, audioData, speakerId, speakerName } = await request.json()

    if (!meetingId || !audioData) {
      return NextResponse.json(
        { error: 'Meeting ID and audio data are required' },
        { status: 400 }
      )
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      )
    }

    const deepgram = createClient(deepgramApiKey)

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64')

    console.log('Sending audio to Deepgram, size:', audioBuffer.length)
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        mimetype: 'audio/webm',
      }
    )
    
    console.log('Deepgram response:', { result, error })

    if (error) {
      throw error
    }

    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    // Save to database (optional - continue even if it fails)
    try {
      const savedTranscript = await prisma.transcript.create({
        data: {
          meetingId,
          speakerId,
          speakerName,
          text: transcript,
          confidence,
          language: 'en',
        },
      })

      return NextResponse.json({
        transcript: savedTranscript,
        text: transcript,
        confidence,
      })
    } catch (dbError) {
      console.error('Database save error (non-critical):', dbError)
      // Return transcript even if database save fails
      return NextResponse.json({
        text: transcript,
        confidence,
      })
    }
  } catch (error) {
    console.error('Error processing captions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process captions', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const transcripts = await prisma.transcript.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'asc' },
    })

    return NextResponse.json({ transcripts })
  } catch (error) {
    console.error('Error fetching captions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch captions' },
      { status: 500 }
    )
  }
}
