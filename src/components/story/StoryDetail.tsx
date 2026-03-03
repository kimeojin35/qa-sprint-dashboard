import type { Story } from '@/types/sprint'
import { useSprintStore } from '@/stores/sprint-store'
import { Tabs } from '@/components/ui/Tabs'
import { CodeAnalysisTab } from './CodeAnalysisTab'
import { QAPlanTab } from './QAPlanTab'
import { TestResultsTab } from './TestResultsTab'

interface StoryDetailProps {
  story: Story
}

export function StoryDetail({ story }: StoryDetailProps) {
  const codeAnalysis = useSprintStore((s) => s.codeAnalysis[story.id])
  const qaPlan = useSprintStore((s) => s.qaPlans[story.id])
  const testResult = useSprintStore((s) => s.testResults[story.id])

  const tabs = [
    {
      id: 'code-analysis',
      label: 'Code Analysis',
      content: <CodeAnalysisTab report={codeAnalysis} />,
    },
    {
      id: 'qa-plan',
      label: 'QA Plan',
      content: <QAPlanTab plan={qaPlan} />,
      count: qaPlan?.testCaseCount,
    },
    {
      id: 'test-results',
      label: 'Test Results',
      content: <TestResultsTab result={testResult} />,
      count: testResult?.totalCases,
    },
  ]

  return (
    <div className="px-5 py-4">
      <p className="mb-4 text-sm text-text-secondary">{story.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {story.labels.map((label) => (
          <span
            key={label}
            className="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          >
            {label}
          </span>
        ))}
      </div>
      <Tabs tabs={tabs} />
    </div>
  )
}
