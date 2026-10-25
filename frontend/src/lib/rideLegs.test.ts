import { describe, expect, it } from 'vitest'
import type { Waypoint } from '../components/ride-planner/types'
import { buildLegs, departureAfter, formatClock, haversineKm, splitRouteKm } from './rideLegs'

// Straight line along the equator, ~1.11 km per 0.01° step
const OUT: [number, number][] = Array.from({ length: 21 }, (_, i) => [0, i / 100])
const OUT_AND_BACK: [number, number][] = [...OUT, ...OUT.slice(0, -1).reverse()]
const LINE_KM = haversineKm(0, 0, 0, 0.2)

const wp = (lon: number, type: Waypoint['type'], startTime?: string): Waypoint => ({
  location: { lat: 0, lon, address: `P${lon}` },
  type,
  startTime,
})

describe('splitRouteKm', () => {
  it('returns start and total without splits', () => {
    const km = splitRouteKm(OUT, [])
    expect(km[0]).toBe(0)
    expect(km[1]).toBeCloseTo(LINE_KM, 2)
  })

  it('splits a straight line', () => {
    expect(splitRouteKm(OUT, [[0, 0.05]])[1]).toBeCloseTo(LINE_KM / 4, 2)
  })

  it('gives two equal legs on an out-and-back', () => {
    const km = splitRouteKm(OUT_AND_BACK, [[0, 0.2]])
    expect(km[1] - km[0]).toBeCloseTo(km[2] - km[1], 2)
  })

  it('maps a revisited location to the next pass', () => {
    const km = splitRouteKm(OUT_AND_BACK, [[0, 0.1], [0, 0.1]])
    expect(km[1]).toBeCloseTo(LINE_KM / 2, 2)
    expect(km[2]).toBeCloseTo(LINE_KM * 1.5, 2)
  })

  it('snaps an off-route split to the nearest point', () => {
    expect(splitRouteKm(OUT, [[0.01, 0.1]])[1]).toBeCloseTo(LINE_KM / 2, 2)
  })

  it('gives a zero-length leg for the same spot without revisit', () => {
    const km = splitRouteKm(OUT, [[0, 0.1], [0, 0.1]])
    expect(km[1]).toBeCloseTo(km[2])
  })

  it('returns [] for empty geometry', () => {
    expect(splitRouteKm([], [[0, 0.1]])).toEqual([])
  })
})

describe('buildLegs', () => {
  const base = {
    startTime: '09:00',
    start: { lat: 0, lon: 0, address: 'A' },
    geometry: OUT_AND_BACK,
    totalDurationMin: 120,
  }

  it('is a single leg without split waypoints', () => {
    const legs = buildLegs({ ...base, waypoints: [wp(0.2, 'stop')] })
    expect(legs).toHaveLength(1)
    expect(legs[0].durationMin).toBe(120)
  })

  it('splits a same-day return by distance', () => {
    const legs = buildLegs({ ...base, waypoints: [wp(0.2, 'pause', '17:00')] })
    expect(legs.map(l => [l.dayOffset, formatClock(l.startMin), l.durationMin])).toEqual([
      [0, '09:00', 60],
      [0, '17:00', 60],
    ])
    expect(formatClock(legs[0].endMin)).toBe('10:00')
    expect(legs[1].splitType).toBe('pause')
    expect(legs[1].waypointIndex).toBe(0)
  })

  it('advances the date only after sleep', () => {
    const legs = buildLegs({
      ...base,
      geometry: OUT,
      waypoints: [wp(0.05, 'pause', '12:00'), wp(0.1, 'sleep', '08:30'), wp(0.15, 'pause', '14:00')],
    })
    expect(legs.map(l => l.dayOffset)).toEqual([0, 0, 1, 1])
    expect(legs.map(l => formatClock(l.startMin))).toEqual(['09:00', '12:00', '08:30', '14:00'])
  })

  it('defaults sleep departure to 08:00', () => {
    const legs = buildLegs({ ...base, waypoints: [wp(0.2, 'sleep')] })
    expect(formatClock(legs[1].startMin)).toBe('08:00')
    expect(legs[1].dayOffset).toBe(1)
  })

  it('falls back to the total duration without geometry', () => {
    const legs = buildLegs({ ...base, geometry: [], waypoints: [wp(0.2, 'pause', '17:00')] })
    expect(legs.map(l => l.durationMin)).toEqual([120, 120])
  })
})

describe('departureAfter', () => {
  it('adds 1 h and rounds up to 15 min', () => {
    expect(departureAfter(10 * 60 + 20)).toBe('11:30')
    expect(departureAfter(10 * 60)).toBe('11:00')
  })

  it('clamps to 23:45 on the same day', () => {
    expect(departureAfter(23 * 60 + 10)).toBe('23:45')
  })
})
