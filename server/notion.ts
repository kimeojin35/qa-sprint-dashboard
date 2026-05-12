// --- Types ---

interface NotionPage {
  id: string
  url: string
  properties: Record<string, any>
}

interface QueryResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

interface StoryCategory {
  key: 'master' | 'planning' | 'dev' | 'qa' | 'unknown'
  label: string
}

interface TransformedStory {
  id: string
  title: string
  category: string
  categoryLabel: string
  status: string
  statusGroup: 'todo' | 'in_progress' | 'done'
  assignees: string[]
  deadline: { start: string; end: string | null } | null
  sprint: { id: string; name: string } | null
  featureType: string | null
  parentId: string | null
  children: TransformedStory[]
  notionUrl: string
}

interface TransformedSprint {
  id: string
  name: string
  startDate: string
  endDate: string | null
  status: string
}

// --- Helpers ---

const NOTION_API = 'https://api.notion.com/v1'

const CATEGORY_MAP: Record<string, StoryCategory> = {
  '마스터 스토리': { key: 'master', label: '마스터 스토리' },
  '기획 스토리': { key: 'planning', label: '기획 스토리' },
  '개발 스토리': { key: 'dev', label: '개발 스토리' },
  'QA 스토리': { key: 'qa', label: 'QA 스토리' },
}

const TODO_STATUSES = new Set(['미진행', '시작 전'])
const DONE_STATUSES = new Set(['완료', '보관'])

function getStatusGroup(status: string): 'todo' | 'in_progress' | 'done' {
  if (TODO_STATUSES.has(status)) return 'todo'
  if (DONE_STATUSES.has(status)) return 'done'
  return 'in_progress'
}

function extractTitle(page: NotionPage): string {
  const prop = page.properties['제목']
  if (prop?.type === 'title' && prop.title?.length > 0) {
    return prop.title.map((t: any) => t.plain_text).join('')
  }
  return '(제목 없음)'
}

function extractSelect(page: NotionPage, name: string): string | null {
  const prop = page.properties[name]
  if (prop?.type === 'select' && prop.select) {
    return prop.select.name
  }
  return null
}

function extractStatus(page: NotionPage): string {
  const prop = page.properties['상태']
  if (prop?.type === 'status' && prop.status) {
    return prop.status.name
  }
  return '미진행'
}

function extractPeople(page: NotionPage, name: string): string[] {
  const prop = page.properties[name]
  if (prop?.type === 'people') {
    return prop.people.map((p: any) => p.name || 'Unknown')
  }
  return []
}

function extractDate(
  page: NotionPage,
  name: string,
): { start: string; end: string | null } | null {
  const prop = page.properties[name]
  if (prop?.type === 'date' && prop.date) {
    return { start: prop.date.start, end: prop.date.end }
  }
  return null
}

function extractRelationIds(page: NotionPage, name: string): string[] {
  const prop = page.properties[name]
  if (prop?.type === 'relation') {
    return prop.relation.map((r: any) => r.id)
  }
  return []
}

// --- Main Service ---

export function createNotionService(apiKey: string) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  }

  async function queryDatabase(databaseId: string, filter?: object): Promise<NotionPage[]> {
    const pages: NotionPage[] = []
    let cursor: string | undefined = undefined

    do {
      const body: any = { page_size: 100 }
      if (filter) body.filter = filter
      if (cursor) body.start_cursor = cursor

      const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(`Notion API error ${res.status}: ${err.message || res.statusText}`)
      }

      const data: QueryResponse = await res.json()
      pages.push(...data.results)
      cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
    } while (cursor)

    return pages
  }

  async function fetchSprints(dbId: string): Promise<TransformedSprint[]> {
    const filter = {
      property: '스프린트 상태',
      status: { does_not_equal: '이전' },
    }

    const pages = await queryDatabase(dbId, filter)

    return pages.map((page) => {
      const titleProp = page.properties['스프린트 이름']
      let name = ''
      if (titleProp?.type === 'title') {
        name = titleProp.title.map((t: any) => t.plain_text).join('')
      }

      const dateProp = page.properties['날짜']
      let startDate = ''
      let endDate: string | null = null
      if (dateProp?.type === 'date' && dateProp.date) {
        startDate = dateProp.date.start
        endDate = dateProp.date.end
      }

      const statusProp = page.properties['스프린트 상태']
      let status = ''
      if (statusProp?.type === 'status' && statusProp.status) {
        status = statusProp.status.name
      }

      return { id: page.id, name, startDate, endDate, status }
    })
  }

  async function fetchActiveStories(
    storyDbId: string,
    sprintDbId: string,
  ): Promise<{ stories: TransformedStory[]; sprints: TransformedSprint[] }> {
    // Fetch sprints (graceful fallback if sprint DB not accessible)
    let sprints: TransformedSprint[] = []
    if (sprintDbId) {
      try {
        sprints = await fetchSprints(sprintDbId)
      } catch (err) {
        console.warn('Sprint DB 접근 실패 (스토리만 로드합니다):', (err as Error).message)
      }
    }
    const sprintMap = new Map(sprints.map((s) => [s.id, s]))

    // Fetch active stories (not 완료 or 보관)
    const filter = {
      and: [
        { property: '상태', status: { does_not_equal: '완료' } },
        { property: '상태', status: { does_not_equal: '보관' } },
      ],
    }

    const pages = await queryDatabase(storyDbId, filter)

    // Transform pages to stories
    const storiesMap = new Map<string, TransformedStory>()

    for (const page of pages) {
      const categoryName = extractSelect(page, '구분')
      const cat = categoryName ? CATEGORY_MAP[categoryName] : null

      const sprintIds = extractRelationIds(page, '스프린트')
      const sprintId = sprintIds[0] ?? null
      const sprintInfo = sprintId && sprintMap.has(sprintId)
        ? { id: sprintId, name: sprintMap.get(sprintId)!.name }
        : null

      const parentIds = extractRelationIds(page, '상위 작업')

      const story: TransformedStory = {
        id: page.id,
        title: extractTitle(page),
        category: cat?.key ?? 'unknown',
        categoryLabel: cat?.label ?? categoryName ?? '기타',
        status: extractStatus(page),
        statusGroup: getStatusGroup(extractStatus(page)),
        assignees: extractPeople(page, '담당자'),
        deadline: extractDate(page, '마감일'),
        sprint: sprintInfo,
        featureType: extractSelect(page, '기능 유형'),
        parentId: parentIds[0] ?? null,
        children: [],
        notionUrl: `https://www.notion.so/${page.id.replace(/-/g, '')}`,
      }

      storiesMap.set(page.id, story)
    }

    // Build hierarchy
    const rootStories: TransformedStory[] = []

    for (const story of storiesMap.values()) {
      if (story.parentId && storiesMap.has(story.parentId)) {
        storiesMap.get(story.parentId)!.children.push(story)
      } else {
        rootStories.push(story)
      }
    }

    // Sort children by category order: planning → dev → qa
    const categoryOrder: Record<string, number> = {
      planning: 0,
      dev: 1,
      qa: 2,
      master: -1,
      unknown: 3,
    }

    function sortChildren(stories: TransformedStory[]) {
      stories.sort((a, b) => {
        const orderA = categoryOrder[a.category] ?? 99
        const orderB = categoryOrder[b.category] ?? 99
        if (orderA !== orderB) return orderA - orderB
        return (a.deadline?.start ?? '').localeCompare(b.deadline?.start ?? '')
      })
      for (const s of stories) {
        if (s.children.length > 0) sortChildren(s.children)
      }
    }

    sortChildren(rootStories)

    return { stories: rootStories, sprints }
  }

  return { fetchActiveStories, fetchSprints }
}
