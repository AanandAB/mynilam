'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/hooks/use-auth'
import { Button } from '../ui/button'
import { Home, Sparkles, LogOut, User, PlusCircle, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [logoIndex, setLogoIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const logoWords = ['Nilam', 'നിലം', 'ज़मीन', 'நிலം', 'أرض']

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipped(true)
      setTimeout(() => {
        setLogoIndex((prev) => (prev + 1) % logoWords.length)
        setIsFlipped(false)
      }, 300)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Always show at the top of the page
      if (currentScrollY < 50) {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY) {
        setIsVisible(false) // scrolling down
      } else {
        setIsVisible(true) // scrolling up
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header className={`bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-50 sticky top-0 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href={user && user.role === 'hostel_admin' ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group shrink-0 pr-1">
          <div className="p-2.5 bg-slate-900 dark:bg-indigo-600 rounded-xl text-white shadow-md group-hover:scale-105 group-hover:rotate-1 transition-all duration-200">
            <Home className="h-5 w-5" />
          </div>
          <span className="text-xl font-black tracking-tight whitespace-nowrap py-1 inline-block select-none">
            <span className="bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">My</span>
            <span 
              className={`inline-block transition-all duration-300 transform ml-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent ${
                isFlipped ? 'opacity-0 scale-75 -translate-y-1' : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {logoWords[logoIndex]}
            </span>
          </span>
        </Link>

        {/* Center Links */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            {user.role !== 'hostel_admin' && (
              <Link href="/" className="px-4 py-2 text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-xl transition-all duration-150">
                Find Properties
              </Link>
            )}
            <Link href="/dashboard" className="px-4 py-2 text-xs font-bold text-slate-650 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-xl transition-all duration-150">
              Dashboard
            </Link>
            <Link href="/settings" className="px-4 py-2 text-xs font-bold text-slate-650 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-xl transition-all duration-150 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
          </nav>
        )}

        {/* Right Nav Controls */}
        <div className="flex items-center space-x-3">
          
          {user && user.role !== 'guest' && (
            <Link
              href="/settings"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-800 hover:bg-indigo-100/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold shadow-sm transition-all duration-200"
            >
              <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-500" />
              <span>Go Pro</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white leading-none">{user.full_name}</span>
                <span className="text-[9px] font-bold text-slate-400 capitalize mt-1 tracking-wider bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800/80">{user.role}</span>
              </div>
              <button 
                onClick={() => logout()}
                className="p-2 text-slate-500 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold text-indigo-650 hover:text-indigo-750 text-xs">
                Log In
              </Button>
            </Link>
          )}

          <ThemeToggle />

          {/* Post Ad CTA */}
          {user && user.role !== 'guest' && user.role !== 'hostel_admin' && (
            <Link href="/post">
              <Button variant="gradient" size="sm" className="flex items-center space-x-1.5 font-bold text-xs bg-slate-900 text-white dark:bg-indigo-600 border-none dark:hover:bg-indigo-700">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Post Ad</span>
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  )
}
