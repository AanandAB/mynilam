'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/use-auth'
import { useProperties } from '@/app/hooks/use-properties'
import type { PropertyFilters as Filters, Property } from '@repo/shared'

export function useHomepageModel() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuthMessage, setShowAuthMessage] = useState(false)
  
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    page_size: 12,
  })
  
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewType, setViewType] = useState<'grid' | 'list' | 'map'>('grid')
  const [activeMainTab, setActiveMainTab] = useState<'properties' | 'hostels'>('properties')

  // Map the UI sort label to the backend's `sort` query param so ordering happens
  // server-side across the full result set (not just the current page).
  const SORT_TO_API: Record<string, string> = {
    newest: 'newest',
    price_low: 'price_asc',
    price_high: 'price_desc',
  }
  const queryFilters = { ...filters, sort: SORT_TO_API[sortBy] || 'newest' }

  const { data, isLoading: isPropertiesLoading, error, isFetching } = useProperties(queryFilters)

  // Client-side authentication guard
  useEffect(() => {
    if (!isAuthLoading) {
      setAuthChecked(true)
      if (!user) {
        // Check if user clicked browser back button
        // We detect this by checking if the page was loaded from cache
        const navEntries = performance.getEntriesByType('navigation') as any[]
        const isBackNavigation = navEntries[0]?.type === 'back_forward'
        if (isBackNavigation) {
          setShowAuthMessage(true)
        }
        // Guests can browse — do not redirect to login
      } else if (user.role === 'hostel_admin') {
        router.push('/dashboard')
      }
    }
  }, [user, isAuthLoading, router])

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters)
  }, [])

  // Results arrive pre-sorted from the backend (server-side `sort` param).
  const sortedProperties = data?.results || []

  return {
    user,
    isAuthLoading,
    authChecked,
    showAuthMessage,
    setShowAuthMessage,
    filters,
    handleFilterChange,
    sortBy,
    setSortBy,
    viewType,
    setViewType,
    sortedProperties,
    isLoading: isPropertiesLoading,
    isFetching,
    error,
    router,
    activeMainTab,
    setActiveMainTab,
  }
}
