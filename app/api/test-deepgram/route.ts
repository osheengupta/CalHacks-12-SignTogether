import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    
    if (!deepgramApiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key not found in environment' },
        { status: 500 }
      )
    }

    // Test if we can reach Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
      },
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Deepgram API key is working!',
        keyPrefix: deepgramApiKey.substring(0, 8) + '...'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Deepgram API key is invalid',
        status: response.status
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test Deepgram API', details: error },
      { status: 500 }
    )
  }
}
