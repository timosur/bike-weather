import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import { Map } from '../../components/ui/map'
import type { RouteSegment } from './types'

interface UserWaypoint {
  lat: number
  lon: number
  type: string  // "stop" | "sleep"
  name?: string | null
}

interface RouteMapProps {
  startLocation: { lat: number; lon: number; label: string }
  destinationLocation?: { lat: number; lon: number; label: string }
  routeGeometry?: [number, number][]
  routeSegments?: RouteSegment[]
  userWaypoints?: UserWaypoint[]
  className?: string
}

function MapBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap()
  useMemo(() => {
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, bounds])
  return null
}

export function RouteMap({
  startLocation,
  destinationLocation,
  routeGeometry,
  routeSegments,
  userWaypoints,
  className,
}: RouteMapProps) {
  const bounds = useMemo(() => {
    if (!routeGeometry || routeGeometry.length === 0) {
      if (startLocation.lat && startLocation.lon) {
        return new LatLngBounds([startLocation.lat, startLocation.lon], [startLocation.lat, startLocation.lon])
      }
      return null
    }
    const b = new LatLngBounds(routeGeometry[0], routeGeometry[0])
    routeGeometry.forEach((p) => b.extend(p))
    return b
  }, [routeGeometry, startLocation])

  const hasSegments = routeSegments && routeSegments.some(s => s.geometry && s.geometry.length >= 2)

  if (!routeGeometry) return null

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Map center={[startLocation.lat, startLocation.lon]} zoom={10} className="w-full h-full rounded-xl">
        {bounds && <MapBounds bounds={bounds} />}
        
        {/* Color-coded segments when available */}
        {hasSegments && routeSegments!.map((seg, i) => (
          seg.geometry && seg.geometry.length >= 2 && (
            <Polyline
              key={`seg-${i}-${seg.startLat}`}
              positions={seg.geometry as [number, number][]}
              pathOptions={{ color: seg.color, weight: 5, opacity: 0.85 }}
            />
          )
        ))}

        {/* Plain route line fallback (preview or missing segments) */}
        {!hasSegments && routeGeometry.length >= 2 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Start Marker */}
        <Marker position={[startLocation.lat, startLocation.lon]}>
          <Popup>
            <div className="font-semibold">{startLocation.label}</div>
            <div className="text-xs text-stone-500">Start</div>
          </Popup>
        </Marker>

        {/* User Waypoint Markers */}
        {userWaypoints && userWaypoints.map((wp, i) => (
          <Marker key={`wp-${i}`} position={[wp.lat, wp.lon]}>
            <Popup>
              <div className="font-semibold">{wp.name || (wp.type === 'sleep' ? '🛏️ Overnight' : '🚩 Stop')}</div>
              <div className="text-xs text-stone-500">{wp.type === 'sleep' ? 'Overnight stop' : 'Waypoint'}</div>
            </Popup>
          </Marker>
        ))}

        {/* Destination Marker */}
        {destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lon]}>
            <Popup>
              <div className="font-semibold">{destinationLocation.label}</div>
              <div className="text-xs text-stone-500">Destination</div>
            </Popup>
          </Marker>
        )}

      </Map>
    </div>
  )
}

export function RouteMapLegend({ hasSegments }: { hasSegments: boolean }) {
  const { t } = useTranslation()
  if (!hasSegments) return null
  return (
    <div className="flex gap-4 justify-center pt-2 text-xs text-stone-400 dark:text-stone-500">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>{t('report.windAnalysis.tailwind')}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <span>{t('report.windAnalysis.crosswind')}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>{t('report.windAnalysis.headwind')}</span>
      </div>
    </div>
  )
}
