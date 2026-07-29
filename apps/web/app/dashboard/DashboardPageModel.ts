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
  const [activeTab, setActiveTab] = useState<'my-ads' | 'verify-users' | 'employees' | 'users-list' | 'hostel-manage'>('my-ads')

  useEffect(() => {
    if (user && user.role === 'hostel_admin') {
      setActiveTab('hostel-manage')
    }
  }, [user])

  // Employee management state
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('')
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // State to force re-renders when modifying in-memory mock lists
  const [usersList, setUsersList] = useState<User[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login')
    }
  }, [user, isAuthLoading, router])

  // Sync initial list values
  useEffect(() => {
    setUsersList([...mockUsers])
    setPropertiesList([...mockProperties])
  }, [])

  // Filter properties based on user role
  const getFilteredProperties = () => {
    if (!user) return []
    if (user.role === 'hostel_admin') return []
    if (user.role === 'super_admin' || user.role === 'employee' || user.role === 'guest') {
      return propertiesList // Admins, employees, guests can view all properties
    }
    // Normal users only see their own properties
    return propertiesList.filter(p => p.user_id === user.id || p.user?.email === user.email)
  }

  const userProperties = getFilteredProperties()

  // Add Employee (mock function modifying the in-memory array)
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!newEmployeeEmail || !newEmployeeName) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    const exists = mockUsers.some(u => u.email === newEmployeeEmail)
    if (exists) {
      setErrorMessage('A user or employee with this email already exists.')
      return
    }

    const newEmp: User = {
      id: 'emp_' + String(Date.now()),
      email: newEmployeeEmail,
      full_name: newEmployeeName,
      role: 'employee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockUsers.push(newEmp)
    saveMockUsersToStorage()
    setUsersList([...mockUsers])
    setNewEmployeeEmail('')
    setNewEmployeeName('')
    setSuccessMessage('Employee added successfully!')
  }

  // Delete Employee/User
  const handleDeleteUser = (userId: string) => {
    const index = mockUsers.findIndex(u => u.id === userId)
    if (index !== -1) {
      mockUsers.splice(index, 1)
      saveMockUsersToStorage()
      setUsersList([...mockUsers])
      setSuccessMessage('User account deleted.')
    }
  }

  // Delete Ad (listings)
  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await propertiesApi.deleteProperty(propertyId)
      // Update local state
      const updatedList = propertiesList.filter(p => p.id !== propertyId)
      setPropertiesList(updatedList)
      // Sync it back to mockProperties so it stays deleted across pages
      const mockIndex = mockProperties.findIndex(p => p.id === propertyId)
      if (mockIndex !== -1) {
        mockProperties.splice(mockIndex, 1)
      }
      setSuccessMessage('Ad listing deleted successfully.')
    } catch (err: any) {
      setErrorMessage('Failed to delete property.')
    }
  }

  // Verify Listing (mock functionality for employee)
  const handleVerifyProperty = (propertyId: string) => {
    const index = mockProperties.findIndex(p => p.id === propertyId)
    if (index !== -1) {
      mockProperties[index].status = 'published'
      mockProperties[index].is_published = true
      saveMockPropertiesToStorage()
      setPropertiesList([...mockProperties])
      setSuccessMessage('Property ad successfully verified and published!')
    }
  }

  const unverifiedProperties = propertiesList.filter(p => !p.is_published)

  return {
    user,
    isLoading: isAuthLoading,
    activeTab,
    setActiveTab,
    userProperties,
    unverifiedProperties,
    usersList,
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
    logout,
  }
}
