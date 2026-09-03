'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/app/hooks/use-auth'

export function useLoginPageModel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const { login, isLoginLoading, loginError } = useAuth()

  // Parse backend errors
  const fieldErrors: Record<string, string> = { ...localErrors }
  if (loginError) {
    const err = loginError as any
    // Handle structured errors from API
    if (err.errors) {
      Object.entries(err.errors).forEach(([field, messages]) => {
        const messagesArray = messages as string[]
        if (messagesArray && messagesArray.length > 0) {
          fieldErrors[field] = messagesArray[0]
        }
      })
    }
  }

  // Get a user-friendly error message
  const getErrorMessage = (): string | null => {
    if (!loginError) return null
    const err = loginError as any
    
    // If we have structured field errors, show a generic message
    if (err.errors && Object.keys(err.errors).length > 0) {
      return 'Please check your email and password.'
    }
    
    // Handle specific status codes
    if (err.status === 400) {
      return 'Invalid email or password. Please try again.'
    }
    if (err.status === 401) {
      return 'Invalid credentials. Please check your email and password.'
    }
    if (err.status === 404) {
      return 'Account not found. Please check your email or create a new account.'
    }
    if (err.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.'
    }
    if (err.status >= 500) {
      return 'Server error. Please try again later.'
    }
    
    // Fallback to message if available
    if (err.message && !err.message.includes('status code')) {
      return err.message
    }
    
    return 'Login failed. Please check your credentials and try again.'
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setLocalErrors({})
    
    if (!validateForm()) {
      return
    }
    
    login({ email: email.trim(), password })
  }, [email, password, login])

  const handleContinueAsGuest = () => {
    window.location.href = '/'
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading: isLoginLoading,
    error: getErrorMessage(),
    fieldErrors,
    handleLogin,
    handleContinueAsGuest,
  }
}
