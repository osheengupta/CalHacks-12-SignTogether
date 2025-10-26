import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    const googleApiKey = process.env.GOOGLE_API_KEY
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      )
    }

    console.log('Testing Gemini Vision with image...')
    const genAI = new GoogleGenerativeAI(googleApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
    Look at this image and tell me:
    1. Do you see a person?
    2. What are they doing with their hands?
    3. Are they making any gestures like waving, thumbs up, peace sign, etc?
    
    Respond in simple JSON format:
    {
      "person_detected": true/false,
      "hand_position": "description",
      "gesture": "wave/thumbs_up/peace/none/other",
      "confidence": 0.0-1.0
    }
    `

    const imagePart = {
      inlineData: {
        data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()
    
    console.log('Gemini Vision response:', text)

    let gestureData
    try {
      gestureData = JSON.parse(text)
    } catch {
      gestureData = {
        person_detected: true,
        hand_position: "Could not parse response",
        gesture: "none",
        confidence: 0,
        raw_response: text
      }
    }

    return NextResponse.json({
      success: true,
      ...gestureData,
      raw_response: text
    })

  } catch (error) {
    console.error('Error in gesture test:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test gesture detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
