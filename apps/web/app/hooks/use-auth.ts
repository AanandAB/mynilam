'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi, type User } from '@repo/shared'

export function useAuth() {
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user)
      if (typeof window !== 'undefined') {
        const target = data.user.role === 'hostel_admin' ? '/dashboard' : '/'
        window.location.href = target
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    },
  })

  return {
    user,
    isLoading,
    error,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    refetch,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  }
}