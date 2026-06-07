'use client'

import { useEffect, useRef } from 'react'
import { Turf } from '@/types'

interface MapViewProps {
  turfs: Turf[]
  onTurfClick: (turfId: string) => void
  userLocation?: { lat: number; lng: number }
}

export function MapView({ turfs, onTurfClick, userLocation }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamic import Leaflet (client-side only)
    import('leaflet').then((L) => {
      // Fix default icon URLs (leaflet issue with webpack)
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Center on Tamil Nadu
      const defaultCenter: [number, number] = [11.1271, 78.6569]
      const initialCenter = userLocation
        ? ([userLocation.lat, userLocation.lng] as [number, number])
        : turfs.length > 0 && turfs[0].location?.coordinates
        ? ([turfs[0].location.coordinates[1], turfs[0].location.coordinates[0]] as [number, number])
        : defaultCenter

      const map = L.map(mapRef.current!, {
        center: initialCenter,
        zoom: userLocation ? 13 : 10,
        zoomControl: true,
      })

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // User location marker (blue)
      if (userLocation) {
        const userIcon = L.divIcon({
          className: '',
          html: `<div class="h-4 w-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('You are here')
      }

      // Turf markers (price bubbles)
      turfs.forEach((turf) => {
        if (!turf.location?.coordinates) return
        const [lng, lat] = turf.location.coordinates

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const basePrice = (turf as any).basePrice ?? turf.courts?.[0]?.basePricePerSlot ?? 0

        const turfIcon = L.divIcon({
          className: '',
          html: `
            <div class="relative">
              <div style="background:#16a34a;color:white;font-size:11px;font-weight:700;padding:4px 8px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.18);white-space:nowrap;cursor:pointer;border:2px solid white;">
                ₹${basePrice}
              </div>
              <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#16a34a;transform:translateX(-50%) rotate(45deg);"></div>
            </div>
          `,
          iconSize: [60, 30],
          iconAnchor: [30, 30],
        })

        const marker = L.marker([lat, lng], { icon: turfIcon }).addTo(map)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const turfCity = (turf as any).city ?? turf.location?.city ?? ''
        const popup = L.popup({ maxWidth: 200 }).setContent(`
          <div style="padding:4px;">
            <h3 style="font-weight:700;font-size:13px;color:#0f172a;margin:0 0 2px;">${turf.name}</h3>
            <p style="font-size:11px;color:#64748b;margin:0 0 4px;">${turfCity}</p>
            <p style="font-size:11px;color:#16a34a;font-weight:600;margin:0 0 8px;">₹${basePrice}/slot</p>
            <button onclick="window._turfClick('${turf._id}')" style="width:100%;background:#16a34a;color:white;font-size:11px;padding:6px;border-radius:8px;border:none;cursor:pointer;font-weight:600;">Book Now</button>
          </div>
        `)

        marker.bindPopup(popup)
      })

      // Global click handler for popup button
      ;(window as { _turfClick?: (id: string) => void })._turfClick = onTurfClick

      // Return cleanup
      return () => {
        map.remove()
        mapInstanceRef.current = null
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turfs, userLocation])

  // Update the global click handler when onTurfClick changes
  useEffect(() => {
    ;(window as { _turfClick?: (id: string) => void })._turfClick = onTurfClick
  }, [onTurfClick])

  return (
    <div className="relative">
      {/* Leaflet CSS loaded via link tag */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: '500px' }}
      />
    </div>
  )
}
