import { useSettingsStore } from '@/stores/settings-store'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Trash2, Plus, AlertTriangle, CheckCircle2, Loader2, Link2, Github, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import type { RepoConfig } from '@/types/settings'
import { getIntegrations, saveIntegrations, testNotionConnection, testGithubConnection } from '@/lib/api'

export function SettingsPage() {
  const {
    notionDatabaseUrl,
    setNotionDatabaseUrl,
    sprintName,
    setSprintName,
    repos,
    addRepo,
    removeRepo,
    updateRepo,
  } = useSettingsStore()

  const [newRepo, setNewRepo] = useState<RepoConfig>({ name: '', url: '', branch: 'main' })
  const [notionExpanded, setNotionExpanded] = useState(false)
  const [githubExpanded, setGithubExpanded] = useState(false)

  // Integration state
  const [notionApiKey, setNotionApiKey] = useState('')
  const [notionStoryDbId, setNotionStoryDbId] = useState('')
  const [notionSprintDbId, setNotionSprintDbId] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showNotionKey, setShowNotionKey] = useState(false)
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [notionTestResult, setNotionTestResult] = useState<{ connected: boolean; message: string } | null>(null)
  const [githubTestResult, setGithubTestResult] = useState<{ connected: boolean; message: string } | null>(null)
  const [savingNotion, setSavingNotion] = useState(false)
  const [savingGithub, setSavingGithub] = useState(false)
  const [testingNotion, setTestingNotion] = useState(false)
  const [testingGithub, setTestingGithub] = useState(false)
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)

  const loadIntegrationSettings = useCallback(async () => {
    try {
      const data = await getIntegrations()
      setNotionApiKey(data.notionApiKey)
      setNotionStoryDbId(data.notionStoryDbId)
      setNotionSprintDbId(data.notionSprintDbId)
      setGithubToken(data.githubToken)
      setIntegrationsLoaded(true)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadIntegrationSettings()
  }, [loadIntegrationSettings])

  const handleAddRepo = () => {
    if (newRepo.name.trim() && newRepo.url.trim()) {
      addRepo(newRepo)
      setNewRepo({ name: '', url: '', branch: 'main' })
    }
  }

  const handleSaveNotion = async () => {
    setSavingNotion(true)
    setNotionTestResult(null)
    try {
      await saveIntegrations({ notionApiKey, notionStoryDbId, notionSprintDbId })
      await loadIntegrationSettings()
    } catch (err) {
      setNotionTestResult({ connected: false, message: `저장 실패: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSavingNotion(false)
    }
  }

  const handleTestNotion = async () => {
    setTestingNotion(true)
    setNotionTestResult(null)
    try {
      const result = await testNotionConnection()
      setNotionTestResult(result)
    } catch (err) {
      setNotionTestResult({ connected: false, message: err instanceof Error ? err.message : String(err) })
    } finally {
      setTestingNotion(false)
    }
  }

  const handleSaveGithub = async () => {
    setSavingGithub(true)
    setGithubTestResult(null)
    try {
      await saveIntegrations({ githubToken })
      await loadIntegrationSettings()
    } catch (err) {
      setGithubTestResult({ connected: false, message: `저장 실패: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSavingGithub(false)
    }
  }

  const handleTestGithub = async () => {
    setTestingGithub(true)
    setGithubTestResult(null)
    try {
      const result = await testGithubConnection()
      setGithubTestResult(result)
    } catch (err) {
      setGithubTestResult({ connected: false, message: err instanceof Error ? err.message : String(err) })
    } finally {
      setTestingGithub(false)
    }
  }

  const notionConnected = integrationsLoaded && !!notionApiKey && !!notionStoryDbId
  const githubConnected = integrationsLoaded && !!githubToken

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Integrations */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">연동</h2>
        <div className="space-y-3">
          {/* Notion */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-md">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text-primary">Notion</h3>
                  {notionConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-medium text-success-600 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      연결됨
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary">스토리와 스프린트를 자동으로 동기화</p>
              </div>
              <Button
                variant={notionExpanded ? 'ghost' : notionConnected ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setNotionExpanded(!notionExpanded)}
              >
                {notionExpanded ? '닫기' : notionConnected ? '관리' : '연결'}
              </Button>
            </div>

            {notionExpanded && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {!notionConnected && (
                  <div className="rounded-xl bg-surface-secondary p-4">
                    <p className="mb-3 text-xs font-semibold text-text-secondary">연결 방법</p>
                    <ol className="space-y-2.5">
                      <li className="flex items-start gap-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">1</span>
                        <span className="text-text-secondary pt-0.5">
                          <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline font-medium">
                            Notion Integration 생성
                            <ExternalLink className="ml-1 inline h-3 w-3" />
                          </a>
                          {' '}후 API 키를 복사
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">2</span>
                        <span className="text-text-secondary pt-0.5">Notion에서 스토리/스프린트 DB를 Integration에 공유</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">3</span>
                        <span className="text-text-secondary pt-0.5">아래에 API 키와 DB ID를 입력하고 저장</span>
                      </li>
                    </ol>
                  </div>
                )}
                <div className="relative">
                  <Input
                    id="notion-api-key"
                    label="API Key"
                    type={showNotionKey ? 'text' : 'password'}
                    value={notionApiKey}
                    onChange={(e) => setNotionApiKey(e.target.value)}
                    placeholder="ntn_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowNotionKey(!showNotionKey)}
                    className="absolute right-3 top-[34px] text-text-tertiary hover:text-text-primary"
                  >
                    {showNotionKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  id="notion-story-db"
                  label="스토리 DB ID"
                  value={notionStoryDbId}
                  onChange={(e) => setNotionStoryDbId(e.target.value)}
                  placeholder="b6906a5bcd344a2faff870a31b41b518"
                  disabled={!integrationsLoaded}
                />
                <Input
                  id="notion-sprint-db"
                  label="스프린트 DB ID (선택)"
                  value={notionSprintDbId}
                  onChange={(e) => setNotionSprintDbId(e.target.value)}
                  placeholder="1bb0f49c38d6818d890fd8bdee376102"
                  disabled={!integrationsLoaded}
                />
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={handleSaveNotion} disabled={savingNotion}>
                    {savingNotion && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    저장
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleTestNotion} disabled={testingNotion}>
                    {testingNotion && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    연결 테스트
                  </Button>
                </div>
                {notionTestResult && (
                  <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    notionTestResult.connected
                      ? 'bg-success-50 text-success-600 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-danger-50 text-danger-600 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {notionTestResult.connected
                      ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                      : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    {notionTestResult.message}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* GitHub */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-black shadow-md dark:from-gray-600 dark:to-gray-800">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text-primary">GitHub</h3>
                  {githubConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-medium text-success-600 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      연결됨
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary">레포지토리 정보를 연동</p>
              </div>
              <Button
                variant={githubExpanded ? 'ghost' : githubConnected ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setGithubExpanded(!githubExpanded)}
              >
                {githubExpanded ? '닫기' : githubConnected ? '관리' : '연결'}
              </Button>
            </div>

            {githubExpanded && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {!githubConnected && (
                  <div className="rounded-xl bg-surface-secondary p-4">
                    <p className="mb-3 text-xs font-semibold text-text-secondary">연결 방법</p>
                    <ol className="space-y-2.5">
                      <li className="flex items-start gap-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">1</span>
                        <span className="text-text-secondary pt-0.5">
                          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline font-medium">
                            Personal Access Token 생성
                            <ExternalLink className="ml-1 inline h-3 w-3" />
                          </a>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">2</span>
                        <span className="text-text-secondary pt-0.5">아래에 토큰을 입력하고 저장</span>
                      </li>
                    </ol>
                  </div>
                )}
                <div className="relative">
                  <Input
                    id="github-token"
                    label="Personal Access Token"
                    type={showGithubToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... 또는 github_pat_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute right-3 top-[34px] text-text-tertiary hover:text-text-primary"
                  >
                    {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={handleSaveGithub} disabled={savingGithub}>
                    {savingGithub && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    저장
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleTestGithub} disabled={testingGithub}>
                    {testingGithub && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    연결 테스트
                  </Button>
                </div>
                {githubTestResult && (
                  <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    githubTestResult.connected
                      ? 'bg-success-50 text-success-600 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-danger-50 text-danger-600 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {githubTestResult.connected
                      ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                      : <AlertTriangle className="h-4 w-4 shrink-0" />}
                    {githubTestResult.message}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* General */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">일반</h2>
        <Card>
          <div className="space-y-4">
            <Input
              id="sprint-name"
              label="스프린트 이름"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              placeholder="Sprint 2026-W10"
            />
            <Input
              id="notion-url"
              label="Notion 데이터베이스 URL"
              value={notionDatabaseUrl}
              onChange={(e) => setNotionDatabaseUrl(e.target.value)}
              placeholder="https://www.notion.so/..."
            />
          </div>
        </Card>
      </section>

      {/* Repositories */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">레포지토리</h2>
        <Card>
          <div className="space-y-4">
            {repos.map((repo, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label={index === 0 ? '이름' : undefined}
                    value={repo.name}
                    onChange={(e) => updateRepo(index, { ...repo, name: e.target.value })}
                    placeholder="repo-name"
                  />
                </div>
                <div className="flex-[2]">
                  <Input
                    label={index === 0 ? 'URL 주소' : undefined}
                    value={repo.url}
                    onChange={(e) => updateRepo(index, { ...repo, url: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="w-28">
                  <Input
                    label={index === 0 ? '브랜치' : undefined}
                    value={repo.branch}
                    onChange={(e) => updateRepo(index, { ...repo, branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeRepo(repo.name)}>
                  <Trash2 className="h-4 w-4 text-danger-500" />
                </Button>
              </div>
            ))}

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium text-text-secondary">레포지토리 추가</p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    value={newRepo.name}
                    onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                    placeholder="repo-name"
                  />
                </div>
                <div className="flex-[2]">
                  <Input
                    value={newRepo.url}
                    onChange={(e) => setNewRepo({ ...newRepo, url: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="w-28">
                  <Input
                    value={newRepo.branch}
                    onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
                <Button size="sm" onClick={handleAddRepo}>
                  <Plus className="h-4 w-4" />
                  추가
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Data */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">데이터</h2>
        <Card>
          <p className="mb-3 text-sm text-text-secondary">
            설정은 localStorage에 저장되며 세션 간 유지됩니다.
          </p>
          <Button variant="danger" size="sm" onClick={() => {
            if (window.confirm('모든 설정을 초기화하시겠습니까?')) {
              useSettingsStore.getState().resetSettings()
            }
          }}>
            전체 설정 초기화
          </Button>
        </Card>
      </section>
    </div>
  )
}
