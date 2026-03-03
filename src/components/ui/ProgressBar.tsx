import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: string
  showLabel?: boolean
}

export function ProgressBar({ value, max = 100, className, color = 'bg-primary-500', showLabel = false }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 rounded-full bg-surface-tertiary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-secondary">{Math.round(percentage)}%</span>
      )}
    </div>
  )
}
