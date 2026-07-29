'use client'

import React from 'react'
import Link from 'next/link'
import { useSignupPageModel } from './SignupPageModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail, Lock, User, Phone, Shield } from 'lucide-react'

export default function SignupPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    phone,
    setPhone,
    isLoading,
    error,
    fieldErrors,
    handleSignup,
  } = useSignupPageModel()

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/20">
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
 
      <Card className="max-w-md w-full p-8 sm:p-10 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-xl dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-2">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
 
        {/* Form */}
        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              icon={<User className="h-4 w-4" />}
              error={fieldErrors.fullName}
            />
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
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 99999 99999"
              icon={<Phone className="h-4 w-4" />}
              error={fieldErrors.phone}
            />
            <Input
              label="Password"
              type="password"
              required
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

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full font-bold py-3 text-sm tracking-wide bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              Sign Up
            </Button>
          </div>
        </form>

      </Card>
    </div>
  )
}
