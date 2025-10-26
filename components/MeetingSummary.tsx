'use client'

import { useEffect, useState } from 'react'
import { FileText, Clock, Users, CheckSquare, Lightbulb, RefreshCw } from 'lucide-react'

interface Summary {
  id: string
  content: string
  summaryType: string
  generatedAt: Date
}

interface MeetingSummaryProps {
  meetingId: string
}

export default function MeetingSummary({ meetingId }: MeetingSummaryProps) {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [activeSummaryType, setActiveSummaryType] = useState<string>('meeting')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')

  const summaryTypes = [
    { key: 'meeting', label: 'Meeting Summary', icon: FileText },
    { key: 'action_items', label: 'Action Items', icon: CheckSquare },
    { key: 'key_points', label: 'Key Points', icon: Lightbulb },
  ]

  useEffect(() => {
    fetchSummaries()
  }, [meetingId, activeSummaryType])

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
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate summary')
      }
    } catch (err) {
      console.error('Error generating summary:', err)
      setError('Failed to generate summary')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatSummaryContent = (content: string) => {
    // Split content into paragraphs and format lists
    const paragraphs = content.split('\n\n')
    return paragraphs.map((paragraph, index) => {
      if (paragraph.includes('•') || paragraph.includes('-') || paragraph.includes('*')) {
        // Format as list
        const items = paragraph.split(/[•\-*]/).filter(item => item.trim())
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-4">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm text-gray-300">
                {item.trim()}
              </li>
            ))}
          </ul>
        )
      } else {
        // Format as paragraph
        return (
          <p key={index} className="text-sm text-gray-300 mb-4 leading-relaxed">
            {paragraph}
          </p>
        )
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Meeting Summary</h3>
          <button
            onClick={generateSummary}
            disabled={isGenerating}
            className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Generate new summary"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
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
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeSummaryType === type.key
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}

        {isGenerating && (
          <p className="text-blue-400 text-sm mt-2">🤖 Generating summary...</p>
        )}
      </div>

      {/* Summaries List */}
      <div className="flex-1 overflow-y-auto p-4">
        {summaries.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No summaries yet.</p>
            <p className="text-sm mt-2">Click the refresh button to generate a summary.</p>
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
