'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const path = usePathname()

  return (
    <nav className="bg-navy text-foam border-b-4 border-beer-gold">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-foam rounded-full p-0.5 flex-shrink-0">
            <Image src="/logo.png" alt="Brewmier League" width={32} height={32} className="block" />
          </div>
          <span className="font-headline text-2xl tracking-wider text-beer-gold leading-none">
            BREWMIER LEAGUE
          </span>
        </Link>
        <div className="flex gap-4 text-sm font-body">
          <Link
            href="/log"
            className={`px-3 py-1 font-semibold ${path === '/log' ? 'bg-beer-gold text-navy' : 'text-foam hover:text-beer-gold'}`}
          >
            Log Pint
          </Link>
          <Link
            href="/rules"
            className={`px-3 py-1 ${path === '/rules' ? 'text-beer-gold' : 'text-foam hover:text-beer-gold'}`}
          >
            Rules
          </Link>
        </div>
      </div>
    </nav>
  )
}
