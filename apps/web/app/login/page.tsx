'use client'

import React from 'react'
import Link from 'next/link'
import { useLoginPageModel } from './LoginPageModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Sparkles, User, Shield, Briefcase, ArrowRight, Compass, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    fieldErrors,
    handleLogin,
    handleContinueAsGuest,
  } = useLoginPageModel()

  // Developer helper to quickly log in with specific roles
  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail)
    setPassword('password')
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/20 space-y-4">
      {/* Back to Catalog Link */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      <Card className="max-w-md w-full p-8 sm:p-10 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl space-y-6 relative z-10">
        {/* Brand/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to your account or{' '}
            <Link
              href="/signup"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
            >
              create a new one
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              type="password"
              required
              showPasswordToggle={true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              error={fieldErrors.password}
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-xs font-semibold text-center bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/30 py-2.5 px-4 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full font-bold py-3 text-sm tracking-wide bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              Sign In
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleContinueAsGuest}
              className="w-full font-bold py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </form>

        {/* Developer Testing Section */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-6 space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Developer Test Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('normal@rentel.com')}
              className="flex items-center space-x-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50 text-slate-660 dark:text-slate-300 font-medium transition-colors"
            >
              <User className="h-3.5 w-3.5 text-indigo-500" />
              <span>Normal User</span>
            </button>
            <button
              onClick={() => handleQuickLogin('hostel@rentel.com')}
              className="flex items-center space-x-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50 text-slate-660 dark:text-slate-300 font-medium transition-colors"
            >
              <Compass className="h-3.5 w-3.5 text-rose-500" />
              <span>Hostel Admin</span>
            </button>
            <button
              onClick={() => handleQuickLogin('employee@rentel.com')}
              className="flex items-center space-x-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50 text-slate-660 dark:text-slate-300 font-medium transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
              <span>Employee</span>
            </button>
            <button
              onClick={() => handleQuickLogin('admin@rentel.com')}
              className="flex items-center space-x-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800/50 text-slate-660 dark:text-slate-300 font-medium transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-amber-500" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
