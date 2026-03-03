import { Moon, Sun } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'
import { useSprintStore } from '@/stores/sprint-store'

export function Header() {
  const darkMode = useSettingsStore((s) => s.darkMode)
  const toggleDarkMode = useSettingsStore((s) => s.toggleDarkMode)
  const sprint = useSprintStore((s) => s.sprint)

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">
          {sprint?.name ?? 'QA Sprint Dashboard'}
        </h1>
        {sprint && (
          <p className="text-xs text-text-tertiary">
            {sprint.startDate} ~ {sprint.endDate}
          </p>
        )}
      </div>
      <button
        onClick={toggleDarkMode}
        className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  )
}
