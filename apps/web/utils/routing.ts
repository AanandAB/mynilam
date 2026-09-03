/**
 * Routing utilities using OSRM (Open Source Routing Machine).
 * Uses the free public demo server — no API key required.
 */

export interface RouteResult {
  /** Route geometry as [lat, lng] pairs for display on the map */
  geometry: [number, number][]
  /** Distance in kilometers (road distance, not straight-line) */
  distanceKm: number
  /** Duration in seconds */
  durationSec: number
}

/**
 * Fetch a real road route between two points using OSRM.
 * @param fromLat - Starting latitude
 * @param fromLng - Starting longitude
 * @param toLat - Destination latitude
 * @param toLng - Destination longitude
 * @param profile - 'driving', 'walking', or 'cycling'
 */
export async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<RouteResult | null> {
  // OSRM uses lng,lat order (GeoJSON)
  const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null
    }

    const route = data.routes[0]

    // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
    const geometry: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    )

    return {
      geometry,
      distanceKm: route.distance / 1000, // meters to km
      durationSec: route.duration,
    }
  } catch {
    return null
  }
}

/**
 * Format duration in seconds to a human-readable string.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `~${minutes} min`
}
