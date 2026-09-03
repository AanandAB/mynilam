'use client'

import React from 'react'
import { Building2, BedDouble, DoorClosed, Users, UserCheck, CheckCircle2, Clock } from 'lucide-react'
import { Property } from '@repo/shared'

interface PropertySummaryCardsProps {
  property: Property
}

export function PropertySummaryCards({ property }: PropertySummaryCardsProps) {
  const isHostelOrPg = ['hostel', 'pg'].includes(property.property_type)

  const formatSharing = (occupancy?: string | null) => {
    if (!occupancy) return 'Standard'
    if (occupancy === '1') return 'Single Occupancy'
    if (occupancy === '2') return 'Double Sharing (2)'
    if (occupancy === '3') return 'Triple Sharing (3)'
    if (occupancy === '4') return '4 Sharing'
    if (occupancy === 'dorm') return 'Dormitory'
    return `${occupancy} Sharing`
  }

  const formatGender = (gender?: string | null) => {
    if (gender === 'male') return 'Boys / Male Only'
    if (gender === 'female') return 'Girls / Female Only'
    return 'Unisex / Co-Living'
  }

  const bedsText = isHostelOrPg
    ? property.num_beds ? `${property.num_beds} Beds` : 'N/A'
    : property.bedrooms ? `${property.bedrooms} Beds` : 'N/A'

  const roomsText = isHostelOrPg
    ? property.total_rooms ? `${property.total_rooms} Rooms` : 'N/A'
    : property.bathrooms ? `${property.bathrooms} Baths` : 'N/A'

  const cards = [
    {
      label: 'Property Type',
      value: property.property_type?.toUpperCase() || 'HOSTEL',
      icon: Building2,
      iconBg: 'var(--primary-light)',
      iconColor: 'var(--primary)',
    },
    {
      label: isHostelOrPg ? 'Total Beds' : 'Bedrooms',
      value: bedsText,
      icon: BedDouble,
      iconBg: 'rgba(59,130,246,0.1)',
      iconColor: '#2563eb',
    },
    {
      label: isHostelOrPg ? 'Total Rooms' : 'Bathrooms',
      value: roomsText,
      icon: DoorClosed,
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10b981',
    },
    {
      label: 'Sharing Occupancy',
      value: formatSharing(property.sharing_occupancy),
      icon: Users,
      iconBg: 'rgba(139,92,246,0.1)',
      iconColor: '#7c3aed',
    },
    {
      label: 'Gender Preference',
      value: formatGender(property.preferred_gender),
      icon: UserCheck,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#d97706',
    },
    {
      label: 'Availability',
      value: property.num_beds && property.num_beds > 0 ? `${property.num_beds} Beds Left` : 'Available Now',
      icon: CheckCircle2,
      iconBg: 'var(--primary-light)',
      iconColor: 'var(--primary)',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-0.5 duration-200 shadow-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </span>
              <div className="p-2 rounded-xl shadow-sm" style={{ background: card.iconBg }}>
                <IconComponent className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
