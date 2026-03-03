import { ChevronDown, ChevronRight, User } from 'lucide-react'
import type { Story } from '@/types/sprint'
import { STORY_STATUS_LABELS, STORY_STATUS_COLORS, STORY_PRIORITY_COLORS, STORY_TYPE_ICONS } from '@/types/sprint'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

interface StoryCardProps {
  story: Story
  isExpanded: boolean
  onToggle: () => void
  children?: React.ReactNode
}

export function StoryCard({ story, isExpanded, onToggle, children }: StoryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-surface-secondary transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
        )}
        <span className="text-sm text-text-tertiary font-mono shrink-0">{story.id}</span>
        <span className="mr-1">{STORY_TYPE_ICONS[story.type]}</span>
        <span className="flex-1 text-sm font-medium text-text-primary truncate">
          {story.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn(STORY_PRIORITY_COLORS[story.priority], 'text-[10px]')}>
            {story.priority}
          </Badge>
          <Badge className={cn(STORY_STATUS_COLORS[story.status])}>
            {STORY_STATUS_LABELS[story.status]}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-text-tertiary">
            <User className="h-3.5 w-3.5" />
            {story.assignee}
          </span>
          <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
            {story.storyPoints} SP
          </span>
        </div>
      </button>
      {isExpanded && <div className="border-t border-border">{children}</div>}
    </div>
  )
}
