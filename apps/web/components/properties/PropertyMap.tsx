import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Property } from '@repo/shared'
import Link from 'next/link'
import { Bed, Bath, Navigation, MapPin } from 'lucide-react'

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Leaflet icon for user's current location (glowing blue dot)
const createUserLocationIcon = () => {
  if (typeof window === 'undefined') return undefined
  return L.divIcon({
    className: 'user-location-marker',
    html: `<div class="relative flex items-center justify-center w-6 h-6">
             <div class="absolute h-6 w-6 bg-blue-500/30 rounded-full animate-ping"></div>
             <div class="relative h-3.5 w-3.5 bg-blue-600 border-2 border-white rounded-full shadow-[0_0_10px_rgba(37,99,235,0.6)]"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface PropertyMapProps {
  properties: Property[]
}

// Component to recenter map when properties change
const RecenterMap = ({ properties }: { properties: Property[] }) => {
  const map = useMap()
  
  useEffect(() => {
    if (properties.length > 0) {
      const validProps = properties.filter(p => p.latitude && p.longitude)
      if (validProps.length > 0) {
        const bounds = L.latLngBounds(validProps.map(p => [p.latitude!, p.longitude!]))
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [properties, map])
  
  return null
}

// Component to pan to user location
const LocateUser = ({ location }: { location: [number, number] | null }) => {
  const map = useMap()
  
  useEffect(() => {
    if (location) {
      map.flyTo(location, 14, { animate: true, duration: 1.5 })
    }
  }, [location, map])
  
  return null
}

const formatPrice = (price: number, listingType: string) => {
  const formatted = price.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  })
  return (listingType === 'rent' || listingType === 'roommate') ? `${formatted}/mo` : formatted
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  // Default center (India roughly) if no properties
  const defaultCenter: [number, number] = [20.5937, 78.9629]
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locatingError, setLocatingError] = useState<string | null>(null)
  
  const validProperties = properties.filter(p => p.latitude && p.longitude)

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocatingError('Geolocation is not supported by your browser.')
      return
    }
    setIsLocating(true)
    setLocatingError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setIsLocating(false)
      },
      (err) => {
        setLocatingError(err.message)
        setIsLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  if (validProperties.length === 0) {
    return (
      <div className="w-full h-[600px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center text-slate-500 font-bold">
        No locations available for these listings.
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      
      {/* Locate Me Floating Action Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute top-4 right-4 z-[999] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-indigo-650 dark:text-indigo-400 disabled:opacity-50"
        title="Locate my position"
      >
        <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
      </button>

      {locatingError && (
        <div className="absolute top-16 right-4 z-[999] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-500">
          {locatingError}
        </div>
      )}

      <MapContainer 
        center={validProperties.length > 0 ? [validProperties[0].latitude!, validProperties[0].longitude!] : defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap properties={validProperties} />
        <LocateUser location={userLocation} />
        
        {/* Pulsing User Current Location Marker */}
        {userLocation && createUserLocationIcon() && (
          <Marker position={userLocation} icon={createUserLocationIcon()!}>
            <Popup>
              <div className="text-center font-bold text-xs text-indigo-600">You are here!</div>
            </Popup>
          </Marker>
        )}

        {validProperties.map((property) => (
          <Marker key={property.id} position={[property.latitude!, property.longitude!]}>
            <Popup className="property-popup">
              <div className="w-48 space-y-2 !m-0">
                <div className="h-24 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {property.images && property.images[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {property.listing_type}
                  </span>
                  <Link href={`/properties/${property.id}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 line-clamp-1 block leading-tight">
                    {property.title}
                  </Link>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    {formatPrice(property.price, property.listing_type)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                    <span className="flex items-center"><Bed className="w-3 h-3 mr-0.5"/> {property.bedrooms || 0}</span>
                    <span className="flex items-center"><Bath className="w-3 h-3 mr-0.5"/> {property.bathrooms || 0}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
