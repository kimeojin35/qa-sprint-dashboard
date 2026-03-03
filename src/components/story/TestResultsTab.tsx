import type { TestResult, TestCaseStatus } from '@/types/report'
import { CheckCircle2, XCircle, SkipForward, Clock, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/cn'

interface TestResultsTabProps {
  result?: TestResult
}

const statusConfig: Record<TestCaseStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pass: { icon: CheckCircle2, color: 'text-success-500', label: 'Pass' },
  fail: { icon: XCircle, color: 'text-danger-500', label: 'Fail' },
  skip: { icon: SkipForward, color: 'text-text-tertiary', label: 'Skip' },
  pending: { icon: Clock, color: 'text-warning-500', label: 'Pending' },
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function TestResultsTab({ result }: TestResultsTabProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
        <FlaskConical className="mb-2 h-10 w-10" />
        <p className="text-sm">테스트 결과가 없습니다</p>
      </div>
    )
  }

  const passRate = Math.round((result.passed / result.totalCases) * 100)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <StatBox label="Total" value={result.totalCases} color="text-text-primary" />
        <StatBox label="Passed" value={result.passed} color="text-success-500" />
        <StatBox label="Failed" value={result.failed} color="text-danger-500" />
        <StatBox label="Skipped" value={result.skipped} color="text-text-tertiary" />
        <StatBox label="Pass Rate" value={`${passRate}%`} color={passRate >= 80 ? 'text-success-500' : 'text-warning-500'} />
      </div>

      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span>Run: {new Date(result.runAt).toLocaleString('ko-KR')}</span>
        <span>Duration: {formatDuration(result.duration)}</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-tertiary">
              <th className="px-3 py-2 text-left font-medium text-text-secondary">Status</th>
              <th className="px-3 py-2 text-left font-medium text-text-secondary">Test Case</th>
              <th className="px-3 py-2 text-right font-medium text-text-secondary">Duration</th>
            </tr>
          </thead>
          <tbody>
            {result.testCases.map((tc) => {
              const config = statusConfig[tc.status]
              const Icon = config.icon
              return (
                <tr key={tc.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className={cn('flex items-center gap-1.5', config.color)}>
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{config.label}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-text-primary">{tc.name}</span>
                    {tc.errorMessage && (
                      <p className="mt-1 text-xs text-danger-500 bg-danger-50 rounded px-2 py-1 dark:bg-red-900/30">
                        {tc.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-text-tertiary font-mono text-xs">
                    {tc.duration > 0 ? formatDuration(tc.duration) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-3 text-center">
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </div>
  )
}
