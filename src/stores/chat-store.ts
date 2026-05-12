import { create } from 'zustand'
import type { Story } from '@/types/sprint'

interface ChatStore {
  isOpen: boolean
  focusedStory: Story | null
  setOpen: (open: boolean) => void
  askAboutStory: (story: Story) => void
  clearFocus: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  focusedStory: null,
  setOpen: (open) => set({ isOpen: open }),
  askAboutStory: (story) => set({ isOpen: true, focusedStory: story }),
  clearFocus: () => set({ focusedStory: null }),
}))
