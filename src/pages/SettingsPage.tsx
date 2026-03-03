import { useSettingsStore } from '@/stores/settings-store'
import { useSprintStore } from '@/stores/sprint-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Trash2, Plus, Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { RepoConfig } from '@/types/settings'
import type { CsvParseResult } from '@/lib/csv-parser'

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

  const loadFromCsv = useSprintStore((s) => s.loadFromCsv)
  const sprint = useSprintStore((s) => s.sprint)

  const [newRepo, setNewRepo] = useState<RepoConfig>({ name: '', url: '', branch: 'main' })
  const [importResult, setImportResult] = useState<CsvParseResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddRepo = () => {
    if (newRepo.name.trim() && newRepo.url.trim()) {
      addRepo(newRepo)
      setNewRepo({ name: '', url: '', branch: 'main' })
    }
  }

  const handleCsvFile = (file: File) => {
    setImportError(null)
    setImportResult(null)

    if (!file.name.endsWith('.csv')) {
      setImportError('CSV 파일만 지원합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const result = loadFromCsv(text, sprintName)
        setImportResult(result)
      } catch (err) {
        setImportError(`파싱 실패: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.onerror = () => setImportError('파일을 읽을 수 없습니다.')
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleCsvFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleCsvFile(file)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* CSV Import */}
      <Card>
        <CardHeader>
          <CardTitle>Notion CSV Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Notion 데이터베이스에서 CSV로 내보낸 파일을 업로드하면 스토리를 자동으로 가져옵니다.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragOver
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border hover:border-primary-300'
            }`}
          >
            <Upload className="mb-3 h-8 w-8 text-text-tertiary" />
            <p className="mb-1 text-sm font-medium text-text-primary">
              CSV 파일을 드래그하거나 클릭하여 선택
            </p>
            <p className="mb-3 text-xs text-text-tertiary">
              Notion → Export → Markdown & CSV
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-4 w-4" />
              파일 선택
            </Button>
          </div>

          {/* Import Error */}
          {importError && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-600 dark:bg-red-900/30 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {importError}
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-3 rounded-lg border border-border bg-surface-secondary p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success-500" />
                <span className="text-sm font-medium text-text-primary">
                  {importResult.stories.length}개 스토리 임포트 완료
                </span>
                <span className="text-xs text-text-tertiary">
                  (전체 {importResult.totalRows}행)
                </span>
              </div>

              {importResult.unmappedColumns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">매핑되지 않은 컬럼:</p>
                  <div className="flex flex-wrap gap-1">
                    {importResult.unmappedColumns.map((col) => (
                      <Badge key={col} variant="outline" className="text-xs text-warning-600">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-1">
                    경고 ({importResult.warnings.length}):
                  </p>
                  <ul className="max-h-32 overflow-y-auto space-y-0.5">
                    {importResult.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-warning-600">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Current data info */}
          {sprint && (
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span>현재 데이터: {sprint.name} ({sprint.stories.length}개 스토리)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="sprint-name"
            label="Sprint Name"
            value={sprintName}
            onChange={(e) => setSprintName(e.target.value)}
            placeholder="Sprint 2026-W10"
          />
          <Input
            id="notion-url"
            label="Notion Database URL"
            value={notionDatabaseUrl}
            onChange={(e) => setNotionDatabaseUrl(e.target.value)}
            placeholder="https://www.notion.so/..."
          />
        </CardContent>
      </Card>

      {/* Repositories */}
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {repos.map((repo, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label={index === 0 ? 'Name' : undefined}
                  value={repo.name}
                  onChange={(e) => updateRepo(index, { ...repo, name: e.target.value })}
                  placeholder="repo-name"
                />
              </div>
              <div className="flex-[2]">
                <Input
                  label={index === 0 ? 'URL' : undefined}
                  value={repo.url}
                  onChange={(e) => updateRepo(index, { ...repo, url: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="w-28">
                <Input
                  label={index === 0 ? 'Branch' : undefined}
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
            <p className="mb-2 text-sm font-medium text-text-secondary">Add Repository</p>
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
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-text-secondary">
            Settings are saved to localStorage and persist across sessions.
          </p>
          <Button variant="danger" size="sm" onClick={() => {
            if (window.confirm('Reset all settings to defaults?')) {
              useSettingsStore.getState().resetSettings()
            }
          }}>
            Reset All Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
