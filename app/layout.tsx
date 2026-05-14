import type { Metadata } from 'next'
import './globals.css'
import { bebasNeue, inter } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Brewmier League',
  description: 'Log pints. Climb tables. Become legend.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body className="font-body min-h-screen bg-cream text-navy">
        {children}
      </body>
    </html>
  )
}
