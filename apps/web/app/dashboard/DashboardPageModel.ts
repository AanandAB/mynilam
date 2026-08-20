'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { propertiesApi, authApi, mockUsers, mockProperties, type User, type Property, saveMockUsersToStorage, saveMockPropertiesToStorage } from '@repo/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useDashboardPageModel() {
  const { user, isLoading: isAuthLoading, logout } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'my-ads' | 'verify-users' | 'employees' | 'users-list' | 'hostel-manage' | 'hostel-photos' | 'favorites' | 'inquiries' | 'messages' | 'visits' | 'hostel-requests' | 'leases' | 'maintenance'>('my-ads')


  useEffect(() => {
    if (user && user.role === 'hostel_admin') {
      setActiveTab('hostel-manage')
    }
  }, [user])

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // Employee management state
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Queries
  const { data: userProperties = [] } = useQuery({
    queryKey: ['properties', 'me'],
    queryFn: () => propertiesApi.getUserProperties(),
    enabled: !!user,
  })

  const { data: unverifiedProperties = [] } = useQuery({
    queryKey: ['properties', 'unverified'],
    queryFn: () => propertiesApi.getUnverifiedProperties(),
    enabled: !!user && (user.role === 'employee' || user.role === 'super_admin'),
  })

  const { data: usersList = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => authApi.getUsers(),
    enabled: !!user && user.role === 'super_admin',
  })

  const { data: hostelList = [], refetch: refetchHostelList } = useQuery({
    queryKey: ['hostels', 'all'],
    queryFn: () => propertiesApi.getHostelList(),
    enabled: !!user && user.role === 'super_admin',
  })

  const hostelPropertyId = user?.role === 'hostel_admin' && userProperties.length > 0 ? userProperties[0].id : null

  const { data: hostelConfigData = null, isLoading: isHostelConfigLoading } = useQuery({
    queryKey: ['hostelConfig', hostelPropertyId],
    queryFn: () => propertiesApi.getHostelConfig(hostelPropertyId!),
    enabled: !!hostelPropertyId,
  })

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.verifyProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      setSuccessMessage('Property ad successfully verified and published!')
      setErrorMessage('')
    },
    onError: () => setErrorMessage('Failed to verify property.')
  })

  const updateHostelConfigMutation = useMutation({
    mutationFn: (data: any) => propertiesApi.updateHostelConfig(hostelPropertyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelConfig', hostelPropertyId] })
      setSuccessMessage('Hostel configuration updated successfully!')
      setErrorMessage('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: () => setErrorMessage('Failed to update hostel configuration.')
  })

  const deletePropertyMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      setSuccessMessage('Ad listing deleted successfully.')
      setErrorMessage('')
    },
    onError: () => setErrorMessage('Failed to delete property.')
  })

  const addEmployeeMutation = useMutation({
    mutationFn: ({ email, name }: { email: string; name: string }) => authApi.addEmployee(email, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setNewEmployeeEmail('')
      setNewEmployeeName('')
      setSuccessMessage(`Employee added successfully! Default password: ${data.default_password || 'Rentel@123'}`)
      setErrorMessage('')
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to add employee.')
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSuccessMessage('User account deleted.')
      setErrorMessage('')
    },
    onError: () => setErrorMessage('Failed to delete user.')
  })

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployeeEmail || !newEmployeeName) {
      setErrorMessage('Please fill in all fields.')
      return
    }
    addEmployeeMutation.mutate({ email: newEmployeeEmail, name: newEmployeeName })
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
        deleteUserMutation.mutate(userId)
    }
  }

  const handleDeleteProperty = (propertyId: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
        deletePropertyMutation.mutate(propertyId)
    }
  }

  const handleVerifyProperty = (propertyId: string) => {
    verifyMutation.mutate(propertyId)
  }

  const handleSaveHostelConfig = (configData: any) => {
    if (!hostelPropertyId) {
      setErrorMessage('No property found to update. Please create a property first.')
      return
    }
    updateHostelConfigMutation.mutate(configData)
  }

  return {
    user,
    isLoading: isAuthLoading,
    activeTab,
    setActiveTab,
    userProperties,
    unverifiedProperties,
    usersList,
    hostelList,
    refetchHostelList,
    newEmployeeEmail,
    setNewEmployeeEmail,
    newEmployeeName,
    setNewEmployeeName,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    handleAddEmployee,
    handleDeleteUser,
    handleDeleteProperty,
    handleVerifyProperty,
    hostelConfigData,
    hostelPropertyId: hostelPropertyId || '1',
    isHostelConfigLoading,

    handleSaveHostelConfig,
    logout,
  }
}
