import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { meetingId, imageData, userId, userName } = await request.json()

    if (!meetingId || !imageData) {
      return NextResponse.json(
        { error: 'Meeting ID and image data are required' },
        { status: 400 }
      )
    }

    const googleApiKey = process.env.GOOGLE_API_KEY
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(googleApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' })

    const prompt = `
    Analyze this image for sign language gestures and hand movements. Look for:
    1. Is someone actively signing or making hand gestures?
    2. Can you identify specific gestures like "yes", "no", "thank you", "hello", "goodbye", "wave", "thumbs_up", "peace"?
    3. What is the confidence level of your detection (be more generous with confidence for clear hand movements)?
    
    Respond ONLY in valid JSON format:
    {
      "signing_detected": boolean,
      "gesture_type": "yes|no|thank_you|hello|goodbye|wave|thumbs_up|peace|signing_detected|none",
      "confidence": number (0-1),
      "description": "brief description of what you see"
    }
    `

    const imagePart = {
      inlineData: {
        data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
        mimeType: 'image/jpeg',
      },
    }

    console.log('Sending image to Gemini Vision API...')
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()
    
    console.log('Gemini Vision raw response:', text)

    let gestureData
    try {
      // Clean the response text to extract JSON (remove markdown code blocks if present)
      let cleanText = text.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '')
      }
      
      gestureData = JSON.parse(cleanText)
      console.log('Parsed gesture data:', gestureData)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      // Fallback if JSON parsing fails
      gestureData = {
        signing_detected: false,
        gesture_type: 'none',
        confidence: 0,
        description: 'Failed to parse response: ' + text,
      }
    }

    // Save to database if gesture detected
    if (gestureData.signing_detected && gestureData.confidence > 0.3) {
      try {
        const savedGesture = await prisma.gesture.create({
          data: {
            meetingId,
            userId,
            userName,
            gestureType: gestureData.gesture_type,
            confidence: gestureData.confidence,
            metadata: JSON.stringify({
              description: gestureData.description,
            }),
          },
        })

        return NextResponse.json({
          gesture: savedGesture,
          detected: true,
          ...gestureData,
        })
      } catch (dbError) {
        console.error('Database save error (non-critical):', dbError)
        // Return gesture data even if database save fails
        return NextResponse.json({
          detected: true,
          ...gestureData,
        })
      }
    }

    return NextResponse.json({
      detected: false,
      ...gestureData,
    })
  } catch (error) {
    console.error('Error processing gestures:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process gestures',
        details: error instanceof Error ? error.message : 'Unknown error',
        detected: false,
        gesture_type: 'error',
        confidence: 0
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

    const gestures = await prisma.gesture.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'desc' },
      take: 50, // Limit to recent gestures
    })

    return NextResponse.json({ gestures })
  } catch (error) {
    console.error('Error fetching gestures:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gestures' },
      { status: 500 }
    )
  }
}
