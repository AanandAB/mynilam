'use client'

import { useState } from 'react'
import { useAuth } from '@/app/hooks/use-auth'
import { useRouter } from 'next/navigation'

export function useSignupPageModel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const { register, isRegisterLoading, registerError } = useAuth()
  const router = useRouter()

  const fieldErrors: Record<string, string> = {}
  if (registerError && (registerError as any).errors) {
    Object.entries((registerError as any).errors).forEach(([field, messages]) => {
      const messagesArray = messages as string[]
      if (messagesArray && messagesArray.length > 0) {
        // Map backend schema field names to frontend states if needed
        const key = field === 'full_name' ? 'fullName' : field
        fieldErrors[key] = messagesArray[0]
      }
    })
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    register(
      { email, password, full_name: fullName, phone },
      {
        onSuccess: () => {
          router.push('/login')
        },
      }
    )
  }

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
    error: registerError ? ((registerError as any).message || 'Failed to register account.') : null,
    fieldErrors,
    handleSignup,
  }
}
