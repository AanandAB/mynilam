'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, Navigation, MapPin, X, Loader2, Route, Clock, Bike, Car } from 'lucide-react'
import { geocodeLocation, type GeocodingResult } from '@/utils/geocode'
import { getDistanceKm, formatDistance } from '@/utils/distance'
import { fetchRoute, formatDuration } from '@/utils/routing'

const propertyIcon = L.divIcon({
  className: 'property-marker',
  html: `<div class="flex items-center justify-center"><div class="w-7 h-7 rounded-full shadow-lg flex items-center justify-center" style="background:linear-gradient(135deg,#0d9488,#0f766e)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const searchIcon = L.divIcon({
  className: 'search-marker',
  html: `<div class="flex items-center justify-center"><div class="w-7 h-7 rounded-full shadow-lg flex items-center justify-center" style="background:linear-gradient(135deg,#2563eb,#1d4ed8)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function MapUpdater({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap()
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [bounds, map])
  return null
}

interface DistanceCalculatorProps {
  propertyLatitude: number | null
  propertyLongitude: number | null
  propertyAddress?: string
  propertyCity?: string
}

export function DistanceCalculator({
  propertyLatitude,
  propertyLongitude,
  propertyAddress,
  propertyCity,
}: DistanceCalculatorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [roadRoute, setRoadRoute] = useState<import('@/utils/routing').RouteResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasPropertyCoords = propertyLatitude != null && propertyLongitude != null
  const propertyLatLng: [number, number] | null = hasPropertyCoords
    ? [propertyLatitude!, propertyLongitude!]
    : null

  // Straight-line distance for display
  const straightDistance =
    selectedLocation && propertyLatLng
      ? getDistanceKm(
          selectedLocation.latitude,
          selectedLocation.longitude,
          propertyLatLng[0],
          propertyLatLng[1]
        )
      : null

  // Use road route geometry if available, else straight line
  const displayGeometry =
    roadRoute?.geometry ||
    (selectedLocation && propertyLatLng
      ? [[selectedLocation.latitude, selectedLocation.longitude], propertyLatLng] as [number, number][]
      : [])

  const mapBounds: L.LatLngBoundsExpression | null =
    selectedLocation && propertyLatLng
      ? [
          [selectedLocation.latitude, selectedLocation.longitude],
          propertyLatLng,
        ]
      : null

  // Fetch driving route only (fast — 1 request). Estimate walking/cycling from it.
  useEffect(() => {
    if (!selectedLocation || !propertyLatLng) {
      setRoadRoute(null)
      return
    }

    let cancelled = false

    fetchRoute(
      selectedLocation.latitude, selectedLocation.longitude,
      propertyLatLng[0], propertyLatLng[1],
      'driving'
    ).then((route) => {
      if (!cancelled) setRoadRoute(route)
    }).catch(() => {
      // Fallback to straight-line
    })

    return () => { cancelled = true }
  }, [selectedLocation?.latitude, selectedLocation?.longitude, propertyLatLng?.[0], propertyLatLng?.[1]])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setError(null)
    setShowResults(true)
    try {
      const results = await geocodeLocation(searchQuery)
      setSearchResults(results)
      if (results.length === 0) {
        setError('No locations found. Try a different search term.')
      }
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  const handleSelect = (result: GeocodingResult) => {
    setSelectedLocation(result)
    setSearchQuery(result.shortName)
    setShowResults(false)
    setSearchResults([])
  }

  const handleClear = () => {
    setSelectedLocation(null)
    setSearchQuery('')
    setSearchResults([])
    setError(null)
    setShowResults(false)
    setRoadRoute(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') setShowResults(false)
  }

  if (!hasPropertyCoords) {
    return (
      <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          <Navigation className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Distance Calculator
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Exact location is not available for this property. The owner needs to share the location after accepting your inquiry.
        </p>
      </div>
    )
  }

  // Pick the best distance to display (road distance if available, else straight-line)
  const displayDistance = roadRoute?.distanceKm ?? straightDistance

  // Estimate walking (3x driving) and cycling (1.8x driving) from the road route
  const walkingTime = roadRoute ? roadRoute.durationSec * 3 : (displayDistance ? displayDistance * 12 * 60 : null)
  const drivingTime = roadRoute ? roadRoute.durationSec : (displayDistance ? Math.max(60, displayDistance * 2.5 * 60) : null)
  const cyclingTime = roadRoute ? Math.round(roadRoute.durationSec * 1.8) : (displayDistance ? displayDistance * 5 * 60 : null)

  return (
    <div ref={containerRef} className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
      <div>
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          <Navigation className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          Distance Calculator
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Search any location to see the real road distance from this property.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (!e.target.value) {
                  setSearchResults([])
                  setShowResults(false)
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder='Search a location (e.g. "Vyttila", "MG Road")'
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
            {isSearching ? (
              <div className="py-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Searching locations...</p>
              </div>
            ) : error ? (
              <div className="py-6 text-center px-4">
                <p className="text-xs font-semibold" style={{ color: '#f43f5e' }}>{error}</p>
              </div>
            ) : (
              <div className="py-1 max-h-60 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 transition-colors text-left"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {result.shortName}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {result.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Distance Result */}
      {selectedLocation && displayDistance !== null && (
        <div className="rounded-2xl p-4 space-y-3 animate-fade-in" style={{ background: 'var(--primary-light)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(13,148,136,0.15)' }}>
                <Navigation className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Distance from
                </p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedLocation.shortName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>
                {formatDistance(displayDistance)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {roadRoute ? 'via road' : 'straight line'}
                {displayDistance < 1 ? '' : displayDistance < 5 ? ' | Short drive' : displayDistance < 20 ? ' | Within city' : ' | Inter-city'}
              </p>
            </div>
          </div>

          {/* Travel time estimates — walking for <3km, cycling for >=3km */}
          <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: '1px solid rgba(13,148,136,0.15)' }}>
            {displayDistance < 3 ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Route className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Walking</p>
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {walkingTime != null ? formatDuration(walkingTime) : '--'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Bike className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Cycling</p>
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {cyclingTime != null ? formatDuration(cyclingTime) : '--'}
                </p>
              </div>
            )}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Car className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Driving</p>
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {drivingTime != null ? formatDuration(drivingTime) : '--'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Bike className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Bike</p>
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {cyclingTime != null ? formatDuration(cyclingTime) : '--'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      {propertyLatLng && (
        <div className="h-[280px] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <MapContainer
            center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : propertyLatLng}
            zoom={selectedLocation ? 13 : 14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
              keepBuffer={4}
              bounds={[[-90, -180], [90, 180]]}
            />
            <MapUpdater bounds={mapBounds} />
            <Marker position={propertyLatLng} icon={propertyIcon} />
            {selectedLocation && (
              <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} icon={searchIcon} />
            )}
            {displayGeometry.length >= 2 && (
              <Polyline
                positions={displayGeometry}
                pathOptions={{
                  color: '#0d9488',
                  weight: roadRoute ? 4 : 3,
                  dashArray: roadRoute ? undefined : '8, 8',
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
          </MapContainer>
        </div>
      )}

      {/* Map Legend */}
      {selectedLocation && (          <div className="flex items-center justify-center gap-4 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-white shadow" style={{ background: 'var(--primary)' }} />
            Property
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-white shadow" style={{ background: '#2563eb' }} />
            Searched location
          </div>
          <div className="flex items-center gap-1.5">
            {roadRoute ? (
              <div className="w-4 h-1 rounded-full" style={{ background: 'var(--primary)' }} />
            ) : (
              <div className="w-4 border-t-2 border-dashed" style={{ borderColor: 'var(--primary)' }} />
            )}
            {roadRoute ? 'Road route' : 'Straight line'}
          </div>
        </div>
      )}
    </div>
  )
}
