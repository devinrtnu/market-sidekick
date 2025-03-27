'use client'

import Link from 'next/link'
import { BarChart4 } from 'lucide-react'
import { MainNav } from '@/components/main-nav'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <BarChart4 className="h-6 w-6" />
            <span className="inline-block font-bold">Market Sidekick</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <MainNav />
        </div>
      </div>
    </header>
  )
}
