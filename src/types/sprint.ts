export type StoryStatus = 'todo' | 'in-progress' | 'in-review' | 'done' | 'blocked'
export type StoryPriority = 'critical' | 'high' | 'medium' | 'low'
export type StoryType = 'feature' | 'bug' | 'improvement' | 'task'

export interface Story {
  id: string
  title: string
  description: string
  status: StoryStatus
  priority: StoryPriority
  type: StoryType
  assignee: string
  repo: string
  notionUrl?: string
  storyPoints: number
  labels: string[]
  createdAt: string
  updatedAt: string
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  goal: string
  stories: Story[]
}

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  'done': 'Done',
  'blocked': 'Blocked',
}

export const STORY_STATUS_COLORS: Record<StoryStatus, string> = {
  'todo': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'in-progress': 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  'in-review': 'bg-warning-50 text-warning-600 dark:bg-yellow-900 dark:text-yellow-300',
  'done': 'bg-success-50 text-success-600 dark:bg-green-900 dark:text-green-300',
  'blocked': 'bg-danger-50 text-danger-600 dark:bg-red-900 dark:text-red-300',
}

export const STORY_PRIORITY_COLORS: Record<StoryPriority, string> = {
  'critical': 'bg-danger-500 text-white',
  'high': 'bg-orange-500 text-white',
  'medium': 'bg-warning-500 text-white',
  'low': 'bg-gray-400 text-white',
}

export const STORY_TYPE_ICONS: Record<StoryType, string> = {
  'feature': '✨',
  'bug': '🐛',
  'improvement': '🔧',
  'task': '📋',
}
