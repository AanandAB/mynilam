/**
 * Nearby Places utility — fetches Points of Interest from OpenStreetMap Overpass API
 * so users can see hospitals, schools, transit, etc. near a property.
 */

export interface NearbyPlace {
  id: number
  name: string
  category: PlaceCategory
  distance: number // km from property
  lat: number
  lon: number
  address?: string
  phone?: string
  openingHours?: string
  wheelchair?: string
}

export type PlaceCategory =
  | 'hospital'
  | 'school'
  | 'college'
  | 'pharmacy'
  | 'restaurant'
  | 'cafe'
  | 'grocery'
  | 'park'
  | 'gym'
  | 'atm'
  | 'bus'
  | 'metro'
  | 'railway'
  | 'fuel'
  | 'bank'
  | 'library'
  | 'post_office'

export interface CategoryConfig {
  label: string
  icon: string // Lucide icon name
  osmTags: string[] // Overpass QL tag filters
  color: string
}

export const PLACE_CATEGORIES: Record<PlaceCategory, CategoryConfig> = {
  hospital: {
    label: 'Hospitals',
    icon: 'Cross',
    osmTags: ['"amenity"="hospital"', '"amenity"="clinic"'],
    color: '#ef4444',
  },
  school: {
    label: 'Schools',
    icon: 'GraduationCap',
    osmTags: ['"amenity"="school"'],
    color: '#3b82f6',
  },
  college: {
    label: 'Colleges',
    icon: 'BookOpen',
    osmTags: ['"amenity"="college"', '"amenity"="university"'],
    color: '#8b5cf6',
  },
  pharmacy: {
    label: 'Pharmacies',
    icon: 'Pill',
    osmTags: ['"amenity"="pharmacy"'],
    color: '#10b981',
  },
  restaurant: {
    label: 'Restaurants',
    icon: 'UtensilsCrossed',
    osmTags: ['"amenity"="restaurant"'],
    color: '#f59e0b',
  },
  cafe: {
    label: 'Cafes',
    icon: 'Coffee',
    osmTags: ['"amenity"="cafe"'],
    color: '#d97706',
  },
  grocery: {
    label: 'Grocery',
    icon: 'ShoppingCart',
    osmTags: ['"shop"="supermarket"', '"shop"="convenience"'],
    color: '#22c55e',
  },
  park: {
    label: 'Parks',
    icon: 'TreePine',
    osmTags: ['"leisure"="park"'],
    color: '#16a34a',
  },
  gym: {
    label: 'Gyms',
    icon: 'Dumbbell',
    osmTags: ['"leisure"="fitness_centre"', '"leisure"="sports_centre"'],
    color: '#6366f1',
  },
  atm: {
    label: 'ATMs',
    icon: 'Landmark',
    osmTags: ['"amenity"="atm"'],
    color: '#0ea5e9',
  },
  bank: {
    label: 'Banks',
    icon: 'Landmark',
    osmTags: ['"amenity"="bank"'],
    color: '#0284c7',
  },
  bus: {
    label: 'Bus Stops',
    icon: 'Bus',
    osmTags: ['"highway"="bus_stop"', '"public_transport"="stop_position"'],
    color: '#f97316',
  },
  metro: {
    label: 'Metro',
    icon: 'TrainFront',
    osmTags: ['"railway"="station"', '"station"="subway"'],
    color: '#e11d48',
  },
  railway: {
    label: 'Railways',
    icon: 'Train',
    osmTags: ['"railway"="station"'],
    color: '#be123c',
  },
  fuel: {
    label: 'Fuel Stations',
    icon: 'Fuel',
    osmTags: ['"amenity"="fuel"'],
    color: '#78716c',
  },
  library: {
    label: 'Libraries',
    icon: 'Library',
    osmTags: ['"amenity"="library"'],
    color: '#7c3aed',
  },
  post_office: {
    label: 'Post Offices',
    icon: 'Mail',
    osmTags: ['"amenity"="post_office"'],
    color: '#059669',
  },
}

/** Calculate haversine distance in km between two points */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Overpass API mirrors (tried in order) */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch nearby POIs for a given property location.
 * Uses Overpass API with POST, mirror fallback, and batch splitting.
 */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusMeters: number = 3000,
  categories?: PlaceCategory[]
): Promise<NearbyPlace[]> {
  const cats = categories && categories.length > 0
    ? categories
    : Object.keys(PLACE_CATEGORIES) as PlaceCategory[]

  let allPlaces: NearbyPlace[] = []

  // Try single query first (faster)
  try {
    allPlaces = await fetchBatch(lat, lon, radiusMeters, cats)
  } catch {
    // Single query failed — split into smaller batches and try each
    const batchSize = 5
    const batches: PlaceCategory[][] = []
    for (let i = 0; i < cats.length; i += batchSize) {
      batches.push(cats.slice(i, i + batchSize))
    }

    const batchResults = await Promise.allSettled(
      batches.map((batch) => fetchBatch(lat, lon, radiusMeters, batch))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        allPlaces.push(...result.value)
      }
    }
  }

  // Deduplicate by id
  const seen = new Set<number>()
  const unique = allPlaces.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  return unique.sort((a, b) => a.distance - b.distance)
}

/** Fetch a batch of categories from Overpass API with mirror fallback */
async function fetchBatch(
  lat: number,
  lon: number,
  radiusMeters: number,
  categories: PlaceCategory[]
): Promise<NearbyPlace[]> {
  const tagFilters = categories.flatMap((cat) =>
    PLACE_CATEGORIES[cat].osmTags.map(
      (tag) => `  node[${tag}](around:${radiusMeters},${lat},${lon});`
    )
  )

  const query = `
    [out:json][timeout:10];
    (
      ${tagFilters.join('\n')}
    );
    out body;
  `.trim()

  const allowedSet = new Set(categories)

  // Try each mirror
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (res.status === 429 || res.status === 503) {
          await sleep(1500 * (attempt + 1))
          continue
        }

        if (!res.ok) {
          if (attempt < 1) { await sleep(800); continue }
          break // Try next mirror
        }

        const data = await res.json()
        const elements: any[] = data.elements || []

        return parseElements(elements, lat, lon, allowedSet)
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // Timeout — try next attempt or mirror
          if (attempt < 1) { await sleep(500); continue }
          break
        }
        if (attempt < 1) { await sleep(800); continue }
        break
      }
    }
  }

  throw new Error('Nearby places unavailable — all Overpass API mirrors failed')
}

/** Parse Overpass elements into NearbyPlace objects */
function parseElements(
  elements: any[],
  lat: number,
  lon: number,
  allowedCategories: Set<PlaceCategory>
): NearbyPlace[] {
  return elements
    .map((el): NearbyPlace | null => {
      const tags = el.tags || {}
      const name = tags.name || tags['name:en'] || tags['name:hi'] || ''
      if (!name) return null

      const category = inferCategory(tags, allowedCategories)
      if (!category) return null

      const distance = haversineDistance(lat, lon, el.lat, el.lon)

      return {
        id: el.id,
        name,
        category,
        distance: Math.round(distance * 100) / 100,
        lat: el.lat,
        lon: el.lon,
        address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
        phone: tags.phone || tags['contact:phone'] || undefined,
        openingHours: tags.opening_hours || undefined,
        wheelchair: tags.wheelchair || undefined,
      }
    })
    .filter((p): p is NearbyPlace => p !== null)
    .sort((a, b) => a.distance - b.distance)
}

/** Infer the PlaceCategory from OSM tags */
function inferCategory(tags: any, allowedCategories: Set<PlaceCategory>): PlaceCategory | null {
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital'
  if (tags.amenity === 'pharmacy') return 'pharmacy'
  if (tags.amenity === 'school') return 'school'
  if (tags.amenity === 'college' || tags.amenity === 'university') return 'college'
  if (tags.amenity === 'restaurant') return 'restaurant'
  if (tags.amenity === 'cafe') return 'cafe'
  if (tags.amenity === 'fuel') return 'fuel'
  if (tags.amenity === 'atm') return 'atm'
  if (tags.amenity === 'bank') return 'bank'
  if (tags.amenity === 'library') return 'library'
  if (tags.amenity === 'post_office') return 'post_office'
  if (tags.shop === 'supermarket' || tags.shop === 'convenience') return 'grocery'
  if (tags.leisure === 'park') return 'park'
  if (tags.leisure === 'fitness_centre' || tags.leisure === 'sports_centre') return 'gym'
  if (tags.highway === 'bus_stop' || tags.public_transport === 'stop_position') return 'bus'
  if (tags.railway === 'station' && (tags.station === 'subway' || tags.subway === 'yes')) return 'metro'
  if (tags.railway === 'station') return 'railway'
  return null
}

/** Format distance for display */
export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/** Estimate walking time in minutes (avg 5 km/h) */
export function estimateWalkMinutes(km: number): number {
  return Math.round((km / 5) * 60)
}

/** Estimate driving time in minutes (avg 25 km/h in city) */
export function estimateDriveMinutes(km: number): number {
  return Math.max(1, Math.round((km / 25) * 60))
}
