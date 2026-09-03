import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines,
  ...props
}) => {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-800'

  const variants = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    rounded: 'rounded-2xl',
  }

  if (lines) {
    return (
      <div className={`space-y-3 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${variants.text}`}
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              ...props.style,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ width, height, ...props.style }}
      {...props}
    />
  )
}

// Pre-built skeleton patterns
export const PropertyCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
    <Skeleton variant="rectangular" className="h-48 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton variant="text" className="w-3/4 h-5" />
      <Skeleton variant="text" className="w-1/2 h-4" />
      <div className="flex gap-4 pt-2">
        <Skeleton variant="text" className="w-20 h-4" />
        <Skeleton variant="text" className="w-16 h-4" />
        <Skeleton variant="text" className="w-16 h-4" />
      </div>
    </div>
  </div>
)

export const PropertyListSkeleton: React.FC = () => (
  <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 h-52">
    <Skeleton variant="rectangular" className="w-1/3 h-full rounded-none" />
    <div className="flex-1 p-5 space-y-3">
      <Skeleton variant="text" className="w-2/3 h-5" />
      <Skeleton variant="text" className="w-1/3 h-4" />
      <Skeleton lines={2} className="mt-4" />
      <div className="flex gap-4 pt-4">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton variant="text" className="w-16 h-4" />
      </div>
    </div>
  </div>
)

export const FilterSidebarSkeleton: React.FC = () => (
  <div className="space-y-6 p-5">
    <Skeleton variant="text" className="w-1/2 h-5" />
    <Skeleton variant="rounded" className="h-10 w-full" />
    <Skeleton variant="rounded" className="h-10 w-full" />
    <Skeleton variant="rounded" className="h-10 w-full" />
    <Skeleton variant="rounded" className="h-10 w-full" />
    <Skeleton variant="text" className="w-1/3 h-4" />
    <Skeleton variant="rounded" className="h-6 w-full" />
  </div>
)

export const HeroSkeleton: React.FC = () => (
  <div className="py-16 px-6 space-y-6">
    <Skeleton variant="rounded" className="h-8 w-2/3 mx-auto" />
    <Skeleton variant="rounded" className="h-4 w-1/2 mx-auto" />
    <div className="grid grid-cols-4 gap-4 mt-12">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} variant="rounded" className="h-28" />
      ))}
    </div>
  </div>
)
