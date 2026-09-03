'use client'

import { useState, useEffect } from 'react'
import { useHomepageModel } from './HomepageModel'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyFilters } from '@/components/properties/PropertyFilters'
import { useGeolocation } from '@/app/hooks/use-geolocation'
import { ArrowUpDown, Building2, Users, CheckCircle, LayoutGrid, List, Map as MapIcon, Compass, LogIn, SlidersHorizontal, ChevronUp, MapPin } from 'lucide-react'
import { HostelFinder } from '@/components/properties/HostelFinder'
import { PropertyCardSkeleton } from '@/components/ui/skeleton'
import { SearchBar } from '@/components/properties/SearchBar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('@/components/properties/PropertyMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] animate-pulse bg-surface-soft rounded-xl" />
})

export default function HomePage() {
  const model = useHomepageModel()
  const geo = useGeolocation()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (model.showAuthMessage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">              <div className="max-w-md w-full bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 p-8 text-center space-y-6 shadow-card">
          <div className="w-14 h-14 bg-brand-light rounded-full flex items-center justify-center mx-auto">
            <LogIn className="h-6 w-6 text-brand" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-navy font-serif">Session Required</h2>
            <p className="text-sm text-navy-500">Please log in to view properties and listings.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full h-11 bg-brand hover:bg-brand-dark text-white font-semibold rounded-md">Sign In</Button>
            </Link>
            <Button variant="outline" onClick={() => model.setShowAuthMessage(false)} className="w-full h-11 font-semibold border-border text-navy-600">Continue as Guest</Button>
          </div>
        </div>
      </div>
    )
  }

  if (model.isAuthLoading || !model.authChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-navy-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (model.user?.role === 'hostel_admin') return null

  return (
    <div className="min-h-screen">

      {/* Tab Switcher */}
      <div className="w-full bg-white dark:bg-[#111b2e] border-b border-border-light dark:border-white/10 sticky top-[71px] z-40">
        <div className="max-w-content mx-auto px-4 sm:px-6">
          <div className="flex gap-1 py-3">
            <button
              type="button"
              onClick={() => model.setActiveMainTab('properties')}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                model.activeMainTab === 'properties'
                  ? 'bg-brand-light text-brand'
                  : 'text-navy-500 hover:text-navy hover:bg-surface-soft'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Properties & Rooms
              </span>
            </button>
            <button
              type="button"
              onClick={() => model.setActiveMainTab('hostels')}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                model.activeMainTab === 'hostels'
                  ? 'bg-brand-light text-brand'
                  : 'text-navy-500 hover:text-navy hover:bg-surface-soft'
              }`}
            >
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Hostels & PGs
              </span>
            </button>
          </div>
        </div>
      </div>

      {model.activeMainTab === 'properties' ? (
        <div className="space-y-0">

          {/* Hero Section — stats above search so dropdown opens into listings, not stats */}
          <section className="relative dark:bg-[#0c1222]" style={{ background: 'radial-gradient(circle at 92% 15%, rgba(75,143,135,0.10), transparent 35%), radial-gradient(circle at 4% 80%, rgba(214,154,50,0.06), transparent 28%), var(--bg)' }}>
            <div className="max-w-content mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
              
              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-serif font-bold text-navy dark:text-white leading-[1.08] tracking-tight mb-6 animate-fade-in-up stagger-1">
                Find Your Next<br />
                <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">Perfect Room</span>
              </h1>

              {/* Description */}
              <p className="text-[17px] text-navy-500 dark:text-slate-300 max-w-[640px] mx-auto leading-relaxed mb-10 animate-fade-in-up stagger-2">
                PGs, hostels, co-living spaces and private rooms — discover curated, verified listings in your city.
              </p>

              {/* Floating Search Panel — at bottom of hero, dropdown opens into listings below */}
              <div className="max-w-[780px] mx-auto animate-fade-in-up stagger-3">
                <div className="bg-white dark:bg-[#111b2e] rounded-2xl shadow-search p-3 border border-border-light dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 px-4 h-11 bg-surface-soft rounded-xl border border-border shrink-0">
                      <MapPin className="w-4 h-4 text-brand" />
                      <span className="text-[13px] font-medium text-navy">All Cities</span>
                    </div>
                    <div className="flex-1 relative">
                      <SearchBar
                        onSearch={(searchQuery, searchLocation) => {
                          model.handleFilterChange({ ...model.filters, search: searchQuery || undefined, city: searchLocation || undefined, page: 1 })
                        }}
                        initialQuery={model.filters.search || ''}
                        initialLocation={model.filters.city || ''}
                      />
                    </div>
                  </div>
                  
                  {/* Popular Chips */}
                  <div className="flex flex-wrap gap-2 mt-3 px-1">
                    {['Koramangala', 'Infopark', 'Indiranagar', 'Whitefield', 'Fort Kochi'].map((loc) => (
                      <button
                        key={loc}
                        onClick={() => model.handleFilterChange({ ...model.filters, city: loc, page: 1 })}
                        className="px-3.5 py-1.5 text-[12px] font-medium text-navy-600 dark:text-slate-300 bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-pill hover:border-brand hover:bg-brand-light hover:text-brand transition-all"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden px-4 pt-6">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-lg text-[13px] font-semibold text-navy-700 dark:text-slate-200 hover:border-brand hover:text-brand transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Mobile Filters Overlay */}
          {mobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)}>
              <div className="absolute inset-0 bg-white dark:bg-[#0c1222] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border dark:border-white/10 sticky top-0 bg-white dark:bg-[#0c1222] z-10">
                  <h3 className="text-sm font-bold text-navy">Filters</h3>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-surface-soft rounded-xl">
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <PropertyFilters filters={model.filters} onChange={(f) => { model.handleFilterChange(f); setMobileFiltersOpen(false); }} />
                </div>
              </div>
            </div>
          )}

          {/* Catalog */}
          <div className="max-w-content mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-[288px] shrink-0">
                <div className="bg-white dark:bg-[#111b2e] rounded-lg border border-border dark:border-white/10 p-5 sticky top-[140px] shadow-soft">
                  <PropertyFilters filters={model.filters} onChange={model.handleFilterChange} />
                </div>
              </aside>

              {/* Listings */}
              <div className="flex-grow space-y-5">
                
                {/* Quick Pills + View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {[
                      { label: 'All', value: undefined },
                      { label: 'For Rent', value: 'rent' },
                      { label: 'For Sale', value: 'sale' },
                      { label: 'Roommate', value: 'roommate' },
                    ].map(({ label, value }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => model.handleFilterChange({ ...model.filters, listing_type: value as any })}
                        className={`px-4 py-2 rounded-pill text-[12px] font-semibold whitespace-nowrap border transition-all ${
                          model.filters.listing_type === value
                            ? 'bg-brand text-white border-brand'
                            : 'bg-white dark:bg-[#111b2e] text-navy-600 dark:text-slate-300 border-border dark:border-white/10 hover:border-brand hover:text-brand'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-lg p-0.5">
                      {[
                        { type: 'grid', Icon: LayoutGrid },
                        { type: 'list', Icon: List },
                        { type: 'map', Icon: MapIcon },
                      ].map(({ type, Icon }) => (
                        <button key={type} type="button" onClick={() => model.setViewType(type as any)} className={`p-2 rounded-md transition-all ${model.viewType === type ? 'bg-brand-light text-brand' : 'text-navy-400 hover:text-navy'}`}>
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-navy-400" />
                      <select value={model.sortBy} onChange={(e) => model.setSortBy(e.target.value)} className="bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-lg px-3 py-2 text-[12px] font-semibold text-navy dark:text-slate-200 focus:outline-none focus:border-brand transition-all cursor-pointer">
                        <option value="newest">Newest</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Results count */}
                <p className="text-[13px] font-medium text-navy-400 dark:text-slate-400">
                  Showing <span className="font-bold text-navy dark:text-white">{model.sortedProperties.length}</span> properties
                </p>

                {/* Grid */}
                {(model.isLoading || model.isFetching) && model.sortedProperties.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => <PropertyCardSkeleton key={i} />)}
                  </div>
                ) : model.error ? (
                  <div className="py-20 text-center text-red-500 font-semibold bg-red-50 border border-red-200 rounded-xl">
                    Failed to load properties.
                  </div>
                ) : model.sortedProperties.length === 0 ? (
                  <div className="py-24 text-center bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 shadow-soft">
                    <Building2 className="w-10 h-10 text-navy-300 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-navy">No properties found</h3>
                    <p className="text-sm text-navy-400 mt-1">Try adjusting your filters or search terms.</p>
                  </div>
                ) : model.viewType === 'map' ? (
                  <PropertyMap properties={model.sortedProperties} />
                ) : (
                  <div className={model.viewType === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-4"}>
                    {model.sortedProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        viewType={model.viewType === 'grid' ? 'grid' : 'list'}
                        userLocation={geo.latitude && geo.longitude ? { latitude: geo.latitude, longitude: geo.longitude } : null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Hostels Hero */}
          <section className="relative overflow-hidden" style={{ background: 'radial-gradient(circle at 90% 20%, rgba(75,143,135,0.08), transparent 35%), var(--bg)' }}>
            <div className="max-w-content mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
              <div className="inline-flex items-center gap-2 bg-brand-light border border-brand-200 rounded-pill px-4 py-2 mb-8">
                <span className="w-2 h-2 bg-brand rounded-full" />
                <span className="text-[13px] font-semibold text-brand">Verified PGs & Shared Hostels</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-serif font-bold text-navy dark:text-white leading-[1.08] tracking-tight mb-6">
                Home Away From<br />
                <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">Home</span>
              </h1>
              <p className="text-[17px] text-navy-500 dark:text-slate-300 max-w-[640px] mx-auto leading-relaxed">
                Explore student hostels, PG spaces, co-living suites, and flatmate listings with verified facilities and reviews.
              </p>
            </div>
          </section>

          {/* Hostels Finder */}
          <div className="max-w-content mx-auto px-4 sm:px-6 py-8">
            <HostelFinder hideBanner={true} />
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-brand text-white rounded-full shadow-floating hover:shadow-card-hover hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
