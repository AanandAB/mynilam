'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-slate-50/50 dark:bg-slate-950/20">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-xl">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
          <Building2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-100 dark:border-indigo-900/40">
            404 Page Not Found
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Lost Your Way?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            The property listing or page you are looking for has been moved, renamed, or does not exist.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Back to Catalog</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
