'use client'

import { useEffect, useRef, useState } from 'react'

interface SatPoint {
  lat: number
  lng: number
  alt: number
  name: string
}

// Use TLE text format — JSON format doesn't include TLE lines
const TLE_URLS = [
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
]

function parseTLE(text: string): { name: string; line1: string; line2: string }[] {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const result: { name: string; line1: string; line2: string }[] = []
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (lines[i + 1]?.startsWith('1 ') && lines[i + 2]?.startsWith('2 ')) {
      result.push({
        name: lines[i],
        line1: lines[i + 1],
        line2: lines[i + 2],
      })
    }
  }
  return result
}

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
  const globeRef = useRef<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current || globeRef.current) return

    const init = async () => {
      const [{ default: Globe }, satellite] = await Promise.all([
        import('globe.gl'),
        import('satellite.js'),
      ])

      // Fetch real satellite TLE data
      let positions: SatPoint[] = []
      try {
        const responses = await Promise.all(
          TLE_URLS.map((url) => fetch(url).then((r) => r.text()))
        )
        const allTLEs = responses.flatMap(parseTLE)
        const now = new Date()
        const gmst = satellite.gstime(now)

        positions = allTLEs
          .map((tle) => {
            try {
              const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
              const result = satellite.propagate(satrec, now)
              if (
                !result ||
                !result.position ||
                typeof result.position === 'boolean'
              )
                return null
              const pos = result.position as {
                x: number
                y: number
                z: number
              }
              const geo = satellite.eciToGeodetic(pos, gmst)
              return {
                lat: satellite.degreesLat(geo.latitude),
                lng: satellite.degreesLong(geo.longitude),
                alt: (geo.height / 6371) * 4,
                name: tle.name,
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

      const el = containerRef.current!
      // globe.gl is a Kapsule factory: Globe()(element), not new Globe(element)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globe = (Globe as any)()(el)
        .width(el.clientWidth)
        .height(el.clientHeight)
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
        .pointRadius(0.15)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resize handler
  useEffect(() => {
    const onResize = () => {
      const globe = globeRef.current as any
      const el = containerRef.current
      if (globe && el) {
        globe.width(el.clientWidth).height(el.clientHeight)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-zinc-500 font-mono text-sm">
            Loading satellite data...
          </div>
        </div>
      )}
    </div>
  )
}
