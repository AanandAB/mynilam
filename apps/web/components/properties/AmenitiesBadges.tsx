'use client'

import React from 'react'
import {
  Wifi,
  Shirt,
  UtensilsCrossed,
  Wind,
  ShieldCheck,
  Zap,
  Droplets,
  Car,
  Check,
  Sparkles,
  Users,
  Layers,
  Building,
} from 'lucide-react'
import { Property } from '@repo/shared'
import { Card } from '@/components/ui/card'

interface AmenitiesBadgesProps {
  property: Property
}

export function AmenitiesBadges({ property }: AmenitiesBadgesProps) {
  // Define features
  const essentials = [
    {
      key: 'wifi',
      label: 'High Speed WiFi',
      available: !!property.wifi_available,
      icon: Wifi,
    },
    {
      key: 'laundry',
      label: 'Laundry Service',
      available: !!property.laundry_available,
      icon: Shirt,
    },
    {
      key: 'food',
      label: 'Food / Mess Included',
      available: !!property.food_included,
      icon: UtensilsCrossed,
    },
    {
      key: 'power',
      label: property.power_backup && property.power_backup !== 'none'
        ? `Power Backup (${property.power_backup})`
        : 'Power Backup',
      available: !!property.power_backup && property.power_backup !== 'none',
      icon: Zap,
    },
    {
      key: 'water',
      label: property.water_source
        ? `Water: ${property.water_source === 'both' ? 'Municipal & Borewell' : property.water_source}`
        : '24/7 Water Supply',
      available: !!property.water_source,
      icon: Droplets,
    },
  ]

  const roomComfort = [
    {
      key: 'ac',
      label: 'Air Conditioning',
      available: !!property.ac_available,
      icon: Wind,
    },
    {
      key: 'furnished',
      label: property.is_furnished ? 'Furnished Unit' : 'Unfurnished',
      available: !!property.is_furnished,
      icon: Sparkles,
    },
  ]

  const safetyList = property.security_features || []
  const hasSafety = safetyList.length > 0 || !!property.gated_community

  const safetyItems = [
    ...(property.gated_community
      ? [{ key: 'gated', label: 'Gated Community', available: true, icon: Building }]
      : []),
    ...safetyList.map((feature) => ({
      key: feature,
      label:
        feature === 'cctv'
          ? 'CCTV Surveillance'
          : feature === 'guard'
          ? '24/7 Security Guard'
          : feature === 'intercom'
          ? 'Intercom Facility'
          : feature === 'fire'
          ? 'Fire Safety Equipment'
          : feature,
      available: true,
      icon: ShieldCheck,
    })),
  ]

  const rules = [
    {
      key: 'parking',
      label: property.parking && property.parking !== 'none'
        ? `Parking: ${
            property.parking === 'bike'
              ? 'Two-Wheeler Only'
              : property.parking === 'car-open'
              ? 'Four-Wheeler (Open)'
              : property.parking === 'car-covered'
              ? 'Four-Wheeler (Covered)'
              : property.parking
          }`
        : null,
      icon: Car,
    },
    {
      key: 'tenant',
      label: property.preferred_tenant
        ? `Preferred Tenant: ${
            property.preferred_tenant === 'any'
              ? 'Any (Students/Working Professionals)'
              : property.preferred_tenant === 'bachelors'
              ? 'Bachelors Only'
              : property.preferred_tenant === 'family'
              ? 'Families Only'
              : property.preferred_tenant
          }`
        : null,
      icon: Users,
    },
    {
      key: 'floor',
      label: property.is_upstairs !== undefined && property.is_upstairs !== null
        ? property.is_upstairs
          ? 'Upper Floor Unit'
          : 'Ground Floor Unit'
        : null,
      icon: Layers,
    },
  ].filter((r) => r.label !== null)

  const activeEssentials = essentials.filter((e) => e.available)
  const activeComfort = roomComfort.filter((c) => c.available)

  const hasAnyAmenities =
    activeEssentials.length > 0 ||
    activeComfort.length > 0 ||
    safetyItems.length > 0 ||
    rules.length > 0 ||
    (property.furniture_list && property.furniture_list.length > 0)

  if (!hasAnyAmenities) {
    return (
      <Card className="p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
        <h4 className="font-bold text-slate-700 dark:text-slate-300">No Specific Amenities Listed</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please contact the hostel owner to inquire about available facilities.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Amenities & Facilities
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
          Verified Facilities
        </span>
      </div>

      {/* Essentials Section */}
      {activeEssentials.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Essential Amenities
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {activeEssentials.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs"
                >
                  <div className="p-1 rounded-lg bg-emerald-500 text-white shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <IconComp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Comfort & Furnishing Section */}
      {(activeComfort.length > 0 || (property.furniture_list && property.furniture_list.length > 0)) && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Room Comfort & Furnishings
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {activeComfort.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-semibold shadow-2xs"
                >
                  <div className="p-1 rounded-lg bg-indigo-500 text-white shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <IconComp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              )
            })}

            {property.furniture_list?.map((furniture, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                <div className="p-1 rounded-lg bg-slate-400 dark:bg-slate-600 text-white shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>{furniture}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety & Security Section */}
      {safetyItems.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Security & Protection
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {safetyItems.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs font-semibold shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* House Rules & Features */}
      {rules.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Property Guidelines & Parking
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {rules.map((rule) => {
              const IconComp = rule.icon
              return (
                <div
                  key={rule.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  <IconComp className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{rule.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
