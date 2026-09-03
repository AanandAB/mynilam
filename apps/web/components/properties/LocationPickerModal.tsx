'use client'

// A modal Leaflet map for picking an exact location (PRD §6 "Add Location").
// Reuses the OpenStreetMap tile + react-leaflet stack used elsewhere in the app.
// Clicking the map drops/relocates a marker; the parent receives the lat/lng.

import React from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { X, MapPin } from 'lucide-react'

// Custom marker via divIcon — avoids Leaflet's default icon asset-path issue in Next.js.
const pinIcon = L.divIcon({
  className: 'location-pin-marker',
  html: `<div class="flex items-end justify-center">
           <div class="w-5 h-5 bg-indigo-600 border-2 border-white rounded-full shadow-lg ring-4 ring-indigo-500/30"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
})

interface LocationPickerModalProps {
  // Fallback map center (used until a point is selected).
  initial: [number, number]
  // Currently selected coordinates (null = none yet).
  selected: [number, number] | null
  onSelect: (lat: number, lng: number) => void
  onClose: () => void
}

// Listens for clicks on the map and reports coordinates up.
function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  })
  return null
}

export default function LocationPickerModal({
  initial,
  selected,
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  // Center the map on the selected point once chosen, else the fallback center.
  const center: [number, number] = selected ?? initial

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pin location on map"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Pin the location</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click anywhere on the map to drop the marker
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map */}
        <div className="h-[340px] sm:h-[400px] relative z-0">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickCatcher onPick={(lat, lng) => onSelect(lat, lng)} />
            {selected && <Marker position={selected} icon={pinIcon} />}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-indigo-500" />
            {selected ? `${selected[0].toFixed(6)}, ${selected[1].toFixed(6)}` : 'No location selected'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
