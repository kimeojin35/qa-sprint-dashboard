import { SprintSummaryCard } from '@/components/dashboard/SprintSummaryCard'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { RepoCard } from '@/components/dashboard/RepoCard'
import { useSprintStore } from '@/stores/sprint-store'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, XCircle, Clock, SkipForward } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const sprint = useSprintStore((s) => s.sprint)
  const testResults = useSprintStore((s) => s.testResults)
  const navigate = useNavigate()

  const totalTests = Object.values(testResults).reduce((sum, r) => sum + r.totalCases, 0)
  const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0)
  const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0)
  const totalSkipped = Object.values(testResults).reduce((sum, r) => sum + r.skipped, 0)

  return (
    <div className="space-y-6">
      <SprintSummaryCard />
      <div className="grid grid-cols-2 gap-6">
        <StatusChart />
        <RepoCard />
      </div>
      {sprint && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">테스트 현황</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Clock className="h-8 w-8 text-primary-500" />
              <div>
                <p className="text-2xl font-bold text-text-primary">{totalTests}</p>
                <p className="text-xs text-text-tertiary">전체 케이스</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <CheckCircle2 className="h-8 w-8 text-success-500" />
              <div>
                <p className="text-2xl font-bold text-success-500">{totalPassed}</p>
                <p className="text-xs text-text-tertiary">성공</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <XCircle className="h-8 w-8 text-danger-500" />
              <div>
                <p className="text-2xl font-bold text-danger-500">{totalFailed}</p>
                <p className="text-xs text-text-tertiary">실패</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <SkipForward className="h-8 w-8 text-warning-500" />
              <div>
                <p className="text-2xl font-bold text-warning-500">{totalSkipped}</p>
                <p className="text-xs text-text-tertiary">스킵</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
