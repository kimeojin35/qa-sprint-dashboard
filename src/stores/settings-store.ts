import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, RepoConfig } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

interface SettingsStore extends AppSettings {
  setNotionDatabaseUrl: (url: string) => void
  setSprintName: (name: string) => void
  setDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void
  addRepo: (repo: RepoConfig) => void
  removeRepo: (name: string) => void
  updateRepo: (index: number, repo: RepoConfig) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setNotionDatabaseUrl: (url) => set({ notionDatabaseUrl: url }),
      setSprintName: (name) => set({ sprintName: name }),
      setDarkMode: (dark) => {
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ darkMode: dark })
      },
      toggleDarkMode: () =>
        set((state) => {
          const next = !state.darkMode
          if (next) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { darkMode: next }
        }),
      addRepo: (repo) => set((state) => ({ repos: [...state.repos, repo] })),
      removeRepo: (name) =>
        set((state) => ({ repos: state.repos.filter((r) => r.name !== name) })),
      updateRepo: (index, repo) =>
        set((state) => {
          const repos = [...state.repos]
          repos[index] = repo
          return { repos }
        }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'qa-dashboard-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      },
    },
  ),
)
