'use client'

import React from 'react'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Search, MapPin, DollarSign, Filter, RefreshCw } from 'lucide-react'
import type { PropertyFilters as Filters } from '@repo/shared'

interface PropertyFiltersProps {
  filters: Filters
  onChange: (newFilters: Filters) => void
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({ filters, onChange }) => {
  const handleSelectChange = (key: keyof Filters, value: any) => {
    onChange({
      ...filters,
      [key]: value === 'any' ? undefined : value,
    })
  }

  const handleInputChange = (key: keyof Filters, value: string) => {
    onChange({
      ...filters,
      [key]: value ? value : undefined,
    })
  }

  const handleNumericChange = (key: keyof Filters, value: string) => {
    onChange({
      ...filters,
      [key]: value ? Number(value) : undefined,
    })
  }

  const resetFilters = () => {
    onChange({ page: 1, page_size: 12 })
  }

  return (
    <Card className="space-y-6 shrink-0 h-fit sticky top-20 border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-indigo-900/5 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-300">
      
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
          value={filters.search || ''}
          onChange={(e) => handleInputChange('search', e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />

        {/* City */}
        <Input
          label="Location"
          placeholder="City or state..."
          value={filters.city || ''}
          onChange={(e) => handleInputChange('city', e.target.value)}
          icon={<MapPin className="h-4 w-4" />}
        />

        {/* Listing Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Listing Type</label>
          <select
            value={filters.listing_type || 'any'}
            onChange={(e) => handleSelectChange('listing_type', e.target.value)}
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
            value={filters.property_type || 'any'}
            onChange={(e) => handleSelectChange('property_type', e.target.value)}
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
        {filters.listing_type === 'roommate' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preferred Gender</label>
            <select
              value={filters.preferred_gender || 'any'}
              onChange={(e) => handleSelectChange('preferred_gender', e.target.value)}
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
                left: `${(Math.min(filters.min_price || 0, 50000000) / 50000000) * 100}%`,
                right: `${100 - (Math.min(filters.max_price || 50000000, 50000000) / 50000000) * 100}%`
              }}
            ></div>
            
            <input 
              type="range"
              min="0"
              max="50000000"
              step="50000"
              value={filters.min_price || 0}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), (filters.max_price || 50000000) - 50000)
                handleNumericChange('min_price', String(val))
              }}
              className="absolute w-full h-1 pointer-events-none appearance-none bg-transparent accent-indigo-500 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-800 [&::-webkit-slider-thumb]:shadow-md"
            />
            <input 
              type="range"
              min="0"
              max="50000000"
              step="50000"
              value={filters.max_price || 50000000}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), (filters.min_price || 0) + 50000)
                handleNumericChange('max_price', String(val))
              }}
              className="absolute w-full h-1 pointer-events-none appearance-none bg-transparent accent-indigo-500 cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-800 [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Price (₹)"
              type="number"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => handleNumericChange('min_price', e.target.value)}
            />
            <Input
              label="Max Price (₹)"
              type="number"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => handleNumericChange('max_price', e.target.value)}
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Bedrooms</label>
          <select
            value={filters.bedrooms || 'any'}
            onChange={(e) => handleSelectChange('bedrooms', e.target.value ? Number(e.target.value) : 'any')}
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

      </div>

    </Card>
  )
}
