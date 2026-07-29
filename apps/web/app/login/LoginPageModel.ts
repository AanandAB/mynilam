'use client'

import { useState } from 'react'
import { useAuth } from '@/app/hooks/use-auth'

export function useLoginPageModel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoginLoading, loginError } = useAuth()

  const fieldErrors: Record<string, string> = {}
  if (loginError && (loginError as any).errors) {
    Object.entries((loginError as any).errors).forEach(([field, messages]) => {
      const messagesArray = messages as string[]
      if (messagesArray && messagesArray.length > 0) {
        fieldErrors[field] = messagesArray[0]
      }
    })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  const handleContinueAsGuest = () => {
    login({ email: 'guest@rentel.com', password: 'password' })
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading: isLoginLoading,
    error: loginError ? ((loginError as any).message || 'Invalid email or password.') : null,
    fieldErrors,
    handleLogin,
    handleContinueAsGuest,
  }
}
