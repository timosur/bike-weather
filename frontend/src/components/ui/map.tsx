import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '../../lib/utils'

// Fix for default marker icon in Leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

interface MapProps extends React.ComponentProps<typeof MapContainer> {
  className?: string
  children?: React.ReactNode
}

export function Map({ className, children, ...props }: MapProps) {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn('relative w-full h-full overflow-hidden rounded-xl z-0 isolate', className)}>
      <MapContainer
        {...props}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url={isDark ? DARK_TILES : LIGHT_TILES}
          attribution={ATTRIBUTION}
        />
        {children}
      </MapContainer>
    </div>
  )
}
