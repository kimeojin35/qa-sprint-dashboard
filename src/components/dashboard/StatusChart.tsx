import { Card } from '@/components/ui/Card'
import { useSprintStore } from '@/stores/sprint-store'
import type { StoryStatus } from '@/types/sprint'
import { STORY_STATUS_LABELS } from '@/types/sprint'

const statusBarColors: Record<StoryStatus, string> = {
  'done': 'bg-success-500',
  'in-review': 'bg-yellow-400',
  'in-progress': 'bg-primary-500',
  'todo': 'bg-gray-300 dark:bg-gray-600',
  'blocked': 'bg-danger-500',
}

const statusDotColors: Record<StoryStatus, string> = {
  'done': 'bg-success-500',
  'in-review': 'bg-yellow-400',
  'in-progress': 'bg-primary-500',
  'todo': 'bg-gray-300',
  'blocked': 'bg-danger-500',
}

export function StatusChart() {
  const sprint = useSprintStore((s) => s.sprint)

  if (!sprint) return null

  const total = sprint.stories.length
  const statusCounts: Record<StoryStatus, number> = {
    'todo': 0,
    'in-progress': 0,
    'in-review': 0,
    'done': 0,
    'blocked': 0,
  }

  for (const story of sprint.stories) {
    statusCounts[story.status]++
  }

  const orderedStatuses: StoryStatus[] = ['done', 'in-review', 'in-progress', 'todo', 'blocked']

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Status Distribution</h2>
      <div className="flex h-8 overflow-hidden rounded-full">
        {orderedStatuses.map((status) => {
          const count = statusCounts[status]
          if (count === 0) return null
          const pct = (count / total) * 100
          return (
            <div
              key={status}
              className={`${statusBarColors[status]} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${STORY_STATUS_LABELS[status]}: ${count}`}
            />
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {orderedStatuses.map((status) => {
          const count = statusCounts[status]
          return (
            <div key={status} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${statusDotColors[status]}`} />
              <span className="text-xs text-text-secondary">
                {STORY_STATUS_LABELS[status]}: {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
