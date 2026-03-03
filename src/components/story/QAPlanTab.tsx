import type { QAPlan } from '@/types/report'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { ClipboardList } from 'lucide-react'

interface QAPlanTabProps {
  plan?: QAPlan
}

export function QAPlanTab({ plan }: QAPlanTabProps) {
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
        <ClipboardList className="mb-2 h-10 w-10" />
        <p className="text-sm">QA 계획이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-text-tertiary">
        <span>Author: {plan.author}</span>
        <span>Created: {new Date(plan.createdAt).toLocaleString('ko-KR')}</span>
        <span>Test Cases: {plan.testCaseCount}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {plan.coverageAreas.map((area) => (
          <span
            key={area}
            className="rounded-md bg-success-50 px-2 py-0.5 text-xs text-success-600 dark:bg-green-900/30 dark:text-green-300"
          >
            {area}
          </span>
        ))}
      </div>
      <MarkdownRenderer content={plan.markdownContent} />
    </div>
  )
}
