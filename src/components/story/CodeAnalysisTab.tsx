import type { CodeAnalysisReport } from '@/types/report'
import { Badge } from '@/components/ui/Badge'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { FileCode, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CodeAnalysisTabProps {
  report?: CodeAnalysisReport
}

const riskColors = {
  low: 'bg-success-50 text-success-600',
  medium: 'bg-warning-50 text-warning-600',
  high: 'bg-danger-50 text-danger-600',
}

export function CodeAnalysisTab({ report }: CodeAnalysisTabProps) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
        <FileCode className="mb-2 h-10 w-10" />
        <p className="text-sm">코드 분석 데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge className={cn(riskColors[report.riskLevel])}>
          <AlertTriangle className="mr-1 h-3 w-3" />
          Risk: {report.riskLevel}
        </Badge>
        <span className="text-xs text-text-tertiary">
          Analyzed: {new Date(report.analyzedAt).toLocaleString('ko-KR')}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-surface-secondary p-3">
        <p className="text-sm font-medium text-text-primary mb-2">Changed Files ({report.changedFiles.length})</p>
        <ul className="space-y-1">
          {report.changedFiles.map((file) => (
            <li key={file} className="flex items-center gap-2 text-xs text-text-secondary font-mono">
              <FileCode className="h-3.5 w-3.5 text-text-tertiary" />
              {file}
            </li>
          ))}
        </ul>
      </div>
      <MarkdownRenderer content={report.markdownContent} />
    </div>
  )
}
