'use client'

import { useEffect, useState } from 'react'
import { FileText, Clock, Users, CheckSquare, Lightbulb, RefreshCw, Loader2 } from 'lucide-react'

interface Summary {
  id: string
  content: string
  summaryType: string
  generatedAt: Date
}

interface RealMeetingSummaryProps {
  meetingId: string
}

export default function RealMeetingSummary({ meetingId }: RealMeetingSummaryProps) {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [activeSummaryType, setActiveSummaryType] = useState<string>('meeting')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [transcriptCount, setTranscriptCount] = useState(0)

  const summaryTypes = [
    { key: 'meeting', label: 'Summary', icon: FileText },
    { key: 'action_items', label: 'Actions', icon: CheckSquare },
    { key: 'key_points', label: 'Key Points', icon: Lightbulb },
  ]

  useEffect(() => {
    fetchSummaries()
    checkTranscriptCount()
  }, [meetingId, activeSummaryType])

  const checkTranscriptCount = async () => {
    try {
      const response = await fetch(`/api/captions?meetingId=${meetingId}`)
      if (response.ok) {
        const { transcripts } = await response.json()
        setTranscriptCount(transcripts.length)
      }
    } catch (err) {
      console.error('Error checking transcript count:', err)
    }
  }

  const fetchSummaries = async () => {
    try {
      const response = await fetch(`/api/summary?meetingId=${meetingId}&type=${activeSummaryType}`)
      if (response.ok) {
        const { summaries: fetchedSummaries } = await response.json()
        const formattedSummaries = fetchedSummaries.map((s: any) => ({
          id: s.id,
          content: s.content,
          summaryType: s.summaryType,
          generatedAt: new Date(s.generatedAt),
        }))
        setSummaries(formattedSummaries)
      }
    } catch (err) {
      console.error('Error fetching summaries:', err)
      setError('Failed to fetch summaries')
    }
  }

  const generateSummary = async () => {
    if (transcriptCount === 0) {
      setError('No transcripts available yet. Start speaking to generate captions first.')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          summaryType: activeSummaryType,
        }),
      })

      if (response.ok) {
        const { summary } = await response.json()
        const newSummary: Summary = {
          id: summary.id,
          content: summary.content,
          summaryType: summary.summaryType,
          generatedAt: new Date(summary.generatedAt),
        }
        setSummaries(prev => [newSummary, ...prev])
        
        // Refresh transcript count
        checkTranscriptCount()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate summary')
      }
    } catch (err) {
      console.error('Error generating summary:', err)
      setError('Failed to generate summary. Please check your API configuration.')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatSummaryContent = (content: string) => {
    // Handle different content formats
    if (content.includes('•') || content.includes('-') || content.includes('*')) {
      // Format as list
      const lines = content.split('\n')
      const items: string[] = []
      let currentItem = ''
      
      lines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed.match(/^[•\-*]\s/)) {
          if (currentItem) items.push(currentItem)
          currentItem = trimmed.replace(/^[•\-*]\s/, '')
        } else if (trimmed && currentItem) {
          currentItem += ' ' + trimmed
        } else if (trimmed && !currentItem) {
          items.push(trimmed)
        }
      })
      if (currentItem) items.push(currentItem)
      
      return (
        <ul className="list-disc list-inside space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm text-gray-300 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )
    } else {
      // Format as paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim())
      return paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm text-gray-300 mb-3 leading-relaxed">
          {paragraph.trim()}
        </p>
      ))
    }
  }

  const getSummaryTypeDescription = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Comprehensive overview of the meeting discussion'
      case 'action_items':
        return 'Tasks and follow-ups mentioned in the meeting'
      case 'key_points':
        return 'Main topics and important insights discussed'
      default:
        return 'AI-generated meeting insights'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Meeting Summary</h3>
            <p className="text-green-400 text-sm">🤖 Powered by Claude 3.5 Sonnet</p>
          </div>
          <button
            onClick={generateSummary}
            disabled={isGenerating || transcriptCount === 0}
            className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Generate new summary"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Summary Type Tabs */}
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          {summaryTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.key}
                onClick={() => setActiveSummaryType(type.key)}
                className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeSummaryType === type.key
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{type.label}</span>
              </button>
            )
          })}
        </div>

        {/* Status Messages */}
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}

        {isGenerating && (
          <p className="text-blue-400 text-sm mt-2 flex items-center">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Generating {summaryTypes.find(t => t.key === activeSummaryType)?.label.toLowerCase()}...
          </p>
        )}

        {transcriptCount === 0 && (
          <p className="text-yellow-400 text-sm mt-2">
            💬 Start speaking to generate captions, then create summaries
          </p>
        )}

        {transcriptCount > 0 && (
          <p className="text-gray-400 text-sm mt-2">
            📝 {transcriptCount} transcript{transcriptCount !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Summaries List */}
      <div className="flex-1 overflow-y-auto p-4">
        {summaries.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No summaries yet</p>
            <p className="text-sm mt-2">
              {transcriptCount === 0 
                ? "Start speaking to generate captions first"
                : "Click the refresh button to generate a summary"
              }
            </p>
            <p className="text-xs mt-2 text-gray-500">
              {getSummaryTypeDescription(activeSummaryType)}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div key={summary.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const type = summaryTypes.find(t => t.key === summary.summaryType)
                      const Icon = type?.icon || FileText
                      return <Icon className="h-4 w-4 text-green-400" />
                    })()}
                    <span className="text-sm font-medium text-green-300">
                      {summaryTypes.find(t => t.key === summary.summaryType)?.label || 'Summary'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{summary.generatedAt.toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  {formatSummaryContent(summary.content)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
