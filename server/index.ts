import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { dirname, join, relative, extname } from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'
import { createNotionService } from './notion.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

// Integration settings (persisted to file, fallback to .env)
const INTEGRATIONS_PATH = join(__dirname, 'integrations.json')

interface IntegrationSettings {
  notionApiKey: string
  notionStoryDbId: string
  notionSprintDbId: string
  githubToken: string
}

function loadIntegrations(): IntegrationSettings {
  const defaults: IntegrationSettings = {
    notionApiKey: process.env.NOTION_API_KEY || '',
    notionStoryDbId: process.env.NOTION_STORY_DB_ID || '',
    notionSprintDbId: process.env.NOTION_SPRINT_DB_ID || '',
    githubToken: process.env.GITHUB_TOKEN || '',
  }
  try {
    if (existsSync(INTEGRATIONS_PATH)) {
      const saved = JSON.parse(readFileSync(INTEGRATIONS_PATH, 'utf-8'))
      return { ...defaults, ...saved }
    }
  } catch { /* use defaults */ }
  return defaults
}

function saveIntegrations(settings: Partial<IntegrationSettings>) {
  const current = loadIntegrations()
  const merged = { ...current, ...settings }
  writeFileSync(INTEGRATIONS_PATH, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

function maskKey(key: string): string {
  if (!key || key.length <= 8) return key ? '****' : ''
  return key.slice(0, 4) + '****' + key.slice(-4)
}

let integrations = loadIntegrations()

// Notion service (recreated when settings change)
let notionService = integrations.notionApiKey
  ? createNotionService(integrations.notionApiKey)
  : null

function getNotionApiKey() { return integrations.notionApiKey }
function getStoryDbId() { return integrations.notionStoryDbId }
function getSprintDbId() { return integrations.notionSprintDbId }
function getGithubToken() { return integrations.githubToken }

// Load cache as fallback
function loadCache() {
  try {
    const raw = readFileSync(join(__dirname, 'notion-cache.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// GET /api/notion/sync - Fetch all active data from Notion
app.get('/api/notion/sync', async (_req, res) => {
  if (!notionService || !getStoryDbId()) {
    const cache = loadCache()
    if (cache) {
      res.json({ ...cache, syncedAt: new Date().toISOString(), cached: true })
    } else {
      res.status(503).json({ error: 'Notion 연동이 설정되지 않았습니다. 설정 페이지에서 API 키와 DB ID를 입력하세요.' })
    }
    return
  }

  try {
    const { stories, sprints } = await notionService.fetchActiveStories(getStoryDbId(), getSprintDbId())
    res.json({
      sprints,
      stories,
      syncedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.warn('Notion API 실패, 캐시 사용:', (error as Error).message)
    const cache = loadCache()
    if (cache) {
      res.json({ ...cache, syncedAt: new Date().toISOString(), cached: true })
    } else {
      res.status(500).json({
        error: 'Notion 동기화 실패',
        message: error.message || String(error),
      })
    }
  }
})

// GET /api/notion/status - Check connection status
app.get('/api/notion/status', async (_req, res) => {
  if (!notionService || !getStoryDbId()) {
    const cache = loadCache()
    res.json({ connected: !!cache, currentSprint: null, sprintCount: 0, cached: !!cache })
    return
  }

  try {
    if (getSprintDbId()) {
      const sprints = await notionService.fetchSprints(getSprintDbId())
      const currentSprint = sprints.find((s) => s.status === '현재')
      res.json({
        connected: true,
        currentSprint: currentSprint?.name ?? null,
        sprintCount: sprints.length,
      })
    } else {
      await notionService.fetchActiveStories(getStoryDbId(), '')
      res.json({ connected: true, currentSprint: null, sprintCount: 0 })
    }
  } catch {
    const cache = loadCache()
    res.json({
      connected: !!cache,
      currentSprint: null,
      sprintCount: 0,
      cached: !!cache,
    })
  }
})

// POST /api/chat - AI chat with sprint context (Google Gemini)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
let genai: GoogleGenAI | null = null

if (GEMINI_API_KEY) {
  genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  console.log('Gemini API configured')
}

app.post('/api/chat', async (req, res) => {
  if (!genai) {
    res.status(503).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 키를 추가하세요.' })
    return
  }

  const { message, context } = req.body

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message 필드가 필요합니다.' })
    return
  }

  try {
    const systemPrompt = `당신은 QA 스프린트 대시보드의 AI 어시스턴트입니다.
스프린트 진행 상황, 스토리 상태, 테스트 결과 등에 대해 한국어로 답변합니다.
간결하고 유용한 답변을 제공하세요. 마크다운 형식을 사용할 수 있습니다.

현재 스프린트 데이터:
${context || '데이터가 로드되지 않았습니다.'}`

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
      },
    })

    const text = response.text ?? ''

    res.json({ reply: text })
  } catch (error: any) {
    console.error('Chat error:', error)
    const status = error?.status || 500
    let userMessage = 'AI 응답 생성에 실패했습니다.'

    if (status === 401 || status === 403) {
      userMessage = 'API 키가 유효하지 않습니다. .env 파일의 GEMINI_API_KEY를 확인하세요.'
    } else if (status === 429) {
      userMessage = '요청이 너무 많습니다. 잠시 후 다시 시도하세요.'
    }

    res.status(status).json({
      error: userMessage,
    })
  }
})

// POST /api/analyze-story - AI 기반 코드 분석 + QA 체크리스트 생성
const PROJECT_ROOT = join(__dirname, '..')
const SCAN_DIRS = ['server', 'src/components', 'src/pages', 'src/lib', 'src/types', 'src/stores']
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vite', '.claude'])
const MAX_FILE_SIZE = 10000 // bytes

function scanProjectFiles(rootDir: string, dirs: string[]): { tree: string; fileContents: string } {
  const allFiles: string[] = []

  function walkDir(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (SKIP_DIRS.has(entry.name)) continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          walkDir(fullPath)
        } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
          allFiles.push(fullPath)
        }
      }
    } catch { /* ignore unreadable dirs */ }
  }

  for (const dir of dirs) {
    walkDir(join(rootDir, dir))
  }

  const tree = allFiles.map((f) => relative(rootDir, f)).join('\n')

  const fileContents = allFiles
    .filter((f) => {
      try { return statSync(f).size <= MAX_FILE_SIZE } catch { return false }
    })
    .map((f) => {
      const rel = relative(rootDir, f)
      const content = readFileSync(f, 'utf-8')
      return `--- ${rel} ---\n${content}`
    })
    .join('\n\n')

  return { tree, fileContents }
}

app.post('/api/analyze-story', async (req, res) => {
  if (!genai) {
    res.status(503).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' })
    return
  }

  const { title, summary, featureType, category } = req.body
  if (!title) {
    res.status(400).json({ error: 'title 필드가 필요합니다.' })
    return
  }

  try {
    const { tree, fileContents } = scanProjectFiles(PROJECT_ROOT, SCAN_DIRS)

    const systemPrompt = `당신은 숙련된 QA 엔지니어 겸 풀스택 개발자입니다.
프로젝트의 코드 구조를 분석하여, 주어진 스토리(기능 요구사항)를 구현하기 위한 **변경 가이드**와 **QA 테스트 체크리스트**를 생성합니다.

반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 설명 없이 순수 JSON만 출력하세요.

{
  "riskLevel": "low" | "medium" | "high",
  "changedFiles": ["수정이 필요한 파일 경로 목록"],
  "changeGuide": "## 변경 가이드\\n\\n수정 대상 파일별 변경 내용을 마크다운으로 작성",
  "qaChecklist": "## QA 테스트 체크리스트\\n\\n- [ ] 테스트 항목 1\\n- [ ] 테스트 항목 2\\n...",
  "coverageAreas": ["테스트 커버리지 영역"],
  "testCaseCount": 0
}

가이드라인:
- changeGuide: 각 수정 파일별로 무엇을 변경해야 하는지 구체적으로 설명 (코드 스니펫 포함)
- qaChecklist: 기능/UI/API/에러처리/엣지케이스별 체크리스트 (마크다운 체크박스 형식)
- riskLevel: 변경 범위와 복잡도에 따라 판단
- testCaseCount: qaChecklist 항목 수
- 한국어로 작성`

    const userMessage = `## 프로젝트 파일 구조
${tree}

## 주요 파일 내용
${fileContents}

## 분석 대상 스토리
- 제목: ${title}
- 설명: ${summary || '없음'}
- 기능유형: ${featureType || '미지정'}
- 구분: ${category || '미지정'}

위 프로젝트 코드를 분석하고, 이 스토리를 구현하기 위한 변경 가이드와 QA 테스트 체크리스트를 JSON으로 생성하세요.`

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 4096,
      },
    })

    const text = response.text ?? ''

    // JSON 파싱 (코드블록 감싸기 대응)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ error: 'AI 응답에서 JSON을 파싱할 수 없습니다.' })
      return
    }

    const analysis = JSON.parse(jsonMatch[0])

    res.json({
      storyId: '',
      analyzedAt: new Date().toISOString(),
      riskLevel: analysis.riskLevel || 'medium',
      changedFiles: analysis.changedFiles || [],
      changeGuide: analysis.changeGuide || '',
      qaChecklist: analysis.qaChecklist || '',
      coverageAreas: analysis.coverageAreas || [],
      testCaseCount: analysis.testCaseCount || 0,
    })
  } catch (error: any) {
    console.error('Analyze story error:', error)
    res.status(500).json({
      error: '스토리 분석에 실패했습니다.',
      message: error.message || String(error),
    })
  }
})

// GET /api/settings/integrations - Return masked integration settings
app.get('/api/settings/integrations', (_req, res) => {
  const settings = loadIntegrations()
  res.json({
    notionApiKey: maskKey(settings.notionApiKey),
    notionStoryDbId: settings.notionStoryDbId,
    notionSprintDbId: settings.notionSprintDbId,
    githubToken: maskKey(settings.githubToken),
  })
})

// POST /api/settings/integrations - Save integration settings
app.post('/api/settings/integrations', (req, res) => {
  const updates: Partial<IntegrationSettings> = {}
  const { notionApiKey, notionStoryDbId, notionSprintDbId, githubToken } = req.body

  if (notionApiKey !== undefined) updates.notionApiKey = notionApiKey
  if (notionStoryDbId !== undefined) updates.notionStoryDbId = notionStoryDbId
  if (notionSprintDbId !== undefined) updates.notionSprintDbId = notionSprintDbId
  if (githubToken !== undefined) updates.githubToken = githubToken

  integrations = saveIntegrations(updates)

  // Recreate Notion service if key changed
  if (updates.notionApiKey !== undefined) {
    notionService = integrations.notionApiKey
      ? createNotionService(integrations.notionApiKey)
      : null
    console.log('Notion service reconfigured')
  }

  res.json({ ok: true })
})

// POST /api/settings/test-notion - Test Notion connection
app.post('/api/settings/test-notion', async (_req, res) => {
  if (!notionService) {
    res.json({ connected: false, message: 'Notion API 키가 설정되지 않았습니다.' })
    return
  }
  if (!getStoryDbId()) {
    res.json({ connected: false, message: '스토리 DB ID가 설정되지 않았습니다.' })
    return
  }

  try {
    const { stories, sprints } = await notionService.fetchActiveStories(getStoryDbId(), getSprintDbId())
    res.json({
      connected: true,
      message: `연결 성공! 스토리 ${stories.length}개, 스프린트 ${sprints.length}개 발견`,
    })
  } catch (error: any) {
    res.json({
      connected: false,
      message: `연결 실패: ${error.message || String(error)}`,
    })
  }
})

// POST /api/settings/test-github - Test GitHub connection
app.post('/api/settings/test-github', async (_req, res) => {
  const token = getGithubToken()
  if (!token) {
    res.json({ connected: false, message: 'GitHub 토큰이 설정되지 않았습니다.' })
    return
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({})) as Record<string, unknown>
      res.json({ connected: false, message: `인증 실패: ${(data.message as string) || response.statusText}` })
      return
    }
    const user = await response.json() as Record<string, unknown>
    res.json({ connected: true, message: `연결 성공! 사용자: ${user.login}` })
  } catch (error: any) {
    res.json({ connected: false, message: `연결 실패: ${error.message || String(error)}` })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`Story DB: ${getStoryDbId() || '(not set)'}`)
  console.log(`Sprint DB: ${getSprintDbId() || '(not set)'}`)
  console.log(`Notion: ${notionService ? 'configured' : 'not configured'}`)
  console.log(`GitHub: ${getGithubToken() ? 'configured' : 'not configured'}`)
})
