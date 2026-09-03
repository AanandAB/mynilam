'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin, X, Clock, TrendingUp, ArrowRight, Home, Building2, Users, Navigation, Loader2, Compass } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string, location?: string) => void
  initialQuery?: string
  initialLocation?: string
}

interface NearbyLocation {
  name: string
  type: string
  distance: number
}

const POPULAR_LOCATIONS = [
  { name: 'Kochi', area: 'Kerala' },
  { name: 'Bengaluru', area: 'Karnataka' },
  { name: 'Thiruvananthapuram', area: 'Kerala' },
  { name: 'Koramangala', area: 'Bengaluru' },
  { name: 'MG Road', area: 'Kochi' },
  { name: 'Infopark', area: 'Kochi' },
  { name: 'Edappally', area: 'Kochi' },
  { name: 'Palarivattom', area: 'Kochi' },
  { name: 'Fort Kochi', area: 'Kochi' },
  { name: 'Panampilly Nagar', area: 'Kochi' },
  { name: 'Whitefield', area: 'Bengaluru' },
  { name: 'Indiranagar', area: 'Bengaluru' },
  { name: 'Kazhakoottam', area: 'Thiruvananthapuram' },
  { name: 'Thrissur', area: 'Kerala' },
  { name: 'Kozhikode', area: 'Kerala' },
]

const TRENDING_PROPERTIES = [
  { text: '2BHK apartment near Infopark', icon: Building2 },
  { text: 'Boys hostel with food', icon: Home },
  { text: 'Shared room for women', icon: Users },
  { text: '3BHK rent under 30000', icon: Building2 },
  { text: 'PG with WiFi and AC', icon: Home },
]

const RECENT_SEARCHES_KEY = 'mynilam_recent_searches'
const RECENT_LOCATIONS_KEY = 'mynilam_recent_locations'
const NEARBY_LOCATIONS_CACHE_KEY = 'mynilam_nearby_locations'
const NEARBY_LOCATIONS_CACHE_TTL = 30 * 60 * 1000 // 30 min

function getRecent(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveRecent(key: string, item: string) {
  const items = getRecent(key).filter((s) => s !== item)
  items.unshift(item)
  localStorage.setItem(key, JSON.stringify(items.slice(0, 6)))
}

/** Haversine distance in km */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Fetch nearby localities/taluks/areas from Overpass API */
async function fetchNearbyLocations(lat: number, lon: number, radiusKm: number = 15): Promise<NearbyLocation[]> {
  // Check cache first
  try {
    const cached = localStorage.getItem(NEARBY_LOCATIONS_CACHE_KEY)
    if (cached) {
      const { locations, cachedAt, cachedLat, cachedLon } = JSON.parse(cached)
      const distFromCache = haversineDistance(lat, lon, cachedLat, cachedLon)
      if (Date.now() - cachedAt < NEARBY_LOCATIONS_CACHE_TTL && distFromCache < 2) {
        return locations
      }
    }
  } catch { /* ignore */ }

  const radiusMeters = radiusKm * 1000
  const query = `
    [out:json][timeout:15];
    (
      // Administrative boundaries (districts, taluks, blocks)
      way["boundary"="administrative"]["admin_level"~"^(6|7|8|9)$"](around:${radiusMeters},${lat},${lon});
      // Suburbs and neighbourhoods
      way["place"~"^(suburb|neighbourhood|quarter|residential)$"](around:${radiusMeters},${lat},${lon});
      // Named localities
      node["place"~"^(suburb|neighbourhood|quarter|hamlet|locality|village|town|city)$"](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ]

  let elements: any[] = []
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const resp = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!resp.ok) continue
      const data = await resp.json()
      elements = data.elements || []
      break
    } catch { continue }
  }

  const locations: NearbyLocation[] = elements
    .map((el): NearbyLocation | null => {
      const tags = el.tags || {}
      const name = tags.name || tags['name:en'] || ''
      if (!name) return null

      const lat2 = el.lat || el.center?.lat
      const lon2 = el.lon || el.center?.lon
      if (!lat2 || !lon2) return null

      const distance = haversineDistance(lat, lon, lat2, lon2)

      // Determine a friendly type label
      let type = ''
      if (tags.admin_level === '6') type = 'District'
      else if (tags.admin_level === '7') type = 'Taluk'
      else if (tags.admin_level === '8') type = 'Block'
      else if (tags.admin_level === '9') type = 'Panchayat'
      else if (tags.place === 'suburb') type = 'Suburb'
      else if (tags.place === 'neighbourhood' || tags.place === 'quarter') type = 'Locality'
      else if (tags.place === 'town') type = 'Town'
      else if (tags.place === 'city') type = 'City'
      else if (tags.place === 'village') type = 'Village'
      else if (tags.place === 'hamlet') type = 'Village'
      else if (tags.place === 'locality') type = 'Locality'
      else type = 'Area'

      return { name, type, distance: Math.round(distance * 10) / 10 }
    })
    .filter((item): item is NearbyLocation => item !== null)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 30)

  // Cache results
  try {
    localStorage.setItem(NEARBY_LOCATIONS_CACHE_KEY, JSON.stringify({
      locations,
      cachedAt: Date.now(),
      cachedLat: lat,
      cachedLon: lon,
    }))
  } catch { /* ignore */ }

  return locations
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery = '', initialLocation = '' }) => {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [focusedField, setFocusedField] = useState<'search' | 'location' | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentLocations, setRecentLocations] = useState<string[]>([])
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const geolocationRef = useRef<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    setRecentSearches(getRecent(RECENT_SEARCHES_KEY))
    setRecentLocations(getRecent(RECENT_LOCATIONS_KEY))
  }, [])

  // Fetch nearby locations when location input is focused
  const loadNearbyLocations = useCallback(() => {
    if (nearbyLocations.length > 0 || nearbyLoading) return

    // Try cached geolocation first
    if (geolocationRef.current) {
      setNearbyLoading(true)
      fetchNearbyLocations(geolocationRef.current.lat, geolocationRef.current.lon)
        .then((locs) => { setNearbyLocations(locs); setNearbyLoading(false) })
        .catch(() => setNearbyLoading(false))
      return
    }

    setNearbyLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geolocationRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        fetchNearbyLocations(pos.coords.latitude, pos.coords.longitude)
          .then((locs) => { setNearbyLocations(locs); setNearbyLoading(false) })
          .catch(() => setNearbyLoading(false))
      },
      () => {
        setNearbyLoading(false)
        // Fallback: try to use a default location (Kochi)
        geolocationRef.current = { lat: 9.9312, lon: 76.2673 }
        fetchNearbyLocations(9.9312, 76.2673)
          .then((locs) => setNearbyLocations(locs))
          .catch(() => {})
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  }, [nearbyLocations.length, nearbyLoading])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocusedField(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = useCallback((q?: string, l?: string) => {
    const searchQ = q ?? query
    const searchL = l ?? location
    if (searchQ.trim()) saveRecent(RECENT_SEARCHES_KEY, searchQ.trim())
    if (searchL.trim()) saveRecent(RECENT_LOCATIONS_KEY, searchL.trim())
    setRecentSearches(getRecent(RECENT_SEARCHES_KEY))
    setRecentLocations(getRecent(RECENT_LOCATIONS_KEY))
    onSearch(searchQ, searchL || undefined)
    setFocusedField(null)
  }, [query, location, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setFocusedField(null)
  }

  const clearSearch = () => {
    setQuery('')
    setLocation('')
    onSearch('', '')
    searchInputRef.current?.focus()
  }

  const selectProperty = (text: string) => {
    setQuery(text)
    handleSubmit(text)
  }

  const selectLocation = (loc: string) => {
    setLocation(loc)
    handleSubmit(query || undefined, loc)
  }

  const clearRecent = (key: string) => {
    localStorage.removeItem(key)
    if (key === RECENT_SEARCHES_KEY) setRecentSearches([])
    else setRecentLocations([])
  }

  const showSearchDropdown = focusedField === 'search'
  const showLocationDropdown = focusedField === 'location'

  // Filter nearby locations based on typed text
  const filteredNearby = locationFilter
    ? nearbyLocations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(locationFilter.toLowerCase()) ||
          loc.type.toLowerCase().includes(locationFilter.toLowerCase())
      )
    : nearbyLocations

  // Group nearby locations by type
  const groupedNearby = filteredNearby.reduce<Record<string, NearbyLocation[]>>((acc, loc) => {
    if (!acc[loc.type]) acc[loc.type] = []
    acc[loc.type].push(loc)
    return acc
  }, {})

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto z-30">
      {/* Main Search Bar */}
      <div className="bg-white dark:bg-[#111b2e] rounded-2xl border border-border dark:border-white/10 shadow-card overflow-visible">
        <div className="flex items-center">
          {/* Search input */}
          <div className="flex items-center flex-1 pl-4">
            <Search className="w-5 h-4 text-navy-300 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocusedField('search')}
              onKeyDown={handleKeyDown}
              placeholder="Search properties, hostels, PGs..."
              className="flex-1 bg-transparent px-3 py-4 text-sm font-medium text-navy dark:text-slate-200 placeholder-navy-300 focus:outline-none"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Location input */}
          <div className="flex items-center px-3">
            <MapPin className="w-4 h-4 text-navy-300 shrink-0" />
            <input
              ref={locationInputRef}
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setLocationFilter(e.target.value)
              }}
              onFocus={() => {
                setFocusedField('location')
                loadNearbyLocations()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Location"
              className="bg-transparent px-2 py-4 text-sm font-medium text-navy dark:text-slate-200 placeholder-navy-300 focus:outline-none w-32 sm:w-44"
            />
          </div>

          {/* Clear */}
          {(query || location) && (
            <button onClick={clearSearch} className="p-2 text-navy-300 hover:text-navy-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search button */}
          <button
            onClick={() => handleSubmit()}
            className="m-1.5 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* ===== SEARCH DROPDOWN ===== */}
      {showSearchDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-2xl shadow-floating overflow-hidden z-50 max-h-[380px] overflow-y-auto animate-fade-in">
          <div className="flex border-b border-border-light">
            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-brand border-b-2 border-brand"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </button>
            <button
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider text-navy-300"
            >
              <Clock className="w-3.5 h-3.5" />
              Recent
            </button>
          </div>

          <div className="p-3 space-y-1">
            {recentSearches.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 py-1">
                  <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest">Recent searches</p>
                  <button onClick={() => clearRecent(RECENT_SEARCHES_KEY)} className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-wider">Clear</button>
                </div>
                {recentSearches.map((search, i) => (
                  <button key={i} onClick={() => selectProperty(search)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group text-left"
                  >
                    <Clock className="w-4 h-4 text-navy-200" />
                    <span className="text-sm font-medium text-navy-700 dark:text-slate-300 flex-1 truncate">{search}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-navy-200 group-hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                <div className="border-t border-border-light my-1" />
              </>
            )}

            <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest px-3 py-1">Trending searches</p>
            {TRENDING_PROPERTIES.map((item, i) => {
              const Icon = item.icon
              return (
                <button key={i} onClick={() => selectProperty(item.text)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group text-left"
                >
                  <div className="p-1.5 bg-surface-soft rounded-lg group-hover:bg-brand-light transition-colors">
                    <Icon className="w-3.5 h-3.5 text-navy-300 group-hover:text-brand" />
                  </div>
                  <span className="text-sm font-medium text-navy-700 dark:text-slate-300 flex-1 truncate">{item.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-navy-200 group-hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== LOCATION DROPDOWN — Shows nearby localities ===== */}
      {showLocationDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111b2e] border border-border dark:border-white/10 rounded-2xl shadow-floating overflow-hidden z-50 max-h-[420px] overflow-y-auto animate-fade-in">
          <div className="p-3 space-y-1">
            {/* Nearby locations loading */}
            {nearbyLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-navy-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Finding nearby locations...</span>
              </div>
            )}

            {/* Nearby locations from OpenStreetMap */}
            {!nearbyLoading && nearbyLocations.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1">
                  <Compass className="w-3.5 h-3.5 text-brand" />
                  <p className="text-[10px] font-bold text-brand uppercase tracking-widest">
                    Nearby locations {geolocationRef.current ? '(based on your location)' : ''}
                  </p>
                </div>

                {Object.entries(groupedNearby).map(([type, locations]) => (
                  <div key={type} className="mb-1">
                    <p className="text-[9px] font-bold text-navy-300 uppercase tracking-widest px-3 py-0.5 mt-2">{type}</p>
                    {locations.map((loc) => (
                      <button
                        key={`${loc.name}-${loc.distance}`}
                        onClick={() => selectLocation(loc.name)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors group text-left"
                      >
                        <div className="p-1.5 bg-brand-light rounded-lg">
                          <Navigation className="w-3.5 h-3.5 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-navy-700 dark:text-slate-300 block truncate">{loc.name}</span>
                          <span className="text-[11px] text-navy-300">{loc.distance} km away</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-navy-200 group-hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                ))}

                <div className="border-t border-border-light my-2" />
              </>
            )}

            {/* Empty nearby + no filter typed */}
            {!nearbyLoading && nearbyLocations.length === 0 && !locationFilter && (
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <Compass className="w-4 h-4 text-navy-300" />
                <span className="text-xs text-navy-300">Type to search or use your location for nearby places</span>
              </div>
            )}

            {/* Recent locations */}
            {recentLocations.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 py-1">
                  <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest">Recent locations</p>
                  <button onClick={() => clearRecent(RECENT_LOCATIONS_KEY)} className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-wider">Clear</button>
                </div>
                {recentLocations.map((loc, i) => (
                  <button key={i} onClick={() => selectLocation(loc)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group text-left"
                  >
                    <Clock className="w-4 h-4 text-navy-200" />
                    <span className="text-sm font-medium text-navy-700 dark:text-slate-300 flex-1">{loc}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-navy-200 group-hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
                <div className="border-t border-border-light my-1" />
              </>
            )}

            {/* Popular locations (always shown as fallback) */}
            <p className="text-[10px] font-bold text-navy-300 uppercase tracking-widest px-3 py-1">Popular locations</p>
            {POPULAR_LOCATIONS
              .filter((loc) =>
                !locationFilter ||
                loc.name.toLowerCase().includes(locationFilter.toLowerCase()) ||
                loc.area.toLowerCase().includes(locationFilter.toLowerCase())
              )
              .map((loc) => (
              <button key={loc.name} onClick={() => selectLocation(loc.name)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group text-left"
              >
                <div className="p-1.5 bg-surface-soft rounded-lg">
                  <Navigation className="w-3.5 h-3.5 text-navy-300" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-navy-700 dark:text-slate-300 block">{loc.name}</span>
                  <span className="text-[11px] text-navy-300">{loc.area}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-navy-200 group-hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
