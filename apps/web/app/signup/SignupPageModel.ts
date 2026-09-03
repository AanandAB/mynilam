'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/app/hooks/use-auth'
import { useRouter } from 'next/navigation'

export function useSignupPageModel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const { register, isRegisterLoading, registerError } = useAuth()
  const router = useRouter()

  // Parse backend errors
  const fieldErrors: Record<string, string> = { ...localErrors }
  if (registerError && (registerError as any).errors) {
    Object.entries((registerError as any).errors).forEach(([field, messages]) => {
      const messagesArray = messages as string[]
      if (messagesArray && messagesArray.length > 0) {
        const key = field === 'full_name' ? 'fullName' : field
        fieldErrors[key] = messagesArray[0]
      }
    })
  }

  // Get a user-friendly error message
  const getErrorMessage = (): string | null => {
    if (!registerError) return null
    const err = registerError as any
    
    if (err.errors && Object.keys(err.errors).length > 0) {
      return 'Please fix the errors below.'
    }
    
    if (err.status === 400) {
      return 'Invalid registration details. Please check your information.'
    }
    if (err.status === 409) {
      return 'An account with this email already exists.'
    }
    if (err.status >= 500) {
      return 'Server error. Please try again later.'
    }
    
    if (err.message && !err.message.includes('status code')) {
      return err.message
    }
    
    return 'Registration failed. Please try again.'
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters'
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, and a number'
    }
    
    setLocalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignup = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setLocalErrors({})
    
    if (!validateForm()) {
      return
    }
    
    register(
      { email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: () => {
          setIsSuccess(true)
          // Show success message, then redirect to login
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        },
      }
    )
  }, [email, password, fullName, phone, register, router])

  return {
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    phone,
    setPhone,
    isLoading: isRegisterLoading,
    error: getErrorMessage(),
    fieldErrors,
    handleSignup,
    isSuccess,
  }
}
