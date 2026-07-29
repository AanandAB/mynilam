'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/use-auth'
import { useProperties } from '@/app/hooks/use-properties'
import type { PropertyFilters as Filters, Property } from '@repo/shared'

export function useHomepageModel() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    page_size: 12,
  })
  
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewType, setViewType] = useState<'grid' | 'list' | 'map'>('grid')
  const [activeMainTab, setActiveMainTab] = useState<'properties' | 'hostels'>('properties')

  const { data, isLoading: isPropertiesLoading, error } = useProperties(filters)

  // Client-side authentication guard: redirect to /login if no session, or to /dashboard if hostel_admin
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login')
      } else if (user.role === 'hostel_admin') {
        router.push('/dashboard')
      }
    }
  }, [user, isAuthLoading, router])

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  // Sort mock data locally
  const getSortedProperties = () => {
    const results = data?.results || []
    return [...results].sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price
      if (sortBy === 'price_high') return b.price - a.price
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // newest
    })
  }

  const sortedProperties = getSortedProperties()

  return {
    user,
    isAuthLoading,
    filters,
    handleFilterChange,
    sortBy,
    setSortBy,
    viewType,
    setViewType,
    sortedProperties,
    isLoading: isPropertiesLoading,
    error,
    router,
    activeMainTab,
    setActiveMainTab,
  }
}
