/**
 * Client-side leg estimate for the planner timeline.
 *
 * Mirrors backend `app/services/ride_legs.py` (build_legs) and
 * `app/services/route_waypoints.py` (split_route_km). Keep the rules in sync;
 * the backend report stays authoritative.
 */
import type { RideLocation, Waypoint } from '../components/ride-planner/types'

const DAY_MIN = 24 * 60
const SNAP_TOLERANCE_KM = 0.5

export interface Leg {
  index: number
  /** Days after the ride start date */
  dayOffset: number
  /** Minutes since 00:00 of the ride start date */
  startMin: number
  endMin: number
  durationMin: number
  startKm: number
  endKm: number
  /** Waypoint type the leg starts after (undefined for the first leg) */
  splitType?: 'pause' | 'sleep'
  /** Index in the form's waypoint list of the split waypoint */
  waypointIndex?: number
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Cumulative km at start, each split point (in order) and route end. */
export function splitRouteKm(geometry: [number, number][], splitPoints: [number, number][]): number[] {
  if (geometry.length === 0) return []

  const cum = [0]
  for (let i = 1; i < geometry.length; i++) {
    cum.push(cum[i - 1] + haversineKm(...geometry[i - 1], ...geometry[i]))
  }

  const result = [0]
  let prevIdx = 0
  let prevPoint: [number, number] | null = null
  for (const [lat, lon] of splitPoints) {
    let start = prevIdx
    const sameSpot = prevPoint !== null && haversineKm(...prevPoint, lat, lon) <= SNAP_TOLERANCE_KM
    if (sameSpot) {
      // Leave the previous split's vicinity so a revisit maps to a later pass
      while (start + 1 < geometry.length && haversineKm(lat, lon, ...geometry[start]) <= SNAP_TOLERANCE_KM) start++
    }
    const dists = geometry.slice(start).map(p => haversineKm(lat, lon, ...p))
    const best = Math.min(...dists)
    prevPoint = [lat, lon]
    if (sameSpot && best > SNAP_TOLERANCE_KM) {
      // Same spot as the previous split and never revisited: zero-length leg
      result.push(cum[prevIdx])
      continue
    }
    let i = dists.findIndex(d => d <= best + SNAP_TOLERANCE_KM)
    // Walk to the closest point of this pass
    while (i + 1 < dists.length && dists[i + 1] < dists[i]) i++
    prevIdx = start + i
    result.push(cum[prevIdx])
  }
  result.push(cum[cum.length - 1])
  return result
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatClock(min: number): string {
  const m = ((min % DAY_MIN) + DAY_MIN) % DAY_MIN
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Arrival + 1 h, rounded up to 15 min, clamped to 23:45 of the arrival day. */
export function departureAfter(arrivalMin: number): string {
  const dayStart = Math.floor(arrivalMin / DAY_MIN) * DAY_MIN
  const rounded = Math.ceil((arrivalMin + 60) / 15) * 15
  return formatClock(Math.min(rounded, dayStart + DAY_MIN - 15))
}

interface BuildLegsInput {
  startTime: string
  start: RideLocation
  waypoints: Waypoint[]
  geometry: [number, number][]
  totalDurationMin: number
}

export function buildLegs({ startTime, start, waypoints, geometry, totalDurationMin }: BuildLegsInput): Leg[] {
  const splits = waypoints
    .map((wp, waypointIndex) => ({ wp, waypointIndex }))
    .filter(({ wp }) => wp.type === 'pause' || wp.type === 'sleep')

  const kmMarks = geometry.length > 1
    ? splitRouteKm(
      geometry,
      splits.map(({ wp }) => [wp.location.lat ?? start.lat ?? 0, wp.location.lon ?? start.lon ?? 0]),
    )
    : []
  const totalKm = kmMarks.length ? kmMarks[kmMarks.length - 1] : 0

  const legs: Leg[] = []
  let dayOffset = 0
  for (let i = 0; i <= splits.length; i++) {
    const split = i > 0 ? splits[i - 1] : undefined
    if (split?.wp.type === 'sleep') dayOffset++
    const startKm = kmMarks[i] ?? 0
    const endKm = kmMarks[i + 1] ?? 0
    const durationMin = totalKm > 0 && splits.length
      ? Math.round((totalDurationMin * (endKm - startKm)) / totalKm)
      : totalDurationMin
    const startMin = dayOffset * DAY_MIN + toMin(split ? split.wp.startTime ?? '08:00' : startTime)
    legs.push({
      index: i,
      dayOffset,
      startMin,
      endMin: startMin + durationMin,
      durationMin,
      startKm,
      endKm,
      splitType: split?.wp.type as Leg['splitType'],
      waypointIndex: split?.waypointIndex,
    })
  }
  return legs
}
