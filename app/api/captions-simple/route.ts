import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'

export async function POST(request: NextRequest) {
  try {
    const { audioData, speakerName } = await request.json()

    if (!audioData) {
      return NextResponse.json(
        { error: 'Audio data is required' },
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

    console.log('Processing audio with Deepgram...')
    const deepgram = createClient(deepgramApiKey)

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audioData, 'base64')
    console.log('Audio buffer size:', audioBuffer.length)

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

    console.log('Deepgram result:', result)
    console.log('Deepgram error:', error)

    if (error) {
      console.error('Deepgram API error:', error)
      return NextResponse.json(
        { error: 'Deepgram processing failed', details: error },
        { status: 500 }
      )
    }

    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    console.log('Transcript:', transcript, 'Confidence:', confidence)

    // Return without saving to database for now
    return NextResponse.json({
      success: true,
      text: transcript,
      confidence,
      speakerName: speakerName || 'Speaker',
    })

  } catch (error) {
    console.error('Error in captions-simple:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process captions', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
