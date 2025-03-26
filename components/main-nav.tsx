'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart4, LineChart, Settings, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: <BarChart4 className="h-4 w-4" /> 
  },
  { 
    name: 'Watchlist', 
    href: '/watchlist', 
    icon: <ListChecks className="h-4 w-4" /> 
  },
  { 
    name: 'Stocks', 
    href: '/stocks', 
    icon: <LineChart className="h-4 w-4" /> 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: <Settings className="h-4 w-4" /> 
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {item.icon}
          <span className="ml-2 hidden md:block">{item.name}</span>
        </Link>
      ))}
    </nav>
  )
} 