import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ORBIT1 — Going to orbit. Open source. 2026.',
  description:
    'A civilian mission to launch a CubeSat into orbit by December 2026. Every step, open source.',
  openGraph: {
    title: 'ORBIT1',
    description: 'Going to orbit. Open source. 2026.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORBIT1',
    description: 'Going to orbit. Open source. 2026.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
