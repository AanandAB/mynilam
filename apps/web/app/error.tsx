'use client'

import React, { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-slate-50/50 dark:bg-slate-950/20">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-red-100 dark:border-red-950/40 shadow-xl">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/40 shadow-sm">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 px-3 py-1 bg-red-50 dark:bg-red-950/60 rounded-full border border-red-100 dark:border-red-900/40">
            Application Error
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            {error?.message || 'An unexpected error occurred while loading this view. Please try again.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
