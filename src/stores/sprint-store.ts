import { create } from 'zustand'
import type { Sprint, Story } from '@/types/sprint'
import type { CodeAnalysisReport, QAPlan, TestResult } from '@/types/report'
import { mockSprint } from '@/mocks/stories'
import { mockCodeAnalysis } from '@/mocks/code-analysis'
import { mockQAPlans } from '@/mocks/qa-plans'
import { mockTestResults } from '@/mocks/test-results'

interface SprintStore {
  sprint: Sprint | null
  codeAnalysis: Record<string, CodeAnalysisReport>
  qaPlans: Record<string, QAPlan>
  testResults: Record<string, TestResult>
  selectedStoryId: string | null
  setSelectedStoryId: (id: string | null) => void
  loadMockData: () => void
  getStory: (id: string) => Story | undefined
}

export const useSprintStore = create<SprintStore>((set, get) => ({
  sprint: null,
  codeAnalysis: {},
  qaPlans: {},
  testResults: {},
  selectedStoryId: null,
  setSelectedStoryId: (id) => set({ selectedStoryId: id }),
  loadMockData: () =>
    set({
      sprint: mockSprint,
      codeAnalysis: mockCodeAnalysis,
      qaPlans: mockQAPlans,
      testResults: mockTestResults,
    }),
  getStory: (id) => get().sprint?.stories.find((s) => s.id === id),
}))
