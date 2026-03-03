import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useSprintStore } from '@/stores/sprint-store'
import { Target, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export function SprintSummaryCard() {
  const sprint = useSprintStore((s) => s.sprint)

  if (!sprint) return null

  const total = sprint.stories.length
  const done = sprint.stories.filter((s) => s.status === 'done').length
  const inProgress = sprint.stories.filter((s) => s.status === 'in-progress' || s.status === 'in-review').length
  const blocked = sprint.stories.filter((s) => s.status === 'blocked').length
  const totalPoints = sprint.stories.reduce((sum, s) => sum + s.storyPoints, 0)
  const donePoints = sprint.stories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.storyPoints, 0)

  const stats = [
    { label: 'Total Stories', value: total, icon: Target, color: 'text-primary-500' },
    { label: 'Completed', value: done, icon: CheckCircle2, color: 'text-success-500' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-warning-500' },
    { label: 'Blocked', value: blocked, icon: AlertCircle, color: 'text-danger-500' },
  ]

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Sprint Summary</h2>
        <p className="text-sm text-text-tertiary">{sprint.goal}</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="rounded-lg bg-surface-tertiary p-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-tertiary">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Story Points Progress</span>
          <span>{donePoints} / {totalPoints} SP</span>
        </div>
        <ProgressBar value={donePoints} max={totalPoints} showLabel color="bg-success-500" />
      </div>
    </Card>
  )
}
