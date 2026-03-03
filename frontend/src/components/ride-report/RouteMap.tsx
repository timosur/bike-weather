import { useMemo } from 'react'
import { Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import { Map } from '../../components/ui/map'
import { Wind } from 'lucide-react'
import type { RouteWaypointWeather, RouteSegment } from './types'
import { WeatherIcon } from './WeatherIcon'

interface RouteMapProps {
  startLocation: { lat: number; lon: number; label: string }
  destinationLocation?: { lat: number; lon: number; label: string }
  routeGeometry?: [number, number][]
  waypoints?: RouteWaypointWeather[]
  routeSegments?: RouteSegment[]
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
  waypoints,
  routeSegments,
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

        {/* Destination Marker */}
        {destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lon]}>
            <Popup>
              <div className="font-semibold">{destinationLocation.label}</div>
              <div className="text-xs text-stone-500">Destination</div>
            </Popup>
          </Marker>
        )}

        {/* Waypoints */}
        {waypoints?.map((wp) => (
          <Marker key={`wp-${wp.index}`} position={[wp.lat, wp.lon]} opacity={0.8}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-medium">{Math.round(wp.distanceKm)} km</div>
                <div className="flex items-center gap-2">
                  <WeatherIcon icon={wp.icon} className="w-4 h-4" />
                  <span>{Math.round(wp.temp)}°C</span>
                </div>
                <div className="flex items-center gap-2 text-stone-500">
                  <Wind className="w-3 h-3" />
                  <span>{Math.round(wp.windSpeed)} km/h {wp.windDirection}</span>
                </div>
                {Math.abs(wp.headwindComponent) > 5 && (
                  <div className={`text-xs ${wp.headwindComponent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {wp.headwindComponent > 0 ? 'Headwind' : 'Tailwind'}: {Math.round(Math.abs(wp.headwindComponent))} km/h
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </Map>
      
      {/* Legend — only when wind segments are shown */}
      {hasSegments && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur p-2 rounded-lg text-xs flex gap-3 justify-center shadow-sm z-[1000]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-stone-700 dark:text-stone-300">Tailwind</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-stone-700 dark:text-stone-300">Crosswind</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-stone-700 dark:text-stone-300">Headwind</span>
          </div>
        </div>
      )}
    </div>
  )
}
