'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const GlobeScene = dynamic(() => import('@/components/GlobeScene'), {
  ssr: false,
})

const TIMELINE = [
  {
    phase: 'DAY 0',
    date: 'March 2026',
    title: 'Public declaration',
    desc: 'Open-source repo. Real-time satellite tracking. The mission starts now.',
    active: true,
  },
  {
    phase: 'PHASE 1',
    date: 'Mar — Apr 2026',
    title: 'Mission definition',
    desc: 'Payload spec. Orbit selection. Regulatory filing with Japanese authorities.',
    active: false,
  },
  {
    phase: 'PHASE 2',
    date: 'Apr — May 2026',
    title: 'Satellite procurement',
    desc: 'CubeSat bus selection. Component procurement. Ground station setup.',
    active: false,
  },
  {
    phase: 'PHASE 3',
    date: 'May — Sep 2026',
    title: 'Build & test',
    desc: 'Assembly. Environmental testing. Flight software development.',
    active: false,
  },
  {
    phase: 'PHASE 4',
    date: 'Sep — Oct 2026',
    title: 'Launch integration',
    desc: 'Rideshare slot. Vehicle integration. Final review.',
    active: false,
  },
  {
    phase: 'PHASE 5',
    date: 'Nov — Dec 2026',
    title: 'LAUNCH',
    desc: 'Orbit insertion. First contact. Mission operations begin.',
    active: false,
  },
]

export default function Home() {
  const [satCount, setSatCount] = useState(0)

  return (
    <main>
      {/* ====== HERO ====== */}
      <section className="relative h-screen w-full overflow-hidden bg-black">
        <GlobeScene onSatCount={setSatCount} />

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white animate-fade-in-up">
            ORBIT<span className="text-red-500">1</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-zinc-300 font-light animate-fade-in-up-delay">
            Going to orbit. Open source. 2026.
          </p>
          <p className="mt-2 text-sm text-zinc-500 animate-fade-in-up-delay-2">
            民間から宇宙へ。全過程を公開する。
          </p>
        </div>

        {/* Stats badge */}
        {satCount > 0 && (
          <div className="absolute bottom-8 right-8 text-xs text-zinc-600 font-mono z-20">
            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
            {satCount.toLocaleString()} satellites tracked live
          </div>
        )}

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 z-10 animate-bounce text-2xl">
          ↓
        </div>
      </section>

      {/* ====== MISSION ====== */}
      <section className="bg-black border-t border-zinc-900 py-24 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">
            Mission
          </h2>
          <div className="grid gap-12">
            {[
              {
                label: 'WHAT',
                text: '1U CubeSat technology demonstration mission. Proving that a small team with software DNA can reach orbit.',
              },
              {
                label: 'WHEN',
                text: 'Target launch: December 2026. From zero to orbit in under 10 months.',
              },
              {
                label: 'HOW',
                text: 'Open source from Day 0. Every decision, every milestone, every failure — public.',
              },
              {
                label: 'WHY',
                text: 'To prove the barrier to space is lower than anyone thinks. If we can do it, so can you.',
              },
            ].map((item) => (
              <div key={item.label}>
                <h3 className="text-red-500 text-xs font-mono tracking-widest mb-3">
                  {item.label}
                </h3>
                <p className="text-lg md:text-xl text-zinc-300 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TIMELINE ====== */}
      <section className="bg-zinc-950 border-t border-zinc-900 py-24 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">
            Timeline
          </h2>
          <div className="relative ml-3">
            {/* Vertical line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-800" />

            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div key={i} className="pl-8 relative">
                  {/* Dot */}
                  <div
                    className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full -translate-x-1/2 ${
                      item.active
                        ? 'bg-red-500 shadow-[0_0_8px_rgba(255,50,50,0.6)]'
                        : 'bg-zinc-700'
                    }`}
                  />
                  <div className="text-xs text-zinc-600 font-mono tracking-wider">
                    {item.phase}{' '}
                    <span className="text-zinc-700">— {item.date}</span>
                  </div>
                  <div
                    className={`text-xl md:text-2xl font-bold mt-1 ${
                      item.active ? 'text-red-500' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-zinc-500 mt-1 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== SPECS ====== */}
      <section className="bg-black border-t border-zinc-900 py-24 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">
            Technical specs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { label: 'Form factor', value: '1U CubeSat' },
              { label: 'Size', value: '10 × 10 × 10 cm' },
              { label: 'Mass', value: '< 1.33 kg' },
              { label: 'Orbit', value: 'LEO ~500 km SSO' },
              { label: 'Inclination', value: '97.4°' },
              { label: 'Mission life', value: 'TBD' },
            ].map((spec) => (
              <div key={spec.label}>
                <div className="text-xs text-zinc-600 font-mono tracking-wider mb-1">
                  {spec.label.toUpperCase()}
                </div>
                <div className="text-xl font-bold">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="bg-zinc-950 border-t border-zinc-900 py-24 px-6 md:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Follow the mission.
        </h2>
        <p className="text-zinc-500 mb-10 text-lg">
          Star the repo. Watch the progress. Join the journey.
        </p>
        <a
          href="https://github.com/tomiharu0317/orbit1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-white text-black px-10 py-4 font-bold text-lg hover:bg-zinc-200 transition-colors"
        >
          GitHub →
        </a>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-black border-t border-zinc-900 py-8 px-6 md:px-8 text-center">
        <p className="text-zinc-700 text-sm font-mono">
          ORBIT1 — Day 0: March 1, 2026
        </p>
      </footer>
    </main>
  )
}
