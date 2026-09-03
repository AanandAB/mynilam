'use client'

import React from 'react'
import { Skeleton } from './skeleton'

export interface LoadingOverlayProps {
  isLoading: boolean
  children?: React.ReactNode
  /** Show a full-screen overlay with spinner */
  fullScreen?: boolean
  /** Custom message to display */
  message?: string
  /** Show skeleton instead of spinner */
  showSkeleton?: boolean
  /** Type of skeleton to show */
  skeletonType?: 'cards' | 'page' | 'form'
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  fullScreen = false,
  message,
  showSkeleton = false,
  skeletonType = 'page',
}) => {
  if (!isLoading) {
    return <>{children}</>
  }

  if (showSkeleton) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
          <div className="w-full max-w-4xl p-8">
            {skeletonType === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} variant="rounded" className="h-64" />
                ))}
              </div>
            )}
            {skeletonType === 'form' && (
              <div className="space-y-4">
                <Skeleton variant="rounded" className="h-10 w-full" />
                <Skeleton variant="rounded" className="h-10 w-full" />
                <Skeleton variant="rounded" className="h-10 w-full" />
                <Skeleton variant="rounded" className="h-12 w-full" />
              </div>
            )}
            {skeletonType === 'page' && (
              <div className="space-y-8">
                <Skeleton variant="rounded" className="h-48" />
                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} variant="rounded" className="h-32" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400" />
          {message && (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Inline overlay - blocks interaction within the container
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400" />
          {message && (
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple full-page loading spinner
export const PageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-[70vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400" />
      {message && (
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  </div>
)
