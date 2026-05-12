import type { NotionSprint } from '@/types/notion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SprintInfoProps {
  sprints: NotionSprint[]
}

const SPRINT_STATUS_COLORS: Record<string, string> = {
  '현재': 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  '다음': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  '마지막': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  '이후': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function SprintInfo({ sprints }: SprintInfoProps) {
  if (sprints.length === 0) return null

  const sorted = [...sprints].sort((a, b) => {
    const order: Record<string, number> = { '현재': 0, '다음': 1, '마지막': 2, '이후': 3 }
    return (order[a.status] ?? 99) - (order[b.status] ?? 99)
  })

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((sprint) => (
        <Card key={sprint.id} className={cn(
          sprint.status === '현재' && 'ring-2 ring-primary-500/30',
        )}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={cn(
                'h-4 w-4',
                sprint.status === '현재' ? 'text-primary-500' : 'text-text-tertiary',
              )} />
              <span className="text-sm font-semibold text-text-primary">
                {sprint.name}
              </span>
            </div>
            <Badge className={cn(SPRINT_STATUS_COLORS[sprint.status] ?? 'bg-gray-100 text-gray-600', 'text-[10px]')}>
              {sprint.status}
            </Badge>
          </div>
          {sprint.startDate && (
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <Calendar className="h-3 w-3" />
              {sprint.startDate}
              {sprint.endDate && ` ~ ${sprint.endDate}`}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
