import { useState } from 'react'
import { cn } from '@/lib/cn'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export function Tabs({ tabs, defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id)

  const active = tabs.find((t) => t.id === activeTab)

  return (
    <div className={cn(className)}>
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              tab.id === activeTab
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    tab.id === activeTab
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'bg-surface-tertiary text-text-tertiary',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {tab.id === activeTab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">{active?.content}</div>
    </div>
  )
}
