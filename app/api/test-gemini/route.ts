import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET(request: NextRequest) {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY
    
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key not found in environment' },
        { status: 500 }
      )
    }

    // Test if we can initialize Gemini
    const genAI = new GoogleGenerativeAI(googleApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Simple test prompt
    const result = await model.generateContent('Say "Hello from Gemini!"')
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      message: 'Google Gemini API is working!',
      testResponse: text,
      keyPrefix: googleApiKey.substring(0, 8) + '...'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Google Gemini API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
