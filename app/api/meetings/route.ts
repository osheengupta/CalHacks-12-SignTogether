import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { roomName, title, description } = await request.json()

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    // Check if meeting already exists
    const existingMeeting = await prisma.meeting.findUnique({
      where: { roomName },
    })

    if (existingMeeting && existingMeeting.isActive) {
      return NextResponse.json({ meeting: existingMeeting })
    }

    // Create new meeting
    const meeting = await prisma.meeting.create({
      data: {
        roomName,
        title: title || `Meeting: ${roomName}`,
        description,
        isActive: true,
      },
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomName = searchParams.get('roomName')

    if (roomName) {
      const meeting = await prisma.meeting.findUnique({
        where: { roomName },
        include: {
          participants: true,
          transcripts: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
          gestures: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
          summaries: {
            orderBy: { generatedAt: 'desc' },
            take: 3,
          },
        },
      })

      if (!meeting) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ meeting })
    }

    // Get all active meetings
    const meetings = await prisma.meeting.findMany({
      where: { isActive: true },
      include: {
        participants: true,
        _count: {
          select: {
            transcripts: true,
            gestures: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { meetingId, isActive, endTime } = await request.json()

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        isActive: isActive ?? undefined,
        endTime: endTime ? new Date(endTime) : undefined,
      },
    })

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}
