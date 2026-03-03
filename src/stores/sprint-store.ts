import { create } from 'zustand'
import type { Sprint, Story } from '@/types/sprint'
import type { CodeAnalysisReport, QAPlan, TestResult } from '@/types/report'
import { mockSprint } from '@/mocks/stories'
import { mockCodeAnalysis } from '@/mocks/code-analysis'
import { mockQAPlans } from '@/mocks/qa-plans'
import { mockTestResults } from '@/mocks/test-results'
import { parseNotionCsv, type CsvParseResult } from '@/lib/csv-parser'

interface SprintStore {
  sprint: Sprint | null
  codeAnalysis: Record<string, CodeAnalysisReport>
  qaPlans: Record<string, QAPlan>
  testResults: Record<string, TestResult>
  selectedStoryId: string | null
  lastCsvImport: CsvParseResult | null
  setSelectedStoryId: (id: string | null) => void
  loadMockData: () => void
  loadFromCsv: (csvText: string, sprintName?: string) => CsvParseResult
  getStory: (id: string) => Story | undefined
}

export const useSprintStore = create<SprintStore>((set, get) => ({
  sprint: null,
  codeAnalysis: {},
  qaPlans: {},
  testResults: {},
  selectedStoryId: null,
  lastCsvImport: null,
  setSelectedStoryId: (id) => set({ selectedStoryId: id }),
  loadMockData: () =>
    set({
      sprint: mockSprint,
      codeAnalysis: mockCodeAnalysis,
      qaPlans: mockQAPlans,
      testResults: mockTestResults,
    }),
  loadFromCsv: (csvText, sprintName) => {
    const result = parseNotionCsv(csvText)
    const now = new Date().toISOString().slice(0, 10)
    set({
      sprint: {
        id: `csv-import-${Date.now()}`,
        name: sprintName || 'Imported Sprint',
        startDate: now,
        endDate: now,
        goal: `Notion CSV에서 ${result.stories.length}개 스토리 임포트`,
        stories: result.stories,
      },
      lastCsvImport: result,
    })
    return result
  },
  getStory: (id) => get().sprint?.stories.find((s) => s.id === id),
}))
