'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface SatPoint {
  lat: number
  lng: number
  alt: number
  name: string
}

const TLE_URLS = [
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
]

function parseTLE(
  text: string
): { name: string; line1: string; line2: string }[] {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const result: { name: string; line1: string; line2: string }[] = []
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (lines[i + 1]?.startsWith('1 ') && lines[i + 2]?.startsWith('2 ')) {
      result.push({ name: lines[i], line1: lines[i + 1], line2: lines[i + 2] })
    }
  }
  return result
}

function generateOrbitPath(inclination: number): number[][] {
  const points: number[][] = []
  const incRad = (inclination * Math.PI) / 180
  for (let i = 0; i <= 360; i += 1) {
    const rad = (i * Math.PI) / 180
    const lat = Math.asin(Math.sin(rad) * Math.sin(incRad)) * (180 / Math.PI)
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
  // Globe container ref — globe.gl takes full control of this element's DOM
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const stableOnSatCount = useCallback(
    (n: number) => onSatCount?.(n),
    [onSatCount]
  )

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const [globeModule, satellite] = await Promise.all([
        import('globe.gl'),
        import('satellite.js'),
      ])

      if (cancelled || !containerRef.current) return

      // Fetch satellite TLE data
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

      if (cancelled || !containerRef.current) return

      stableOnSatCount(positions.length)

      const orbitPoints = generateOrbitPath(97.4)
      const el = containerRef.current

      // globe.gl uses Kapsule v1.16+ class mode: must use `new` to pass element
      const Globe = globeModule.default
      const globe = new Globe(el)
        .width(el.clientWidth)
        .height(el.clientHeight)
        .globeImageUrl(
          'https://unpkg.com/three-globe/example/img/earth-dark.jpg'
        )
        .bumpImageUrl(
          'https://unpkg.com/three-globe/example/img/earth-topology.png'
        )
        .backgroundImageUrl(
          'https://unpkg.com/three-globe/example/img/night-sky.png'
        )
        .showAtmosphere(true)
        .atmosphereColor('lightskyblue')
        .atmosphereAltitude(0.18)
        .pointsData(positions)
        .pointColor(() => 'rgba(0, 255, 136, 0.7)')
        .pointAltitude('alt')
        .pointRadius(0.15)
        .pointLabel('name')
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

      globe.pointOfView({ lat: 30, lng: 140, altitude: 2.5 })

      // controls() may not be available until after first render frame
      const setupControls = () => {
        const controls = globe.controls?.()
        if (controls) {
          controls.autoRotate = true
          controls.autoRotateSpeed = 0.35
          controls.enableZoom = true
        } else {
          requestAnimationFrame(setupControls)
        }
      }
      requestAnimationFrame(setupControls)

      if (!cancelled) {
        globeRef.current = globe
      }
    }

    init().catch((e) => {
      if (!cancelled) setError(String(e))
    })

    return () => {
      cancelled = true
    }
  }, [stableOnSatCount])

  // Resize
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
    <>
      {/* Globe container — no React children, globe.gl owns this DOM */}
      <div ref={containerRef} className="absolute inset-0" />
      {/* Error overlay — sibling, not child of globe container */}
      {error && (
        <div className="absolute bottom-4 left-4 text-red-500 font-mono text-xs z-20 max-w-md break-all">
          {error}
        </div>
      )}
    </>
  )
}
