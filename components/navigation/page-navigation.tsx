'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3, Target, Sparkles } from 'lucide-react'

export type PageType = 'dashboard' | 'foresight' | 'loans'

interface PageConfig {
  id: PageType
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const PAGES: PageConfig[] = [
  {
    id: 'dashboard',
    label: 'Control Center',
    href: '/',
    icon: BarChart3,
  },
  {
    id: 'foresight',
    label: 'Argus Foresight',
    href: '/foresight',
    icon: Sparkles,
  },
  {
    id: 'loans',
    label: 'Loan Explorer',
    href: '/loans',
    icon: Target,
  },
]

interface PageNavigationProps {
  currentPage: PageType
}

export function PageNavigation({ currentPage }: PageNavigationProps) {
  // Filter out the current page - show only the other 2 pages
  const navigationPages = PAGES.filter((page) => page.id !== currentPage)

  return (
    <div className="flex" style={{ gap: '12px' }}>
      {navigationPages.map((page) => {
        const Icon = page.icon
        return (
          <Link key={page.id} href={page.href}>
            <Button variant="outline" size="sm" className="premium-button">
              <Icon className="h-4 w-4" style={{ marginRight: '8px' }} />
              {page.label}
            </Button>
          </Link>
        )
      })}
    </div>
  )
}
