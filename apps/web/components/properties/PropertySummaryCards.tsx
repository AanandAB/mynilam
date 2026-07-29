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
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    },
    {
      label: isHostelOrPg ? 'Total Beds' : 'Bedrooms',
      value: bedsText,
      icon: BedDouble,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50',
    },
    {
      label: isHostelOrPg ? 'Total Rooms' : 'Bathrooms',
      value: roomsText,
      icon: DoorClosed,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      label: 'Sharing Occupancy',
      value: formatSharing(property.sharing_occupancy),
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/50',
    },
    {
      label: 'Gender Preference',
      value: formatGender(property.preferred_gender),
      icon: UserCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
    },
    {
      label: 'Availability',
      value: property.num_beds && property.num_beds > 0 ? `🟢 ${property.num_beds} Beds Left` : '🟢 Available Now',
      icon: CheckCircle2,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl border ${card.bg} flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-0.5 duration-200 shadow-2xs`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs ${card.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                {card.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
