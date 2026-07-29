'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/use-auth'
import { authApi } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useSettingsPageModel() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoading: isAuthLoading } = useAuth()

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login')
      } else if (user.role === 'hostel_admin') {
        router.push('/dashboard')
      }
    }
  }, [user, isAuthLoading, router])

  // Prefill initial values
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'user'], updatedUser)
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update profile.')
      setTimeout(() => setErrorMessage(''), 4000)
    }
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!fullName) {
      setErrorMessage('Full name is required.')
      return
    }

    updateProfileMutation.mutate({
      full_name: fullName,
      phone: phone || undefined,
    })
  }

  return {
    fullName,
    setFullName,
    phone,
    setPhone,
    bio,
    setBio,
    successMessage,
    errorMessage,
    isLoading: isAuthLoading || updateProfileMutation.isPending,
    user,
    handleSave,
  }
}
