import Papa from 'papaparse'
import type { Story, StoryStatus, StoryPriority, StoryType } from '@/types/sprint'

type CsvRow = Record<string, string>

/** Notion 컬럼명 → Story 필드 매핑 (유연하게 여러 변형 지원) */
const COLUMN_MAP: Record<string, keyof Story> = {
  // id
  'id': 'id',
  'ID': 'id',
  'story id': 'id',
  '아이디': 'id',
  '스토리 ID': 'id',
  // title
  '이름': 'title',
  'name': 'title',
  'Name': 'title',
  'title': 'title',
  'Title': 'title',
  '제목': 'title',
  '스토리': 'title',
  '스토리명': 'title',
  // description
  'description': 'description',
  'Description': 'description',
  '설명': 'description',
  '내용': 'description',
  // status
  'status': 'status',
  'Status': 'status',
  '상태': 'status',
  '진행 상태': 'status',
  '진행상태': 'status',
  // priority
  'priority': 'priority',
  'Priority': 'priority',
  '우선순위': 'priority',
  // type
  'type': 'type',
  'Type': 'type',
  '유형': 'type',
  '타입': 'type',
  '구분': 'type',
  // assignee
  'assignee': 'assignee',
  'Assignee': 'assignee',
  '담당자': 'assignee',
  '담당': 'assignee',
  // repo
  'repo': 'repo',
  'Repo': 'repo',
  'repository': 'repo',
  'Repository': 'repo',
  '레포': 'repo',
  '저장소': 'repo',
  // storyPoints
  'story points': 'storyPoints',
  'Story Points': 'storyPoints',
  'SP': 'storyPoints',
  'sp': 'storyPoints',
  '스토리 포인트': 'storyPoints',
  '포인트': 'storyPoints',
  // labels
  'labels': 'labels',
  'Labels': 'labels',
  'tags': 'labels',
  'Tags': 'labels',
  '라벨': 'labels',
  '태그': 'labels',
}

const STATUS_MAP: Record<string, StoryStatus> = {
  'todo': 'todo',
  'to do': 'todo',
  'To Do': 'todo',
  '할 일': 'todo',
  '대기': 'todo',
  '시작 전': 'todo',
  'Not Started': 'todo',
  'not started': 'todo',
  'in progress': 'in-progress',
  'In Progress': 'in-progress',
  'in-progress': 'in-progress',
  '진행 중': 'in-progress',
  '진행중': 'in-progress',
  'in review': 'in-review',
  'In Review': 'in-review',
  'in-review': 'in-review',
  '리뷰 중': 'in-review',
  '리뷰중': 'in-review',
  'done': 'done',
  'Done': 'done',
  '완료': 'done',
  'blocked': 'blocked',
  'Blocked': 'blocked',
  '차단': 'blocked',
  '블로킹': 'blocked',
}

const PRIORITY_MAP: Record<string, StoryPriority> = {
  'critical': 'critical',
  'Critical': 'critical',
  '긴급': 'critical',
  '크리티컬': 'critical',
  'high': 'high',
  'High': 'high',
  '높음': 'high',
  '상': 'high',
  'medium': 'medium',
  'Medium': 'medium',
  '중간': 'medium',
  '보통': 'medium',
  '중': 'medium',
  'low': 'low',
  'Low': 'low',
  '낮음': 'low',
  '하': 'low',
}

const TYPE_MAP: Record<string, StoryType> = {
  'feature': 'feature',
  'Feature': 'feature',
  '기능': 'feature',
  '신규': 'feature',
  'bug': 'bug',
  'Bug': 'bug',
  '버그': 'bug',
  'improvement': 'improvement',
  'Improvement': 'improvement',
  '개선': 'improvement',
  'task': 'task',
  'Task': 'task',
  '작업': 'task',
  '태스크': 'task',
}

function resolveColumn(headers: string[]): Map<string, keyof Story> {
  const map = new Map<string, keyof Story>()
  for (const header of headers) {
    const trimmed = header.trim()
    if (COLUMN_MAP[trimmed]) {
      map.set(header, COLUMN_MAP[trimmed])
    }
  }
  return map
}

function parseLabels(value: string): string[] {
  if (!value) return []
  // Notion exports multi-select as comma-separated
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export interface CsvParseResult {
  stories: Story[]
  unmappedColumns: string[]
  totalRows: number
  warnings: string[]
}

export function parseNotionCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const headers = parsed.meta.fields ?? []
  const columnMap = resolveColumn(headers)
  const unmappedColumns = headers.filter((h) => !columnMap.has(h))
  const warnings: string[] = []
  const stories: Story[] = []

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i]
    const rowNum = i + 2 // 1-indexed + header row

    const getValue = (field: keyof Story): string => {
      for (const [header, mapped] of columnMap) {
        if (mapped === field) return (row[header] ?? '').trim()
      }
      return ''
    }

    const title = getValue('title')
    if (!title) {
      warnings.push(`Row ${rowNum}: title이 비어있어 건너뜁니다`)
      continue
    }

    const rawStatus = getValue('status')
    const rawPriority = getValue('priority')
    const rawType = getValue('type')

    const status = STATUS_MAP[rawStatus] ?? 'todo'
    const priority = PRIORITY_MAP[rawPriority] ?? 'medium'
    const type = TYPE_MAP[rawType] ?? 'task'

    if (rawStatus && !STATUS_MAP[rawStatus]) {
      warnings.push(`Row ${rowNum}: 상태 "${rawStatus}" 매핑 불가 → "todo" 사용`)
    }
    if (rawPriority && !PRIORITY_MAP[rawPriority]) {
      warnings.push(`Row ${rowNum}: 우선순위 "${rawPriority}" 매핑 불가 → "medium" 사용`)
    }

    const spRaw = getValue('storyPoints')
    const storyPoints = spRaw ? parseInt(spRaw, 10) || 0 : 0

    stories.push({
      id: getValue('id') || `CSV-${i + 1}`,
      title,
      description: getValue('description') || '',
      status,
      priority,
      type,
      assignee: getValue('assignee') || '',
      repo: getValue('repo') || '',
      storyPoints,
      labels: parseLabels(getValue('labels')),
      notionUrl: undefined,
      createdAt: today(),
      updatedAt: today(),
    })
  }

  return {
    stories,
    unmappedColumns,
    totalRows: parsed.data.length,
    warnings,
  }
}
