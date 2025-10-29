'use client'

import { useState } from 'react'
import { useFilterStore, Sector, RiskCategory, LoanStatus } from '@/lib/stores/filter-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X, Calendar, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const SECTORS: Sector[] = [
  'MANUFACTURING',
  'RETAIL',
  'IT',
  'HEALTHCARE',
  'REAL_ESTATE',
  'AGRICULTURE',
]

const GEOGRAPHIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
]

const RISK_CATEGORIES: RiskCategory[] = ['LOW', 'MEDIUM', 'HIGH']
const LOAN_STATUSES: LoanStatus[] = ['ACTIVE', 'CLOSED', 'NPA', 'RESTRUCTURED']

interface FilterPanelProps {
  onFilterChange?: () => void
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const { filters, setSectors, setGeographies, setRiskCategories, setLoanStatuses, resetFilters } =
    useFilterStore()
  const [isExpanded, setIsExpanded] = useState(true)

  const toggleSector = (sector: Sector) => {
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter((s) => s !== sector)
      : [...filters.sectors, sector]
    setSectors(newSectors)
    onFilterChange?.()
  }

  const toggleGeography = (geo: string) => {
    const newGeos = filters.geographies.includes(geo)
      ? filters.geographies.filter((g) => g !== geo)
      : [...filters.geographies, geo]
    setGeographies(newGeos)
    onFilterChange?.()
  }

  const toggleRiskCategory = (risk: RiskCategory) => {
    const newRisks = filters.riskCategories.includes(risk)
      ? filters.riskCategories.filter((r) => r !== risk)
      : [...filters.riskCategories, risk]
    setRiskCategories(newRisks)
    onFilterChange?.()
  }

  const toggleLoanStatus = (status: LoanStatus) => {
    const newStatuses = filters.loanStatuses.includes(status)
      ? filters.loanStatuses.filter((s) => s !== status)
      : [...filters.loanStatuses, status]
    setLoanStatuses(newStatuses)
    onFilterChange?.()
  }

  const activeFiltersCount =
    filters.sectors.length +
    filters.geographies.length +
    filters.riskCategories.length +
    filters.loanStatuses.length

  const handleReset = () => {
    resetFilters()
    onFilterChange?.()
  }

  if (!isExpanded) {
    return (
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Show Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-3 w-3" />
                Reset All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Date Range</label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(filters.dateRange.from, 'MMM d, yyyy')} -{' '}
                {format(filters.dateRange.to, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="space-y-4">
          {/* Sectors */}
          <div>
            <label className="mb-2 block text-sm font-medium">Sectors</label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((sector) => (
                <Badge
                  key={sector}
                  variant={filters.sectors.includes(sector) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleSector(sector)}
                >
                  {sector}
                  {filters.sectors.includes(sector) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Geographies */}
          <div>
            <label className="mb-2 block text-sm font-medium">Geography</label>
            <div className="flex flex-wrap gap-2">
              {GEOGRAPHIES.map((geo) => (
                <Badge
                  key={geo}
                  variant={filters.geographies.includes(geo) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleGeography(geo)}
                >
                  {geo}
                  {filters.geographies.includes(geo) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Risk Categories */}
          <div>
            <label className="mb-2 block text-sm font-medium">Risk Category</label>
            <div className="flex flex-wrap gap-2">
              {RISK_CATEGORIES.map((risk) => (
                <Badge
                  key={risk}
                  variant={filters.riskCategories.includes(risk) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleRiskCategory(risk)}
                >
                  {risk}
                  {filters.riskCategories.includes(risk) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Loan Status */}
          <div>
            <label className="mb-2 block text-sm font-medium">Loan Status</label>
            <div className="flex flex-wrap gap-2">
              {LOAN_STATUSES.map((status) => (
                <Badge
                  key={status}
                  variant={filters.loanStatuses.includes(status) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLoanStatus(status)}
                >
                  {status}
                  {filters.loanStatuses.includes(status) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
