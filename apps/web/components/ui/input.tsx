import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
            {props.required && <span className="text-red-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`w-full bg-white dark:bg-gray-800 border ${
              error ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/10 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400'
            } rounded-xl py-2.5 ${
              icon ? 'pl-11' : 'pl-4'
            } pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-600 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
