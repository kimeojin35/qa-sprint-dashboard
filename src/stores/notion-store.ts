import { create } from 'zustand'
import type { NotionStory, NotionSprint } from '@/types/notion'
import { syncNotion } from '@/lib/api'

interface NotionStore {
  stories: NotionStory[]
  sprints: NotionSprint[]
  isLoading: boolean
  error: string | null
  lastSyncedAt: string | null
  sync: () => Promise<void>
}

export const useNotionStore = create<NotionStore>((set) => ({
  stories: [],
  sprints: [],
  isLoading: false,
  error: null,
  lastSyncedAt: null,

  sync: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await syncNotion()
      set({
        stories: data.stories,
        sprints: data.sprints,
        lastSyncedAt: data.syncedAt,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      })
    }
  },
}))
