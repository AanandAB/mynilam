'use client'

import React from 'react'
import Link from 'next/link'
import { useLoginPageModel } from './LoginPageModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, User, Shield, Briefcase, Compass } from 'lucide-react'

export default function LoginPage() {
  const {
    email, setEmail,
    password, setPassword,
    isLoading, error, fieldErrors,
    handleLogin, handleContinueAsGuest,
  } = useLoginPageModel()

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail)
    setPassword('password')
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 relative" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(75,143,135,0.08), transparent 50%), #F7FAFB' }}>
      
      <div className="max-w-md w-full bg-white rounded-xl border border-border shadow-card p-8 sm:p-10 space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mx-auto mb-2">
            <Shield className="h-6 w-6 text-brand" />
          </div>
          <h2 className="text-3xl font-bold text-navy font-serif">Welcome back</h2>
          <p className="text-[14px] text-navy-500">
            Sign in to your account or{' '}
            <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark transition-colors">create a new one</Link>
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            icon={<Mail className="h-4 w-4" />}
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            icon={<Lock className="h-4 w-4" />}
            error={fieldErrors.password}
          />

          {error && (
            <div className="text-red-600 text-[13px] font-medium text-center bg-red-50 border border-red-200 py-3 px-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-11 bg-brand hover:bg-brand-dark text-white font-semibold rounded-md text-[14px]"
            >
              Sign In
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-4 text-[11px] font-bold text-navy-400 uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleContinueAsGuest}
              className="w-full h-11 font-semibold text-navy-600 border-border hover:bg-surface-soft text-[14px]"
            >
              Continue as Guest
            </Button>
          </div>
        </form>

        {/* Dev Quick Login */}
        {process.env.NEXT_PUBLIC_USE_MOCK === 'true' && (
          <div className="border-t border-border-light pt-5 space-y-3">
            <p className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">Developer Test Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <button onClick={() => handleQuickLogin('normal@rentel.com')} className="flex items-center gap-2 p-2.5 bg-surface-soft hover:bg-brand-light border border-border rounded-lg text-navy-600 font-medium transition-all hover:text-brand hover:border-brand-200">
                <User className="w-3.5 h-3.5" /> Normal User
              </button>
              <button onClick={() => handleQuickLogin('hostel@rentel.com')} className="flex items-center gap-2 p-2.5 bg-surface-soft hover:bg-brand-light border border-border rounded-lg text-navy-600 font-medium transition-all hover:text-brand hover:border-brand-200">
                <Compass className="w-3.5 h-3.5" /> Hostel Admin
              </button>
              <button onClick={() => handleQuickLogin('employee@rentel.com')} className="flex items-center gap-2 p-2.5 bg-surface-soft hover:bg-brand-light border border-border rounded-lg text-navy-600 font-medium transition-all hover:text-brand hover:border-brand-200">
                <Briefcase className="w-3.5 h-3.5" /> Employee
              </button>
              <button onClick={() => handleQuickLogin('admin@rentel.com')} className="flex items-center gap-2 p-2.5 bg-surface-soft hover:bg-brand-light border border-border rounded-lg text-navy-600 font-medium transition-all hover:text-brand hover:border-brand-200">
                <Shield className="w-3.5 h-3.5" /> Super Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
