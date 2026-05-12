import { Card } from '@/components/ui/Card'
import { useSprintStore } from '@/stores/sprint-store'
import { GitBranch } from 'lucide-react'

export function RepoCard() {
  const sprint = useSprintStore((s) => s.sprint)
  const testResults = useSprintStore((s) => s.testResults)

  if (!sprint) return null

  const repoMap = new Map<string, { total: number; done: number; tested: number; passed: number }>()

  for (const story of sprint.stories) {
    const entry = repoMap.get(story.repo) ?? { total: 0, done: 0, tested: 0, passed: 0 }
    entry.total++
    if (story.status === 'done') entry.done++
    const result = testResults[story.id]
    if (result) {
      entry.tested++
      if (result.failed === 0) entry.passed++
    }
    repoMap.set(story.repo, entry)
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Repositories</h2>
      <div className="space-y-3">
        {[...repoMap.entries()].map(([repo, stats]) => (
          <div key={repo} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-text-primary">{repo}</p>
                <p className="text-xs text-text-tertiary">
                  {stats.total} {stats.total === 1 ? 'story' : 'stories'} | {stats.done} done
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary">
                Tests: {stats.tested}/{stats.total} {stats.total === 1 ? 'story' : 'stories'}
              </p>
              {stats.tested > 0 && (
                <p className="text-xs text-text-tertiary">
                  All pass: {stats.passed}/{stats.tested}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
