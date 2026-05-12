import { useEffect, useMemo, useState } from 'react'
import { useNotionStore } from '@/stores/notion-store'
import { StoryTree } from '@/components/notion/StoryTree'
import { SprintInfo } from '@/components/notion/SprintInfo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { RefreshCw, Search, AlertTriangle, Loader2, Filter } from 'lucide-react'
import type { NotionStory, StoryCategory } from '@/types/notion'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/notion'
import { cn } from '@/lib/cn'

type StatusFilter = 'all' | 'in_progress' | 'todo'
type CategoryFilter = 'all' | StoryCategory

export function NotionPage() {
  const { stories, sprints, isLoading, error, lastSyncedAt, sync } = useNotionStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showMasterOnly, setShowMasterOnly] = useState(true)

  useEffect(() => {
    if (stories.length === 0 && !isLoading && !error) {
      sync()
    }
  }, [stories.length, isLoading, error, sync])

  // Collect stats
  const stats = useMemo(() => {
    function countAll(items: NotionStory[]): { total: number; byStatus: Record<string, number>; byCategory: Record<string, number> } {
      let total = 0
      const byStatus: Record<string, number> = {}
      const byCategory: Record<string, number> = {}

      function walk(story: NotionStory) {
        total++
        byStatus[story.status] = (byStatus[story.status] || 0) + 1
        byCategory[story.category] = (byCategory[story.category] || 0) + 1
        story.children.forEach(walk)
      }
      items.forEach(walk)
      return { total, byStatus, byCategory }
    }
    return countAll(stories)
  }, [stories])

  // Filter stories
  const filteredStories = useMemo(() => {
    function matchesFilter(story: NotionStory): boolean {
      if (search) {
        const q = search.toLowerCase()
        const titleMatch = story.title.toLowerCase().includes(q)
        const assigneeMatch = story.assignees.some((a) => a.toLowerCase().includes(q))
        if (!titleMatch && !assigneeMatch) return false
      }
      if (statusFilter !== 'all' && story.statusGroup !== statusFilter) return false
      if (categoryFilter !== 'all' && story.category !== categoryFilter) return false
      return true
    }

    function filterTree(items: NotionStory[]): NotionStory[] {
      return items
        .map((story) => {
          const filteredChildren = filterTree(story.children)
          const selfMatch = matchesFilter(story)

          if (selfMatch || filteredChildren.length > 0) {
            return { ...story, children: filteredChildren }
          }
          return null
        })
        .filter((s): s is NotionStory => s !== null)
    }

    let result = filterTree(stories)

    if (showMasterOnly) {
      result = result.filter((s) => s.category === 'master' || s.children.length > 0)
    }

    return result
  }, [stories, search, statusFilter, categoryFilter, showMasterOnly])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">스토리</h1>
          {lastSyncedAt && (
            <p className="text-xs text-text-tertiary">
              마지막 동기화: {new Date(lastSyncedAt).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={sync}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? '동기화 중...' : 'Notion 동기화'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-danger-50 p-3 text-sm text-danger-600 dark:bg-red-900/30 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">동기화 실패</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={sync}
            disabled={isLoading}
            className="text-danger-600 hover:text-danger-700 dark:text-red-300"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            재시도
          </Button>
        </div>
      )}

      {/* Sprint Info */}
      {sprints.length > 0 && <SprintInfo sprints={sprints} />}

      {/* Stats */}
      {stats.total > 0 && (
        <Card className="!p-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-text-tertiary">
              전체 <span className="font-bold text-text-primary">{stats.total}</span>개 스토리
            </span>
            <span className="text-text-tertiary">|</span>
            {Object.entries(stats.byStatus)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([status, count]) => (
                <span key={status} className="text-text-secondary">
                  {status}: <span className="font-semibold">{count}</span>
                </span>
              ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="제목 또는 담당자로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-text-tertiary" />
          {(['all', 'in_progress', 'todo'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-surface-secondary backdrop-blur-sm',
              )}
            >
              {f === 'all' ? '전체' : f === 'in_progress' ? '진행 중' : '시작 전'}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {(['all', 'master', 'dev', 'qa', 'planning'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-surface-secondary backdrop-blur-sm',
              )}
            >
              {cat === 'all' ? '전체' : (
                <Badge className={cn(CATEGORY_COLORS[cat], 'text-[10px]')}>
                  {CATEGORY_LABELS[cat]}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={showMasterOnly}
            onChange={(e) => setShowMasterOnly(e.target.checked)}
            className="rounded"
          />
          마스터 스토리만
        </label>
      </div>

      {/* Story count */}
      <p className="text-sm text-text-tertiary">
        {filteredStories.length}개 스토리
      </p>

      {/* Loading */}
      {isLoading && stories.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-3 text-sm text-text-tertiary">Notion에서 데이터를 가져오는 중...</span>
        </div>
      )}

      {/* Story Tree */}
      {filteredStories.length > 0 && (
        <StoryTree stories={filteredStories} />
      )}

      {/* Empty state */}
      {!isLoading && stories.length === 0 && !error && (
        <div className="py-16 text-center text-text-tertiary">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-tertiary">
            <AlertTriangle className="h-8 w-8 text-text-tertiary" />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-2">Notion 데이터가 없습니다</p>
          <p className="text-xs mb-4">
            아래 단계를 따라 Notion 연동을 설정하세요:
          </p>
          <div className="mx-auto max-w-md text-left space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">1</span>
              <span><a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Notion Integration</a>을 생성하고 API 키를 복사</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">2</span>
              <span><code className="bg-surface-tertiary px-1.5 py-0.5 rounded">.env</code> 파일에 API 키와 DB ID 입력</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">3</span>
              <span><code className="bg-surface-tertiary px-1.5 py-0.5 rounded">npm run server</code>로 API 서버 시작</span>
            </div>
          </div>
          <Button size="sm" onClick={sync} className="mt-6">
            <RefreshCw className="h-4 w-4" />
            동기화 시도
          </Button>
        </div>
      )}

      {!isLoading && filteredStories.length === 0 && stories.length > 0 && (
        <div className="py-12 text-center text-text-tertiary">
          <p className="text-sm">필터 조건에 맞는 스토리가 없습니다</p>
        </div>
      )}
    </div>
  )
}
