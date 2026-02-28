'use client'

import { useEffect, useRef, useState } from 'react'

interface SatPoint {
  lat: number
  lng: number
  alt: number
  name: string
}

const CELESTRAK_URL =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'

function generateOrbitPath(inclination: number): number[][] {
  const points: number[][] = []
  const incRad = (inclination * Math.PI) / 180
  for (let i = 0; i <= 360; i += 1) {
    const rad = (i * Math.PI) / 180
    const lat =
      Math.asin(Math.sin(rad) * Math.sin(incRad)) * (180 / Math.PI)
    const lng =
      Math.atan2(Math.sin(rad) * Math.cos(incRad), Math.cos(rad)) *
      (180 / Math.PI)
    points.push([lat, lng])
  }
  return points
}

export default function GlobeScene({
  onSatCount,
}: {
  onSatCount?: (n: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<ReturnType<typeof Object> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current || globeRef.current) return

    const init = async () => {
      const [{ default: Globe }, satellite] = await Promise.all([
        import('globe.gl'),
        import('satellite.js'),
      ])

      // Fetch real satellite data
      let positions: SatPoint[] = []
      try {
        const resp = await fetch(CELESTRAK_URL)
        const data = await resp.json()
        const now = new Date()
        const gmst = satellite.gstime(now)

        positions = data
          .slice(0, 1200)
          .map((item: Record<string, string>) => {
            try {
              const satrec = satellite.twoline2satrec(
                item.TLE_LINE1,
                item.TLE_LINE2
              )
              const result = satellite.propagate(satrec, now)
              if (
                !result ||
                !result.position ||
                typeof result.position === 'boolean'
              )
                return null
              const pos = result.position as { x: number; y: number; z: number }
              const geo = satellite.eciToGeodetic(pos, gmst)
              return {
                lat: satellite.degreesLat(geo.latitude),
                lng: satellite.degreesLong(geo.longitude),
                alt: (geo.height / 6371) * 4,
                name: item.OBJECT_NAME,
              }
            } catch {
              return null
            }
          })
          .filter(Boolean) as SatPoint[]
      } catch (e) {
        console.warn('Satellite data fetch failed:', e)
      }

      onSatCount?.(positions.length)

      // Orbit1 planned SSO orbit (97.4° inclination, ~500km)
      const orbitPoints = generateOrbitPath(97.4)

      const globe = new Globe(containerRef.current!)
        .width(containerRef.current!.clientWidth)
        .height(containerRef.current!.clientHeight)
        .globeImageUrl(
          '//unpkg.com/three-globe/example/img/earth-dark.jpg'
        )
        .bumpImageUrl(
          '//unpkg.com/three-globe/example/img/earth-topology.png'
        )
        .backgroundImageUrl(
          '//unpkg.com/three-globe/example/img/night-sky.png'
        )
        .showAtmosphere(true)
        .atmosphereColor('lightskyblue')
        .atmosphereAltitude(0.18)
        // Real satellites
        .pointsData(positions)
        .pointColor(() => 'rgba(0, 255, 136, 0.7)')
        .pointAltitude('alt')
        .pointRadius(0.12)
        .pointLabel('name')
        // Orbit1 planned path
        .pathsData([{ points: orbitPoints }])
        .pathPoints('points')
        .pathPointLat((p: number[]) => p[0])
        .pathPointLng((p: number[]) => p[1])
        .pathPointAlt(() => (500 / 6371) * 4)
        .pathColor(() => '#ff3333')
        .pathStroke(2.5)
        .pathDashLength(0.3)
        .pathDashGap(0.1)
        .pathDashAnimateTime(4000)

      // Camera
      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.35
      globe.controls().enableZoom = true
      globe.pointOfView({ lat: 30, lng: 140, altitude: 2.5 })

      globeRef.current = globe
      setLoading(false)
    }

    init()
  }, [onSatCount])

  // Resize
  useEffect(() => {
    const onResize = () => {
      if (globeRef.current && containerRef.current) {
        ;(globeRef.current as any)
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <div ref={containerRef} className="globe-container w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-zinc-500 font-mono text-sm">
            Loading satellite data...
          </div>
        </div>
      )}
    </>
  )
}
