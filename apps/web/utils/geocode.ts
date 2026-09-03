/**
 * Geocoding utilities using Nominatim (OpenStreetMap) — no API key required.
 */

export interface GeocodingResult {
  displayName: string
  shortName: string
  latitude: number
  longitude: number
}

/**
 * Search for a location by name and return coordinates.
 */
export async function geocodeLocation(query: string): Promise<GeocodingResult[]> {
  if (!query.trim()) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      // Nominatim requires a valid User-Agent
      'User-Agent': 'MyNilam/1.0 (property-search)',
    },
  })

  if (!response.ok) {
    throw new Error('Geocoding request failed')
  }

  const data = await response.json()

  return data.map((item: any) => ({
    displayName: item.display_name,
    shortName: formatShortName(item),
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }))
}

/**
 * Format a short, readable name from a Nominatim result.
 */
function formatShortName(item: any): string {
  const addr = item.address || {}
  const parts: string[] = []

  // Use the most specific meaningful part
  if (addr.road) parts.push(addr.road)
  if (addr.neighbourhood) parts.push(addr.neighbourhood)
  if (addr.suburb) parts.push(addr.suburb)
  if (addr.city || addr.town || addr.village) {
    parts.push(addr.city || addr.town || addr.village)
  }
  if (addr.state) parts.push(addr.state)

  // Fallback to the first part of display_name
  if (parts.length === 0) {
    return item.display_name.split(',').slice(0, 2).join(',').trim()
  }

  return parts.slice(0, 3).join(', ')
}
