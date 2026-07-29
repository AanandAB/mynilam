import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  showPasswordToggle?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, icon, type = 'text', showPasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    const actualType = isPasswordType && showPassword ? 'text' : type

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {label}
            {props.required && <span className="text-red-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={actualType}
            className={`w-full bg-white dark:bg-slate-900 border ${
              error
                ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/10 focus:border-red-500'
                : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400'
            } rounded-xl py-2.5 ${icon ? 'pl-11' : 'pl-4'} ${
              isPasswordType || showPasswordToggle ? 'pr-11' : 'pr-4'
            } text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-500 dark:disabled:text-slate-600 ${className}`}
            {...props}
          />
          {(isPasswordType || showPasswordToggle) && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

