import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { meetingId, summaryType = 'meeting' } = await request.json()

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Fetch all transcripts for the meeting
    const transcripts = await prisma.transcript.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'asc' },
    })

    if (transcripts.length === 0) {
      return NextResponse.json(
        { error: 'No transcripts found for this meeting' },
        { status: 404 }
      )
    }

    // Fetch gestures for context
    const gestures = await prisma.gesture.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'asc' },
    })

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    })

    // Combine transcripts into a conversation
    const conversation = transcripts
      .map((t) => `${t.speakerName || 'Speaker'}: ${t.text}`)
      .join('\n')

    const gestureContext = gestures.length > 0 
      ? `\n\nSign language gestures detected during the meeting:\n${gestures
          .map((g) => `- ${g.gestureType} (confidence: ${g.confidence?.toFixed(2)})`)
          .join('\n')}`
      : ''

    let prompt = ''
    switch (summaryType) {
      case 'meeting':
        prompt = `Please provide a comprehensive meeting summary of the following conversation. Include key discussion points, decisions made, and important topics covered. This meeting included both deaf and hearing participants, so be mindful of accessibility aspects.${gestureContext}\n\nConversation:\n${conversation}`
        break
      case 'action_items':
        prompt = `Extract and list all action items, tasks, and follow-ups mentioned in this meeting conversation. Format as a clear list with responsible parties if mentioned.${gestureContext}\n\nConversation:\n${conversation}`
        break
      case 'key_points':
        prompt = `Identify and summarize the key points, main topics, and important insights from this meeting conversation. Focus on the most significant information discussed.${gestureContext}\n\nConversation:\n${conversation}`
        break
      default:
        prompt = `Summarize this meeting conversation, highlighting the main points and outcomes.${gestureContext}\n\nConversation:\n${conversation}`
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const summaryContent = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save summary to database
    const savedSummary = await prisma.summary.create({
      data: {
        meetingId,
        content: summaryContent,
        summaryType,
        language: 'en',
      },
    })

    return NextResponse.json({
      summary: savedSummary,
      content: summaryContent,
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')
    const summaryType = searchParams.get('type') || 'meeting'

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const summaries = await prisma.summary.findMany({
      where: { 
        meetingId,
        summaryType,
      },
      orderBy: { generatedAt: 'desc' },
    })

    return NextResponse.json({ summaries })
  } catch (error) {
    console.error('Error fetching summaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    )
  }
}
