'use client'

import React, { useState, useCallback } from 'react'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Search, MapPin, DollarSign, Filter, RefreshCw } from 'lucide-react'
import type { PropertyFilters as Filters } from '@repo/shared'

interface PropertyFiltersProps {
  filters: Filters
  onChange: (newFilters: Filters) => void
  onSearch?: () => void
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({ filters, onChange, onSearch }) => {
  // Local draft state - only applies to parent on explicit "Search" click
  const [draft, setDraft] = useState<Filters>(filters)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync draft when parent filters change (e.g., after reset)
  React.useEffect(() => {
    setDraft(filters)
    setHasChanges(false)
  }, [filters])

  const updateDraft = useCallback((key: keyof Filters, value: any) => {
    setDraft(prev => ({
      ...prev,
      [key]: value === 'any' ? undefined : value,
    }))
    setHasChanges(true)
  }, [])

  const handleSearch = () => {
    onChange({ ...draft, page: 1 })
    setHasChanges(false)
    onSearch?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const resetFilters = () => {
    const reset: Filters = { page: 1, page_size: 12 }
    setDraft(reset)
    onChange(reset)
    setHasChanges(false)
  }

  return (
    <Card className="space-y-6 shrink-0 h-fit sticky top-20 border-2 border-black dark:border-slate-600 rounded-2xl shadow-xl shadow-slate-900/10 p-5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl transition-all duration-300" onKeyDown={handleKeyDown}>
      
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-bold">
          <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Search Filters</span>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {/* Search text */}
        <Input
          label="Keywords"
          placeholder="e.g. apartment, sea view..."
          value={draft.search || ''}
          onChange={(e) => updateDraft('search', e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />

        {/* City */}
        <Input
          label="Location"
          placeholder="City or state..."
          value={draft.city || ''}
          onChange={(e) => updateDraft('city', e.target.value)}
          icon={<MapPin className="h-4 w-4" />}
        />

        {/* Listing Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Listing Type</label>
          <select
            value={draft.listing_type || 'any'}
            onChange={(e) => updateDraft('listing_type', e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">Buy or Rent or Roommate</option>
            <option value="sale">Buy (For Sale)</option>
            <option value="rent">Rent</option>
            <option value="roommate">Roommate Opportunity</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</label>
          <select
            value={draft.property_type || 'any'}
            onChange={(e) => updateDraft('property_type', e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">All Categories</option>
            <option value="flat">Apartment / Flat</option>
            <option value="house">House / Villa</option>
            <option value="plot">Plot / Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        {/* Preferred Gender (Roommate specific) */}
        {draft.listing_type === 'roommate' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preferred Gender</label>
            <select
              value={draft.preferred_gender || 'any'}
              onChange={(e) => updateDraft('preferred_gender', e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>
        )}

        {/* Price Slider/Inputs */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price Range (₹)</label>
          
          <div className="relative h-6 flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div 
              className="absolute h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full"
              style={{
                left: `${(Math.min(draft.min_price || 0, 50000000) / 50000000) * 100}%`,
                right: `${100 - (Math.min(draft.max_price || 50000000, 50000000) / 50000000) * 100}%`
              }}
            ></div>
            
            <input 
              type="range"
              min="0"
              max="50000000"
              step="50000"
              value={draft.min_price || 0}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), (draft.max_price || 50000000) - 50000)
                updateDraft('min_price', val)
              }}
              onMouseUp={handleSearch}
              onTouchEnd={handleSearch}
              className="absolute w-full h-1 pointer-events-none appearance-none bg-transparent accent-indigo-500 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-800 [&::-webkit-slider-thumb]:shadow-md"
            />
            <input 
              type="range"
              min="0"
              max="50000000"
              step="50000"
              value={draft.max_price || 50000000}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), (draft.min_price || 0) + 50000)
                updateDraft('max_price', val)
              }}
              onMouseUp={handleSearch}
              onTouchEnd={handleSearch}
              className="absolute w-full h-1 pointer-events-none appearance-none bg-transparent accent-indigo-500 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-800 [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Price (₹)"
              type="number"
              placeholder="Min"
              value={draft.min_price || ''}
              onChange={(e) => updateDraft('min_price', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price (₹)"
              type="number"
              placeholder="Max"
              value={draft.max_price || ''}
              onChange={(e) => updateDraft('max_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Bedrooms</label>
          <select
            value={draft.bedrooms || 'any'}
            onChange={(e) => updateDraft('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">Any Bedrooms</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="5">5+ BHK</option>
          </select>
        </div>

        {/* Bathrooms */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Bathrooms</label>
          <select
            value={draft.bathrooms || 'any'}
            onChange={(e) => updateDraft('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">Any Bathrooms</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>

        {/* Furnishing status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Furnishing</label>
          <select
            value={draft.furnishing || 'any'}
            onChange={(e) => updateDraft('furnishing', e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">Any Furnishing</option>
            <option value="Furnished">Fully Furnished</option>
            <option value="Semi-Furnished">Semi-Furnished</option>
            <option value="Unfurnished">Unfurnished</option>
          </select>
        </div>

        {/* Area range */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Area (sq ft)</label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min"
              type="number"
              placeholder="Min"
              value={draft.min_area || ''}
              onChange={(e) => updateDraft('min_area', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max"
              type="number"
              placeholder="Max"
              value={draft.max_area || ''}
              onChange={(e) => updateDraft('max_area', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Tenant preference */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Preference</label>
          <select
            value={draft.tenant_type || 'any'}
            onChange={(e) => updateDraft('tenant_type', e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">Any</option>
            <option value="family">Family</option>
            <option value="bachelors">Bachelors</option>
          </select>
        </div>

        {/* Availability timeline */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Availability</label>
          <select
            value={draft.availability || 'any'}
            onChange={(e) => updateDraft('availability', e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">Any Time</option>
            <option value="immediate">Immediate</option>
            <option value="15">Within 15 Days</option>
            <option value="30">Within 30 Days</option>
            <option value="30+">30+ Days</option>
          </select>
        </div>

        {/* Freshness / added within */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Added Within</label>
          <select
            value={draft.added_within || 'any'}
            onChange={(e) => updateDraft('added_within', e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="any">All Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>

        {/* Verified properties only */}
        <label className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!draft.verified}
            onChange={(e) => updateDraft('verified', e.target.checked ? true : undefined)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Verified Properties Only</span>
        </label>

      </div>

      {/* Search Button */}
      <div className="pt-2">
        <Button
          onClick={handleSearch}
          className="w-full font-bold py-3 text-sm tracking-wide bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 flex items-center justify-center gap-2"
        >
          <Search className="h-4 w-4" />
          <span>Search Properties</span>
          {hasChanges && (
            <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
              Updated
            </span>
          )}
        </Button>
      </div>

    </Card>
  )
}
