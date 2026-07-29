'use client'

import React from 'react'
import { useHomepageModel } from './HomepageModel'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { PropertyFilters } from '@/components/properties/PropertyFilters'
import { ArrowUpDown, Sparkles, Building2, Users, CheckCircle, LayoutGrid, List, Map as MapIcon, Compass } from 'lucide-react'
import { HostelFinder } from '@/components/properties/HostelFinder'
import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('@/components/properties/PropertyMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />
})

export default function HomePage() {
  const model = useHomepageModel()

  if (model.isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400"></div>
      </div>
    )
  }

  if (!model.user || model.user.role === 'hostel_admin') return null

  return (
    <div className="pb-24 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 min-h-screen">
      
      {/* 1. High-End Glassmorphic Header Tab Switcher (Sticky at top-[64px]) */}
      <div className="w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 sticky top-[64px] z-40 py-4 px-4 sm:px-6 shadow-sm transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-100/60 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-850/80 flex gap-2 relative shadow-inner">
            
            {/* Tab 1: Properties */}
            <button
              type="button"
              onClick={() => model.setActiveMainTab('properties')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 relative z-10 overflow-hidden ${
                model.activeMainTab === 'properties'
                  ? 'text-white shadow-[0_4px_20px_rgba(99,102,241,0.25)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {model.activeMainTab === 'properties' && (
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-xl -z-10 animate-fade-in"></span>
              )}
              <Building2 className={`w-4.5 h-4.5 transition-transform duration-350 ${model.activeMainTab === 'properties' ? 'scale-110 rotate-1' : 'group-hover:scale-105'}`} />
              <span>Properties & Rooms</span>
            </button>

            {/* Tab 2: Hostels */}
            <button
              type="button"
              onClick={() => model.setActiveMainTab('hostels')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 relative z-10 overflow-hidden ${
                model.activeMainTab === 'hostels'
                  ? 'text-white shadow-[0_4px_20px_rgba(147,51,234,0.25)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {model.activeMainTab === 'hostels' && (
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 rounded-xl -z-10 animate-fade-in"></span>
              )}
              <Compass className={`w-4.5 h-4.5 transition-transform duration-350 ${model.activeMainTab === 'hostels' ? 'scale-110 rotate-1' : 'group-hover:scale-105'}`} />
              <span>Hostels & PGs</span>
            </button>

          </div>
        </div>
      </div>

      {/* 2. Content Sections based on Active Tab */}
      {model.activeMainTab === 'properties' ? (
        <div className="space-y-12">
          
          {/* Hero Section: Properties tab */}
          <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-center relative overflow-hidden border-b border-slate-850 shadow-xl py-20 px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-950/80 dark:bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-[10px] font-black tracking-widest uppercase mb-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                Verified Rentals & Co-living
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
                Find Your Next Room
              </h1>
              <p className="text-slate-400 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-semibold">
                MyNilam connects you to verified premium flats, luxury houses, commercial hubs, and shared roommate spaces with zero hassle.
              </p>
            </div>
            
            {/* Quick Metrics */}
            <div className="relative z-10 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto px-4">
              {[
                { icon: Building2, label: 'Listed Units', value: '1,200+' },
                { icon: Users, label: 'Matched Flatmates', value: '500+' },
                { icon: Sparkles, label: 'Luxury Homes', value: '150+' },
                { icon: CheckCircle, label: 'Verification Rate', value: '100%' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 text-white flex flex-col items-center hover:border-indigo-500/30 hover:shadow-[0_4px_25px_rgba(99,102,241,0.08)] transition-all duration-350 group cursor-default">
                  <div className="p-3 bg-slate-850 rounded-xl group-hover:scale-110 group-hover:bg-indigo-950/40 transition-all duration-300 mb-3">
                    <stat.icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="text-2xl font-black tracking-tight">{stat.value}</span>
                  <span className="text-[9px] font-extrabold text-slate-550 mt-1.5 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Properties Catalog Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Filters Sidebar */}
              <aside className="w-full lg:w-80 shrink-0">
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm sticky top-[160px]">
                  <PropertyFilters filters={model.filters} onChange={model.handleFilterChange} />
                </div>
              </aside>

              {/* Listings Feed */}
              <div className="flex-grow space-y-6">
                
                {/* Top Quick Pills */}
                <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide pt-1">
                  <button
                    type="button"
                    onClick={() => model.handleFilterChange({ ...model.filters, listing_type: undefined })}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border hover:scale-[1.02] active:scale-95 duration-200 ${!model.filters.listing_type ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-950 dark:border-indigo-650 shadow-[0_4px_15px_rgba(99,102,241,0.25)]' : 'bg-white dark:bg-slate-900/60 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'}`}
                  >
                    All Listings
                  </button>
                  <button
                    type="button"
                    onClick={() => model.handleFilterChange({ ...model.filters, listing_type: 'rent' })}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border hover:scale-[1.02] active:scale-95 duration-200 ${model.filters.listing_type === 'rent' ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-950 dark:border-indigo-650 shadow-[0_4px_15px_rgba(99,102,241,0.25)]' : 'bg-white dark:bg-slate-900/60 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'}`}
                  >
                    For Rent
                  </button>
                  <button
                    type="button"
                    onClick={() => model.handleFilterChange({ ...model.filters, listing_type: 'sale' })}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border hover:scale-[1.02] active:scale-95 duration-200 ${model.filters.listing_type === 'sale' ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-950 dark:border-indigo-650 shadow-[0_4px_15px_rgba(99,102,241,0.25)]' : 'bg-white dark:bg-slate-900/60 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'}`}
                  >
                    For Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => model.handleFilterChange({ ...model.filters, listing_type: 'roommate' })}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border hover:scale-[1.02] active:scale-95 duration-200 ${model.filters.listing_type === 'roommate' ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-950 dark:border-indigo-650 shadow-[0_4px_15px_rgba(99,102,241,0.25)]' : 'bg-white dark:bg-slate-900/60 text-slate-655 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'}`}
                  >
                    Flat / Room Share
                  </button>
                </div>

                {/* View Controls & Result Count */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider">
                      Showing <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">{model.sortedProperties.length}</span> property results
                    </p>
                    
                    {/* View Toggler */}
                    <div className="flex items-center bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                      <button type="button" onClick={() => model.setViewType('grid')} className={`p-2 rounded-lg transition-all ${model.viewType === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => model.setViewType('list')} className={`p-2 rounded-lg transition-all ${model.viewType === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-650 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        <List className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => model.setViewType('map')} className={`p-2 rounded-lg transition-all ${model.viewType === 'map' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-650 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        <MapIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sorting */}
                  <div className="flex items-center space-x-2">
                    <ArrowUpDown className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sort by:</span>
                    <select 
                      value={model.sortBy}
                      onChange={(e) => model.setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl hover:border-slate-350 transition-colors"
                    >
                      <option value="newest" className="dark:bg-slate-900">Newest Ads</option>
                      <option value="price_low" className="dark:bg-slate-900">Price: Low to High</option>
                      <option value="price_high" className="dark:bg-slate-900">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Properties Grid */}
                {model.isLoading ? (
                  <div className="w-full py-20 flex justify-center">
                    <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin dark:border-indigo-400"></div>
                  </div>
                ) : model.error ? (
                  <div className="w-full py-20 text-center text-red-500 font-bold bg-red-500/5 border border-red-550/20 rounded-3xl">
                    Failed to load properties list.
                  </div>
                ) : model.sortedProperties.length === 0 ? (
                  <div className="w-full py-24 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400 border border-slate-100 dark:border-slate-800">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No properties match your filters</h3>
                    <p className="text-xs text-slate-500 mt-1">Try adapting your price bounds or location specifications.</p>
                  </div>
                ) : model.viewType === 'map' ? (
                  <PropertyMap properties={model.sortedProperties} />
                ) : (
                  <div className={model.viewType === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
                    {model.sortedProperties.map((property) => (
                      <PropertyCard key={property.id} property={property} viewType={model.viewType === 'grid' ? 'grid' : 'list'} />
                    ))}
                  </div>
                )}

              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Hero Section: Hostels tab */}
          <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-center relative overflow-hidden border-b border-slate-850 shadow-xl py-20 px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-955/40 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-955/80 dark:bg-purple-900/30 border border-purple-500/30 text-purple-300 text-[10px] font-black tracking-widest uppercase mb-1 shadow-sm">
                <Compass className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
                Verified PGs & Shared Hostels
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
                Home Away From Home
              </h1>
              <p className="text-slate-400 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-semibold">
                Explore student hostels, PG spaces, co-living suites, and flatmate listings with verified facilities and reviews.
              </p>
            </div>
            
            {/* Hostels Metrics */}
            <div className="relative z-10 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto px-4">
              {[
                { icon: Compass, label: 'Hostel Listings', value: '450+' },
                { icon: Users, label: 'PG Bed Spaces', value: '1,200+' },
                { icon: Sparkles, label: 'Premium Perks', value: 'WiFi/Mess/AC' },
                { icon: CheckCircle, label: 'Brokerage Fee', value: '0%' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 text-white flex flex-col items-center hover:border-purple-500/30 hover:shadow-[0_4px_25px_rgba(168,85,247,0.08)] transition-all duration-350 group cursor-default">
                  <div className="p-3 bg-slate-850 rounded-xl group-hover:scale-110 group-hover:bg-purple-950/40 transition-all duration-300 mb-3">
                    <stat.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-2xl font-black tracking-tight">{stat.value}</span>
                  <span className="text-[9px] font-extrabold text-slate-500 mt-1.5 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Hostels Finder Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <HostelFinder hideBanner={true} />
          </div>
        </div>
      )}
    </div>
  )
}