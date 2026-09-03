'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Cross, GraduationCap, BookOpen, Pill, UtensilsCrossed, Coffee,
  ShoppingCart, TreePine, Dumbbell, Landmark, Bus, TrainFront, Train,
  Fuel, Building2, Library, Mail, MapPin, Clock, Footprints, Car,
  ChevronDown, ChevronUp, Search, Filter, Loader2
} from 'lucide-react'
import {
  fetchNearbyPlaces, formatDistanceKm, estimateWalkMinutes, estimateDriveMinutes,
  type NearbyPlace, type PlaceCategory, PLACE_CATEGORIES
} from '@/utils/nearby-places'

const ICON_MAP: Record<string, any> = {
  Cross, GraduationCap, BookOpen, Pill, UtensilsCrossed, Coffee,
  ShoppingCart, TreePine, Dumbbell, Landmark, Bus, TrainFront, Train,
  Fuel, Building2, Library, Mail,
}

interface NearbyPlacesProps {
  latitude: number
  longitude: number
  radiusKm?: number
}

const KEY_CATEGORIES: PlaceCategory[] = [
  'hospital', 'school', 'college', 'pharmacy', 'grocery', 'park',
  'bus', 'metro', 'railway', 'restaurant', 'cafe', 'gym',
  'atm', 'bank', 'fuel', 'library', 'post_office'
]

export const NearbyPlaces: React.FC<NearbyPlacesProps> = ({
  latitude,
  longitude,
  radiusKm = 3,
}) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | 'all'>('all')
  const [expandedCategory, setExpandedCategory] = useState<PlaceCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // Check localStorage cache first (1 hour TTL)
    const cacheKey = `nearby-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radiusKm}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 3600000) {
          setPlaces(data)
          setLoading(false)
          return () => { cancelled = true }
        }
      }
    } catch {}

    fetchNearbyPlaces(latitude, longitude, radiusKm * 1000)
      .then((result) => {
        if (!cancelled) {
          setPlaces(result)
          setLoading(false)
          try {
            if (result.length > 0) {
              localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }))
            }
          } catch {}
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load nearby places')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [latitude, longitude, radiusKm, retryCount])

  // Group places by category
  const grouped = useMemo(() => {
    const map: Record<string, NearbyPlace[]> = {}
    const filtered = activeCategory === 'all'
      ? places
      : places.filter((p) => p.category === activeCategory)

    const searchFiltered = searchQuery
      ? filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : filtered

    for (const place of searchFiltered) {
      if (!map[place.category]) map[place.category] = []
      map[place.category].push(place)
    }
    return map
  }, [places, activeCategory, searchQuery])

  // Count per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const place of places) {
      counts[place.category] = (counts[place.category] || 0) + 1
    }
    return counts
  }, [places])

  // Active categories sorted by count
  const activeCategories = useMemo(() => {
    return Object.keys(grouped)
      .sort((a, b) => (grouped[b]?.length || 0) - (grouped[a]?.length || 0)) as PlaceCategory[]
  }, [grouped])

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
          <h3 className="text-lg font-bold text-navy dark:text-white font-serif">Nearby Places</h3>
        </div>
        <p className="text-sm text-navy-400 dark:text-slate-400">
          Scanning for hospitals, schools, transit & more within {radiusKm} km...
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton rounded-xl h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-light dark:bg-brand/15 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-brand" />
          </div>
          <h3 className="text-lg font-bold text-navy dark:text-white font-serif">Nearby Places</h3>
        </div>
        <p className="text-sm text-navy-400 dark:text-slate-400 mb-4">{error}</p>
        <button
          onClick={() => {
            try {
              const cacheKey = `nearby-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radiusKm}`
              localStorage.removeItem(cacheKey)
            } catch {}
            setError(null)
            setLoading(true)
            setRetryCount(c => c + 1)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-lg transition-all"
        >
          <Loader2 className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 p-6">
        <h3 className="text-lg font-bold text-navy dark:text-white font-serif mb-2">Nearby Places</h3>
        <p className="text-sm text-navy-400 dark:text-slate-400">
          No nearby places found within {radiusKm} km. The property owner can add nearby landmarks.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#111b2e] rounded-xl border border-border dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-light dark:bg-brand/15 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy dark:text-white font-serif">Nearby Places</h3>
              <p className="text-[12px] text-navy-400 dark:text-slate-400">
                {places.length} places within {radiusKm} km
              </p>
            </div>
          </div>
        </div>

        {/* Search with Dropdown */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search nearby places..."
            className="w-full h-9 pl-10 pr-4 bg-surface-soft dark:bg-white/5 border border-border dark:border-white/10 rounded-lg text-[13px] text-navy dark:text-slate-200 placeholder:text-navy-300 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />

          {/* Dropdown */}
          {searchFocused && searchQuery.length >= 1 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {(() => {
                const q = searchQuery.toLowerCase()
                const matches = places
                  .filter((p) => p.name.toLowerCase().includes(q) || (p.address && p.address.toLowerCase().includes(q)))
                  .slice(0, 12)
                if (matches.length === 0) {
                  return (
                    <div className="px-4 py-5 text-center">
                      <Search className="w-5 h-5 mx-auto mb-1.5 text-navy-300 dark:text-slate-500" />
                      <p className="text-[12px] text-navy-400 dark:text-slate-500">No places found matching "{searchQuery}"</p>
                    </div>
                  )
                }
                return matches.map((place) => {
                  const config = PLACE_CATEGORIES[place.category]
                  const Icon = config ? ICON_MAP[config.icon] : MapPin
                  const walkMin = estimateWalkMinutes(place.distance)
                  return (
                    <button
                      key={place.id}
                      onClick={() => {
                        setSearchQuery(place.name)
                        setActiveCategory(place.category)
                        setSearchFocused(false)
                        // Scroll to category section
                        setExpandedCategory(place.category)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-soft dark:hover:bg-white/[0.05] transition-colors text-left border-b border-border-light dark:border-white/5 last:border-b-0"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${config?.color}15` }}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" style={{ color: config?.color }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-navy dark:text-white truncate">{place.name}</p>
                        <p className="text-[11px] text-navy-400 dark:text-slate-500 truncate">
                          {config?.label} {place.address && `· ${place.address}`}
                        </p>
                      </div>
                      <span className="text-[12px] font-bold text-brand shrink-0">{formatDistanceKm(place.distance)}</span>
                      <span className="flex items-center gap-0.5 text-[11px] text-navy-400 dark:text-slate-500 shrink-0">
                        <Footprints className="w-3 h-3" /> {walkMin}m
                      </span>
                    </button>
                  )
                })
              })()}
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-pill text-[11px] font-semibold whitespace-nowrap border transition-all ${
              activeCategory === 'all'
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-[#0c1222] text-navy-600 dark:text-slate-300 border-border dark:border-white/10 hover:border-brand hover:text-brand'
            }`}
          >
            All ({places.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => {
            const config = PLACE_CATEGORIES[cat as PlaceCategory]
            if (!config) return null
            const Icon = ICON_MAP[config.icon]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat as PlaceCategory)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-pill text-[11px] font-semibold whitespace-nowrap border transition-all ${
                  activeCategory === cat
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-[#0c1222] text-navy-600 dark:text-slate-300 border-border dark:border-white/10 hover:border-brand hover:text-brand'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {config.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Groups */}
      <div className="border-t border-border dark:border-white/10">
        {activeCategories.map((cat) => {
          const config = PLACE_CATEGORIES[cat]
          const Icon = config ? ICON_MAP[config.icon] : MapPin
          const items = grouped[cat] || []
          const isExpanded = expandedCategory === cat || activeCategory !== 'all'
          const displayItems = isExpanded ? items : items.slice(0, 3)

          return (
            <div key={cat} className="border-b border-border-light dark:border-white/5 last:border-b-0">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-soft dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config?.color}15` }}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" style={{ color: config?.color }} />}
                  </div>
                  <span className="text-[13px] font-bold text-navy dark:text-white">
                    {config?.label || cat}
                  </span>
                  <span className="text-[11px] font-semibold text-navy-400 dark:text-slate-500 bg-surface-soft dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                {items.length > 3 && activeCategory === 'all' && (
                  isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-navy-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-navy-400" />
                  )
                )}
              </button>

              {/* Place Items */}
              <div className="px-5 pb-2 space-y-1">
                {displayItems.map((place) => (
                  <PlaceItem key={place.id} place={place} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Individual Place Item ─────────────────────────────── */
const PlaceItem: React.FC<{ place: NearbyPlace }> = ({ place }) => {
  const config = PLACE_CATEGORIES[place.category]
  const walkMin = estimateWalkMinutes(place.distance)
  const driveMin = estimateDriveMinutes(place.distance)

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-soft dark:hover:bg-white/[0.03] transition-colors group">
      {/* Distance badge */}
      <div className="w-14 shrink-0 text-center">
        <span className="text-[13px] font-bold text-brand">{formatDistanceKm(place.distance)}</span>
      </div>

      {/* Name + address */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-navy dark:text-white truncate group-hover:text-brand transition-colors">
          {place.name}
        </p>
        {place.address && (
          <p className="text-[11px] text-navy-400 dark:text-slate-500 truncate">{place.address}</p>
        )}
      </div>

      {/* Travel times */}
      <div className="flex items-center gap-2.5 shrink-0">
        {walkMin <= 30 && (
          <span className="flex items-center gap-1 text-[11px] text-navy-400 dark:text-slate-500" title={`~${walkMin} min walk`}>
            <Footprints className="w-3 h-3" />
            {walkMin}m
          </span>
        )}
        <span className="flex items-center gap-1 text-[11px] text-navy-400 dark:text-slate-500" title={`~${driveMin} min drive`}>
          <Car className="w-3 h-3" />
          {driveMin}m
        </span>
      </div>
    </div>
  )
}

export default NearbyPlaces
