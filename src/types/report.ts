export interface CodeAnalysisReport {
  storyId: string
  repo: string
  analyzedAt: string
  summary: string
  changedFiles: string[]
  riskLevel: 'low' | 'medium' | 'high'
  markdownContent: string
}

export interface QAPlan {
  storyId: string
  createdAt: string
  author: string
  markdownContent: string
  testCaseCount: number
  coverageAreas: string[]
}

export type TestCaseStatus = 'pass' | 'fail' | 'skip' | 'pending'

export interface TestCase {
  id: string
  name: string
  status: TestCaseStatus
  duration: number
  errorMessage?: string
}

export interface StoryAnalysis {
  storyId: string
  analyzedAt: string
  riskLevel: 'low' | 'medium' | 'high'
  changedFiles: string[]
  changeGuide: string
  qaChecklist: string
  coverageAreas: string[]
  testCaseCount: number
}

export interface TestResult {
  storyId: string
  runAt: string
  totalCases: number
  passed: number
  failed: number
  skipped: number
  duration: number
  testCases: TestCase[]
}
