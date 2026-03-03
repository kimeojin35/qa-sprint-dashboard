import { useState, useMemo } from 'react'
import { useSprintStore } from '@/stores/sprint-store'
import { StoryCard } from '@/components/story/StoryCard'
import { StoryDetail } from '@/components/story/StoryDetail'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { StoryStatus } from '@/types/sprint'
import { STORY_STATUS_LABELS, STORY_STATUS_COLORS } from '@/types/sprint'
import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

const allStatuses: StoryStatus[] = ['todo', 'in-progress', 'in-review', 'done', 'blocked']

export function StoriesPage() {
  const sprint = useSprintStore((s) => s.sprint)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StoryStatus | 'all'>('all')

  const filteredStories = useMemo(() => {
    if (!sprint) return []
    return sprint.stories.filter((story) => {
      const matchSearch =
        search === '' ||
        story.title.toLowerCase().includes(search.toLowerCase()) ||
        story.id.toLowerCase().includes(search.toLowerCase()) ||
        story.assignee.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || story.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [sprint, search, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search stories by title, ID, or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              statusFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/80',
            )}
          >
            All
          </button>
          {allStatuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/80',
              )}
            >
              <Badge className={cn(STORY_STATUS_COLORS[status], 'text-[10px]')}>
                {STORY_STATUS_LABELS[status]}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-text-tertiary">
        {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
        {statusFilter !== 'all' && ` (${STORY_STATUS_LABELS[statusFilter]})`}
      </p>

      <div className="space-y-2">
        {filteredStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            isExpanded={expandedId === story.id}
            onToggle={() => setExpandedId(expandedId === story.id ? null : story.id)}
          >
            <StoryDetail story={story} />
          </StoryCard>
        ))}
      </div>

      {filteredStories.length === 0 && (
        <div className="py-12 text-center text-text-tertiary">
          <p className="text-sm">No stories found</p>
        </div>
      )}
    </div>
  )
}
