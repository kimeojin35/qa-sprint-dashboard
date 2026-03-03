import { useSettingsStore } from '@/stores/settings-store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import type { RepoConfig } from '@/types/settings'

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

  const handleAddRepo = () => {
    if (newRepo.name.trim() && newRepo.url.trim()) {
      addRepo(newRepo)
      setNewRepo({ name: '', url: '', branch: 'main' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
