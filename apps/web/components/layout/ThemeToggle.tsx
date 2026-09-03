'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) return (
    <div className="p-2 rounded-xl" />
  )

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative p-2 rounded-xl text-navy-400 hover:text-brand hover:bg-brand-light dark:text-navy-300 dark:hover:text-brand dark:hover:bg-brand-light/10 transition-all duration-200"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun className="h-[18px] w-[18px] transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-0 scale-100 dark:rotate-90 dark:scale-0" />
      <Moon className="h-[18px] w-[18px] transition-all duration-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
