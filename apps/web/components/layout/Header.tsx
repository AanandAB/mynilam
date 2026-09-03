'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/hooks/use-auth'
import { Button } from '../ui/button'
import { Home, LogOut, User, PlusCircle, Settings, Menu, X, Search } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 50) { setIsVisible(true); setLastScrollY(currentScrollY); return }
      if (currentScrollY > lastScrollY) setIsVisible(false)
      else setIsVisible(true)
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navLinks = [
    { href: '/', label: 'Find Rooms' },
    ...(user && user.role !== 'hostel_admin' ? [{ href: '/post', label: 'List Property' }] : []),
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ]

  return (
    <>
      {/* Top accent line */}
      <div className="w-full h-[3px] bg-gradient-to-r from-brand via-brand-dark to-brand" />

      <header className={`sticky top-0 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-white/95 dark:bg-[#111b2e]/95 backdrop-blur-md border-b border-border-light dark:border-white/10">
          <div className="max-w-content mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between">
            
            {/* Logo */}
            <Link href={user && user.role === 'hostel_admin' ? '/dashboard' : '/'} className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
                <Home className="h-[18px] w-[18px]" />
              </div>
              <span className="text-xl font-bold text-navy dark:text-white tracking-tight flex items-center">
                My
                <span className="nilam-container ml-0.5">
                  <span className="nilam-word text-brand">Nilam</span>
                  <span className="nilam-word text-brand">नीलम</span>
                  <span className="nilam-word text-brand">نیلم</span>
                  <span className="nilam-word text-brand">নীলম</span>
                  <span className="nilam-word text-brand">நீலம்</span>
                  <span className="nilam-word text-brand">నీలం</span>
                </span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive = href === '/'
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-light dark:bg-brand/15 text-brand'
                        : 'text-navy-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-surface-soft dark:hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Header Search - desktop */}
              <div className="hidden lg:flex items-center relative">
                <Search className="absolute left-3.5 h-4 w-4 text-navy-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search city, area..."
                  className="w-[240px] h-[38px] pl-10 pr-4 bg-surface-soft dark:bg-white/5 border border-border dark:border-white/10 rounded-pill text-[13px] text-navy dark:text-slate-200 placeholder:text-navy-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
                />
              </div>

              {user ? (
                <div className="hidden sm:flex items-center gap-3">
                  {user.role !== 'guest' && user.role !== 'hostel_admin' && (
                    <Link href="/post">
                      <Button className="h-9 px-4 bg-brand hover:bg-brand-dark text-white text-[13px] font-semibold rounded-md shadow-sm hover:shadow-md transition-all">
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        List Property
                      </Button>
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="p-2 text-navy-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"
                    title="Sign out"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="h-9 px-4 text-navy-600 hover:text-navy text-[13px] font-semibold">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="h-9 px-4 bg-brand hover:bg-brand-dark text-white text-[13px] font-semibold rounded-md">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}

              <ThemeToggle />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-navy-600 hover:bg-surface-soft rounded-xl transition-colors"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />                <div className="absolute top-[71px] left-0 right-0 bg-white dark:bg-[#111b2e] border-b border-border dark:border-white/10 shadow-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-content mx-auto px-4 py-3 space-y-1">
              {/* Mobile Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-navy-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search city, area..."                    className="w-full h-10 pl-10 pr-4 bg-surface-soft dark:bg-white/5 border border-border dark:border-white/10 rounded-md text-[13px] text-navy dark:text-slate-200 placeholder:text-navy-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand transition-all"
                />
              </div>

              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}                    className="flex items-center px-4 py-3 text-[14px] font-semibold text-navy-700 dark:text-slate-200 hover:bg-surface-soft dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  {label}
                </Link>
              ))}

              {user ? (
                <>
                  <div className="border-t border-border-light my-2" />
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">{user.full_name}</p>
                      <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4 pt-2 pb-1">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full h-10 text-[13px] font-semibold border-border text-navy-600">Log in</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                    <Button className="w-full h-10 bg-brand hover:bg-brand-dark text-white text-[13px] font-semibold rounded-md">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
