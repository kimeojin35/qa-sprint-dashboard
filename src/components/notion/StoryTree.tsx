import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, User, Calendar, Tag, Sparkles, Search, Loader2 } from 'lucide-react'
import type { NotionStory } from '@/types/notion'
import { CATEGORY_COLORS, NOTION_STATUS_COLORS } from '@/types/notion'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { CodeAnalysisTab } from '@/components/story/CodeAnalysisTab'
import { QAPlanTab } from '@/components/story/QAPlanTab'
import { cn } from '@/lib/cn'
import { useChatStore } from '@/stores/chat-store'
import { useAnalysisStore } from '@/stores/analysis-store'

interface StoryTreeProps {
  stories: NotionStory[]
  level?: number
}

export function StoryTree({ stories, level = 0 }: StoryTreeProps) {
  return (
    <div className={cn(level > 0 && 'ml-6 border-l border-border pl-4')}>
      {stories.map((story) => (
        <StoryTreeNode key={story.id} story={story} level={level} />
      ))}
    </div>
  )
}

const FEATURE_TYPE_COLORS: Record<string, string> = {
  '신규': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  '개선': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  '버그': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  '기술부채': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function StoryTreeNode({ story, level }: { story: NotionStory; level: number }) {
  const [expanded, setExpanded] = useState(level === 0)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const hasChildren = story.children.length > 0
  const hasSummary = !!story.summary
  const askAboutStory = useChatStore((s) => s.askAboutStory)
  const setOpen = useChatStore((s) => s.setOpen)
  const analysis = useAnalysisStore((s) => s.analyses[story.id])
  const isAnalyzing = useAnalysisStore((s) => s.loadingIds.has(story.id))
  const analysisError = useAnalysisStore((s) => s.errors[story.id])
  const analyze = useAnalysisStore((s) => s.analyze)

  const handleAskAI = () => {
    setOpen(true)
    askAboutStory({
      id: story.id.slice(0, 8),
      title: story.title,
      description: story.summary || '',
      status: story.statusGroup === 'todo' ? 'todo' : story.statusGroup === 'done' ? 'done' : 'in-progress',
      priority: 'medium',
      type: story.featureType === '버그' ? 'bug' : 'feature',
      assignee: story.assignees[0] || '',
      storyPoints: 0,
      repo: '',
      labels: [story.categoryLabel],
    })
  }

  const handleAnalyze = async () => {
    setShowAnalysis(true)
    setExpanded(true)
    if (!analysis) {
      await analyze(story.id, {
        title: story.title,
        summary: story.summary || '',
        featureType: story.featureType || '',
        category: story.categoryLabel,
      })
    }
  }

  return (
    <div className="mb-1.5">
      <div
        className={cn(
          'group rounded-lg transition-colors',
          level === 0
            ? 'bg-surface border border-border backdrop-blur-xl'
            : 'hover:bg-surface-secondary',
        )}
      >
        {/* Main row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Expand/collapse */}
          {(hasChildren || hasSummary) ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 text-text-tertiary hover:text-text-primary"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Category badge */}
          <Badge className={cn(CATEGORY_COLORS[story.category], 'text-[10px] shrink-0')}>
            {story.categoryLabel}
          </Badge>

          {/* Title */}
          <span className={cn(
            'flex-1 text-sm truncate',
            level === 0 ? 'font-semibold text-text-primary' : 'text-text-primary',
          )}>
            {story.title}
          </span>

          {/* Feature type */}
          {story.featureType && (
            <Badge className={cn(FEATURE_TYPE_COLORS[story.featureType] || 'bg-gray-100 text-gray-600', 'text-[10px] shrink-0')}>
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {story.featureType}
            </Badge>
          )}

          {/* Status */}
          <Badge className={cn(NOTION_STATUS_COLORS[story.status], 'text-[10px] shrink-0')}>
            {story.status}
          </Badge>

          {/* Deadline */}
          {story.deadline && (
            <span className="flex items-center gap-1 text-[11px] text-text-tertiary shrink-0">
              <Calendar className="h-3 w-3" />
              {story.deadline.start}
              {story.deadline.end && ` ~ ${story.deadline.end}`}
            </span>
          )}

          {/* Assignees */}
          {story.assignees.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary shrink-0 max-w-[120px] truncate">
              <User className="h-3 w-3 shrink-0" />
              {story.assignees.join(', ')}
            </span>
          )}

          {/* Analyze button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAnalyze()
            }}
            disabled={isAnalyzing}
            className={cn(
              'shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all',
              analysis
                ? 'bg-success-50 text-success-600 hover:bg-success-100 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50',
              isAnalyzing && 'opacity-100',
            )}
            title="코드 분석 + QA 체크리스트"
          >
            {isAnalyzing ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <Search className="h-2.5 w-2.5" />
            )}
            분석
          </button>

          {/* AI button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAskAI()
            }}
            className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 transition-all"
            title="AI에게 질문"
          >
            <Sparkles className="h-2.5 w-2.5" />
            AI
          </button>

          {/* Notion link */}
          <a
            href={story.notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-primary-500"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Summary */}
        {expanded && hasSummary && (
          <div className="px-3 pb-2.5 pl-9">
            <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary rounded-lg px-3 py-2">
              {story.summary}
            </p>
          </div>
        )}

        {/* Analysis panel */}
        {expanded && showAnalysis && (
          <div className="px-3 pb-3 pl-9">
            {isAnalyzing && (
              <div className="flex items-center gap-2 py-8 justify-center text-text-tertiary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">코드 분석 중...</span>
              </div>
            )}
            {analysisError && (
              <div className="rounded-lg bg-danger-50 dark:bg-red-900/20 p-3 text-sm text-danger-600 dark:text-red-300">
                분석 실패: {analysisError}
              </div>
            )}
            {analysis && (
              <Tabs
                tabs={[
                  {
                    id: 'change-guide',
                    label: '변경 가이드',
                    count: analysis.changedFiles.length,
                    content: (
                      <CodeAnalysisTab
                        report={{
                          storyId: story.id,
                          repo: '',
                          analyzedAt: analysis.analyzedAt,
                          summary: '',
                          changedFiles: analysis.changedFiles,
                          riskLevel: analysis.riskLevel,
                          markdownContent: analysis.changeGuide,
                        }}
                      />
                    ),
                  },
                  {
                    id: 'qa-checklist',
                    label: 'QA 체크리스트',
                    count: analysis.testCaseCount,
                    content: (
                      <QAPlanTab
                        plan={{
                          storyId: story.id,
                          createdAt: analysis.analyzedAt,
                          author: 'AI',
                          markdownContent: analysis.qaChecklist,
                          testCaseCount: analysis.testCaseCount,
                          coverageAreas: analysis.coverageAreas,
                        }}
                      />
                    ),
                  },
                ]}
              />
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <StoryTree stories={story.children} level={level + 1} />
      )}
    </div>
  )
}
