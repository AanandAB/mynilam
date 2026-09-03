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
      <Card className="p-6 text-center space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
        <Sparkles className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
        <h4 className="font-bold" style={{ color: 'var(--text-secondary)' }}>No Specific Amenities Listed</h4>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Please contact the property owner to inquire about available facilities.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          Amenities & Facilities
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(13,148,136,0.2)' }}>
          Verified Facilities
        </span>
      </div>

      {/* Essentials Section */}
      {activeEssentials.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Essential Amenities
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {activeEssentials.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-sm"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}
                >
                  <div className="p-1 rounded-lg shrink-0" style={{ background: '#10b981', color: 'white' }}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Comfort & Furnishing Section */}
      {(activeComfort.length > 0 || (property.furniture_list && property.furniture_list.length > 0)) && (
        <div className="space-y-3 pt-2">          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Room Comfort & Furnishings
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {activeComfort.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-sm"
                  style={{ background: 'var(--primary-light)', border: '1px solid rgba(13,148,136,0.2)', color: 'var(--primary)' }}
                >
                  <div className="p-1 rounded-lg shrink-0" style={{ background: 'var(--primary)', color: 'white' }}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              )
            })}

            {property.furniture_list?.map((furniture, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <div className="p-1 rounded-lg shrink-0" style={{ background: 'var(--text-muted)', color: 'white' }}>
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
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Security & Protection
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {safetyItems.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold shadow-sm"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#b45309' }}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#d97706' }} />
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
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Property Guidelines & Parking
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {rules.map((rule) => {
              const IconComp = rule.icon
              return (
                <div
                  key={rule.key}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <IconComp className="w-4 h-4 shrink-0" style={{ color: 'var(--primary)' }} />
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
