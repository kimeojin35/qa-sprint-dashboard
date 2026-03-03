export interface RepoConfig {
  name: string
  url: string
  branch: string
}

export interface AppSettings {
  notionDatabaseUrl: string
  repos: RepoConfig[]
  sprintName: string
  darkMode: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  notionDatabaseUrl: '',
  repos: [
    {
      name: 'adrop-ads-console',
      url: 'https://github.com/anthropics/adrop-ads-console',
      branch: 'main',
    },
    {
      name: 'adrop-api',
      url: 'https://github.com/anthropics/adrop-api',
      branch: 'main',
    },
  ],
  sprintName: 'Sprint 2026-W10',
  darkMode: false,
}
