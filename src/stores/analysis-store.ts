import { create } from 'zustand'
import type { StoryAnalysis } from '@/types/report'
import { analyzeStory } from '@/lib/api'

interface AnalysisStore {
  analyses: Record<string, StoryAnalysis>
  loadingIds: Set<string>
  errors: Record<string, string>
  analyze: (storyId: string, story: { title: string; summary: string; featureType: string; category: string }) => Promise<void>
  clearError: (storyId: string) => void
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analyses: {},
  loadingIds: new Set(),
  errors: {},

  analyze: async (storyId, story) => {
    const { loadingIds } = get()
    if (loadingIds.has(storyId)) return

    set({ loadingIds: new Set([...loadingIds, storyId]) })
    try {
      const result = await analyzeStory(story)
      const { loadingIds: current, analyses } = get()
      const next = new Set(current)
      next.delete(storyId)
      set({
        analyses: { ...analyses, [storyId]: { ...result, storyId } },
        loadingIds: next,
        errors: { ...get().errors, [storyId]: undefined } as Record<string, string>,
      })
    } catch (err) {
      const { loadingIds: current } = get()
      const next = new Set(current)
      next.delete(storyId)
      set({
        loadingIds: next,
        errors: { ...get().errors, [storyId]: err instanceof Error ? err.message : String(err) },
      })
    }
  },

  clearError: (storyId) => {
    const { errors } = get()
    const next = { ...errors }
    delete next[storyId]
    set({ errors: next })
  },
}))
