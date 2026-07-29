'use client'

import React from 'react'
import { useSettingsPageModel } from './SettingsPageModel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  User, Mail, Phone, Shield, Sparkles, CheckCircle2, AlertCircle, FileText
} from 'lucide-react'

export default function SettingsPage() {
  const model = useSettingsPageModel()

  if (model.isLoading && !model.user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400"></div>
      </div>
    )
  }

  if (!model.user || model.user.role === 'hostel_admin') return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 relative">
      
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile information and preferences</p>
      </div>

      {/* Messages */}
      {model.successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{model.successMessage}</span>
        </div>
      )}

      {model.errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>{model.errorMessage}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card Summary */}
        <aside className="md:col-span-1 space-y-4">
          <Card className="p-6 border border-slate-200/60 dark:border-slate-800 text-center space-y-4 bg-white dark:bg-slate-900">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              {model.user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{model.user.full_name}</h3>
              <p className="text-xs text-slate-400 truncate">{model.user.email}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {model.user.role}
              </span>
            </div>
          </Card>
        </aside>

        {/* Edit Fields Form */}
        <main className="md:col-span-2">
          <Card className="p-8 border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <form onSubmit={model.handleSave} className="space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-3">Personal Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={model.fullName}
                  onChange={(e) => model.setFullName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={model.phone}
                  onChange={(e) => model.setPhone(e.target.value)}
                  icon={<Phone className="h-4 w-4" />}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Email Address (Cannot Change)"
                    type="email"
                    disabled
                    value={model.user.email}
                    icon={<Mail className="h-4 w-4" />}
                    className="bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-600"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bio / Description</label>
                  <textarea
                    rows={4}
                    placeholder="Brief description about yourself or what you are looking for..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                    value={model.bio}
                    onChange={(e) => model.setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <Button 
                  type="submit" 
                  isLoading={model.isLoading}
                  className="font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 border-none"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </main>

      </div>

    </div>
  )
}
