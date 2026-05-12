export type StoryCategory = 'master' | 'planning' | 'dev' | 'qa' | 'unknown'

export type NotionStatus =
  | '미진행'
  | '시작 전'
  | '진행 중'
  | '검토 중'
  | '거절'
  | '승인'
  | '완료'
  | '보관'

export interface NotionStory {
  id: string
  title: string
  category: StoryCategory
  categoryLabel: string
  status: NotionStatus
  statusGroup: 'todo' | 'in_progress' | 'done'
  assignees: string[]
  deadline: { start: string; end: string | null } | null
  sprint: { id: string; name: string } | null
  featureType: string | null
  parentId: string | null
  children: NotionStory[]
  notionUrl: string
  summary?: string
}

export interface NotionSprint {
  id: string
  name: string
  startDate: string
  endDate: string | null
  status: '현재' | '다음' | '이후' | '이전' | '마지막'
}

export interface NotionSyncResponse {
  sprints: NotionSprint[]
  stories: NotionStory[]
  syncedAt: string
}

export const CATEGORY_LABELS: Record<StoryCategory, string> = {
  master: '마스터 스토리',
  planning: '기획 스토리',
  dev: '개발 스토리',
  qa: 'QA 스토리',
  unknown: '기타',
}

export const CATEGORY_COLORS: Record<StoryCategory, string> = {
  master: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  planning: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  dev: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  qa: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export const NOTION_STATUS_COLORS: Record<NotionStatus, string> = {
  '미진행': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  '시작 전': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  '진행 중': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  '검토 중': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  '거절': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  '승인': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  '완료': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  '보관': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}
