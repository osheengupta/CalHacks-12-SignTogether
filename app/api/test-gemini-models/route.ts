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

    const genAI = new GoogleGenerativeAI(googleApiKey)
    
    // Try different model names
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision'
    ]
    
    const results = []
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Say hello')
        const response = await result.response
        const text = response.text()
        
        results.push({
          model: modelName,
          success: true,
          response: text
        })
      } catch (error) {
        results.push({
          model: modelName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      keyPrefix: googleApiKey.substring(0, 8) + '...',
      results
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test models',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
