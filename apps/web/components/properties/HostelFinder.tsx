'use client'

import React, { useState } from 'react'
import { useProperties } from '@/app/hooks/use-properties'
import { PropertyCard } from './PropertyCard'
import { PropertyFilters as Filters } from '@repo/shared'
import { 
  Search, MapPin, DollarSign, Filter, RefreshCw, 
  Home, Users, Sparkles, Building2, Wifi, Coffee, Wind, Info, Compass,
  LayoutGrid, List, Map as MapIcon
} from 'lucide-react'
import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />
})

export const HostelFinder: React.FC<{ hideBanner?: boolean }> = ({ hideBanner = false }) => {
  // Query parameters state
  const [searchTerm, setSearchTerm] = useState('')
  const [locationTerm, setLocationTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'any'>('all')
  const [sharingFilter, setSharingFilter] = useState<string>('any') // 'any', '1', '2', '3', '5', '6', 'dorm'
  const [priceMax, setPriceMax] = useState<number>(30000)
  const [viewType, setViewType] = useState<'grid' | 'list' | 'map'>('grid')
  
  // Amenities toggles
  const [wifi, setWifi] = useState(false)
  const [food, setFood] = useState(false)
  const [ac, setAc] = useState(false)
  const [laundry, setLaundry] = useState(false)
  
  // Category tabs: 'all' | 'hostel' | 'pg' | 'roommate'
  const [categoryTab, setCategoryTab] = useState<'all' | 'hostel' | 'pg' | 'roommate'>('all')

  // Build the API filter payload
  const apiFilters: Filters = {
    page: 1,
    page_size: 50,
    search: searchTerm || undefined,
    city: locationTerm || undefined,
    max_price: priceMax || undefined,
    preferred_gender: genderFilter === 'all' ? undefined : genderFilter,
    sharing_occupancy: sharingFilter === 'any' ? undefined : sharingFilter,
    wifi_available: wifi || undefined,
    food_included: food || undefined,
    ac_available: ac || undefined,
    laundry_available: laundry || undefined,
  }

  // Fetch properties list
  const { data, isLoading, error } = useProperties(apiFilters)

  // Filter listings client-side to ensure we ONLY show:
  // - Property type: 'hostel' or 'pg'
  // - OR Listing type: 'roommate'
  const getHostelListings = () => {
    const results = data?.results || []
    return results.filter(p => {
      // Base hostel listing constraint
      const isHostelRelated = p.property_type === 'hostel' || p.property_type === 'pg' || p.listing_type === 'roommate'
      if (!isHostelRelated) return false

      // Category tab filter
      if (categoryTab === 'hostel' && p.property_type !== 'hostel') return false
      if (categoryTab === 'pg' && p.property_type !== 'pg') return false
      if (categoryTab === 'roommate' && p.listing_type !== 'roommate') return false

      return true
    })
  }

  const listings = getHostelListings()

  const resetFilters = () => {
    setSearchTerm('')
    setLocationTerm('')
    setGenderFilter('all')
    setSharingFilter('any')
    setPriceMax(30000)
    setWifi(false)
    setFood(false)
    setAc(false)
    setLaundry(false)
    setCategoryTab('all')
  }

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner / Standalone Search Bar */}
      {!hideBanner ? (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-indigo-950 shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-850/40 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Hostel & PG Finder</h2>
              <p className="text-indigo-200 text-xs sm:text-sm max-w-lg leading-relaxed">
                Find verified hostels, PG bed spaces, co-living rooms, and shared flatmate opportunities.
              </p>
            </div>
            
            {/* Quick Search bar */}
            <div className="flex flex-col sm:flex-row gap-2 max-w-md w-full bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15">
              <div className="flex items-center px-3 flex-grow gap-2">
                <Search className="w-4 h-4 text-indigo-200 shrink-0" />
                <input
                  type="text"
                  placeholder="Keywords (mess, warden, CP...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-indigo-300 focus:outline-none w-full"
                />
              </div>
              <div className="flex items-center px-3 border-t sm:border-t-0 sm:border-l border-white/10 flex-grow gap-2 py-1.5 sm:py-0">
                <MapPin className="w-4 h-4 text-indigo-200 shrink-0" />
                <input
                  type="text"
                  placeholder="City (e.g. Bangalore...)"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-indigo-300 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standalone Search Bar when embedded under homepage hero */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-100 dark:border-slate-800 flex-grow gap-2">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-550 shrink-0" />
              <input
                type="text"
                placeholder="Keywords (mess, warden, CP...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
            <div className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-100 dark:border-slate-800 flex-grow gap-2">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-550 shrink-0" />
              <input
                type="text"
                placeholder="City (e.g. Bangalore...)"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'all' as const, label: 'All Shared Spaces', icon: Compass },
          { id: 'hostel' as const, label: 'Hostels', icon: Building2 },
          { id: 'pg' as const, label: 'PG / Co-Living', icon: Home },
          { id: 'roommate' as const, label: 'Roommate Matches', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = categoryTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setCategoryTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border hover:scale-[1.01] active:scale-95 duration-200 ${
                isActive 
                  ? 'bg-slate-900 dark:bg-indigo-650 text-white border-slate-950 dark:border-indigo-600 shadow-sm' 
                  : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Filter & Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Hostel Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Filters</span>
            </span>
            <button onClick={resetFilters} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Gender Preference Filters */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Gender Target</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all' as const, label: 'Unrestricted / All' },
                { id: 'male' as const, label: "Mens PG / Hostel" },
                { id: 'female' as const, label: "Ladies PG / Hostel" },
                { id: 'any' as const, label: 'Unisex Co-Living' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenderFilter(g.id)}
                  className={`px-3 py-2 rounded-xl text-left text-[11px] font-bold border transition-colors ${
                    genderFilter === g.id 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sharing Occupancy Type Filters */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Sharing / Occupancy</span>
            <select
              value={sharingFilter}
              onChange={(e) => setSharingFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="any">Any Occupancy</option>
              <option value="1">Single Occupancy (1 share)</option>
              <option value="2">Double Occupancy (2 share)</option>
              <option value="3">Triple Occupancy (3 share)</option>
              <option value="5">5 Share Bed Space</option>
              <option value="6">6 Share Bed Space</option>
              <option value="dorm">Dormitory Bed Space</option>
            </select>
          </div>

          {/* Price Filters */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
              <span>Max Budget (₹/mo)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">₹{priceMax.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="50000"
              step="500"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Amenity Checklist */}
          <div className="space-y-3 pt-2">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Key Amenities</span>
            <div className="space-y-2">
              {[
                { checked: wifi, setter: setWifi, label: 'High Speed WiFi', icon: Wifi },
                { checked: food, setter: setFood, label: 'Mess / Food Included', icon: Coffee },
                { checked: ac, setter: setAc, label: 'AC Rooms', icon: Wind },
                { checked: laundry, setter: setLaundry, label: 'Laundry Facility', icon: Info },
              ].map((item, i) => (
                <label key={i} className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="h-4.5 w-4.5 rounded-lg text-indigo-650 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-indigo-500/20"
                  />
                  <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Listings Feed */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
              We found <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">{listings.length}</span> spaces
            </span>
            
            {/* View Toggler */}
            <div className="flex items-center bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button type="button" onClick={() => setViewType('grid')} className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-650 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setViewType('list')} className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-white dark:bg-slate-805 shadow-sm text-indigo-650 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <List className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setViewType('map')} className={`p-2 rounded-lg transition-all ${viewType === 'map' ? 'bg-white dark:bg-slate-805 shadow-sm text-indigo-655 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center w-full">
              <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400"></div>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500 font-medium w-full">
              Failed to retrieve hostels dataset.
            </div>
          ) : listings.length === 0 ? (
            <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm w-full">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400 border border-slate-100 dark:border-slate-800">
                <Compass className="w-8 h-8 text-slate-450" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No hostel shared spaces match your filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try resetting filters, adjusting budget limits, or clearing search keywords.</p>
            </div>
          ) : viewType === 'map' ? (
            <PropertyMap properties={listings} />
          ) : (
            <div className={viewType === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
              {listings.map((property) => (
                <PropertyCard key={property.id} property={property} viewType={viewType} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  )
}
