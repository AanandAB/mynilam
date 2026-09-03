'use client'

import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { NearbyPlace, PlaceCategory } from '@/utils/nearby-places'
import { PLACE_CATEGORIES } from '@/utils/nearby-places'

interface NearbyPlacesMapProps {
  latitude: number
  longitude: number
  places: NearbyPlace[]
  radiusKm: number
}

// Fix Leaflet default marker icon
const defaultIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#0d9488;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function createPoiIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;">
      <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

// Auto-fit bounds
function FitBounds({ latitude, longitude, radiusKm, places }: {
  latitude: number; longitude: number; radiusKm: number; places: NearbyPlace[]
}) {
  const map = useMap()

  React.useEffect(() => {
    const bounds = L.latLngBounds([L.latLng(latitude, longitude)])
    for (const place of places) {
      bounds.extend(L.latLng(place.lat, place.lon))
    }
    if (places.length === 0) {
      // No places, show radius circle
      bounds.extend(L.latLng(latitude + radiusKm * 0.009, longitude + radiusKm * 0.009))
      bounds.extend(L.latLng(latitude - radiusKm * 0.009, longitude - radiusKm * 0.009))
    }
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [latitude, longitude, radiusKm, places, map])

  return null
}

export const NearbyPlacesMap: React.FC<NearbyPlacesMapProps> = ({
  latitude,
  longitude,
  places,
  radiusKm,
}) => {
  const poiIconCache = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {}
    for (const [cat, config] of Object.entries(PLACE_CATEGORIES)) {
      cache[cat] = createPoiIcon(config.color)
    }
    return cache
  }, [])

  return (
    <div className="rounded-xl overflow-hidden border border-border dark:border-white/10">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        className="w-full h-[300px]"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds
          latitude={latitude}
          longitude={longitude}
          radiusKm={radiusKm}
          places={places}
        />

        {/* Radius circle */}
        <Circle
          center={[latitude, longitude]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#0d9488',
            fillColor: '#0d9488',
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '6 4',
          }}
        />

        {/* Property marker */}
        <Marker
          position={[latitude, longitude]}
          icon={defaultIcon}
        />

        {/* POI markers */}
        {places.map((place) => {
          const icon = poiIconCache[place.category]
          if (!icon) return null
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lon]}
              icon={icon}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}

export default NearbyPlacesMap
