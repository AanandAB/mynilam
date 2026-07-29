import React from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from './button'

export interface EmptyStateProps {
  icon?: any
  title: string

  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`w-full py-16 px-6 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 ${className}`}
    >
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-2xs">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            type="button"
            onClick={onAction}
            className="font-bold text-xs bg-slate-900 dark:bg-indigo-600 text-white rounded-xl"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
