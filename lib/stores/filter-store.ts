import { create } from 'zustand'

export type Sector = 'MANUFACTURING' | 'RETAIL' | 'IT' | 'HEALTHCARE' | 'REAL_ESTATE' | 'AGRICULTURE'
export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH'
export type LoanStatus = 'ACTIVE' | 'CLOSED' | 'NPA' | 'RESTRUCTURED'

export interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  sectors: Sector[]
  geographies: string[]
  riskCategories: RiskCategory[]
  loanStatuses: LoanStatus[]
  amountRange: {
    min: number
    max: number
  }
  searchQuery: string
}

interface FilterStore {
  filters: DashboardFilters
  setDateRange: (from: Date, to: Date) => void
  setSectors: (sectors: Sector[]) => void
  setGeographies: (geographies: string[]) => void
  setRiskCategories: (categories: RiskCategory[]) => void
  setLoanStatuses: (statuses: LoanStatus[]) => void
  setAmountRange: (min: number, max: number) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
  getQueryParams: () => URLSearchParams
}

// Default filters - Last 30 days
const getDefaultFilters = (): DashboardFilters => ({
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  },
  sectors: [],
  geographies: [],
  riskCategories: [],
  loanStatuses: [],
  amountRange: {
    min: 0,
    max: 100000000, // 10 Cr
  },
  searchQuery: '',
})

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: getDefaultFilters(),

  setDateRange: (from, to) =>
    set((state) => ({
      filters: { ...state.filters, dateRange: { from, to } },
    })),

  setSectors: (sectors) =>
    set((state) => ({
      filters: { ...state.filters, sectors },
    })),

  setGeographies: (geographies) =>
    set((state) => ({
      filters: { ...state.filters, geographies },
    })),

  setRiskCategories: (categories) =>
    set((state) => ({
      filters: { ...state.filters, riskCategories: categories },
    })),

  setLoanStatuses: (statuses) =>
    set((state) => ({
      filters: { ...state.filters, loanStatuses: statuses },
    })),

  setAmountRange: (min, max) =>
    set((state) => ({
      filters: { ...state.filters, amountRange: { min, max } },
    })),

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    })),

  resetFilters: () => set({ filters: getDefaultFilters() }),

  getQueryParams: () => {
    const { filters } = get()
    const params = new URLSearchParams()

    // Date range
    params.append('startDate', filters.dateRange.from.toISOString().split('T')[0])
    params.append('endDate', filters.dateRange.to.toISOString().split('T')[0])

    // Sectors
    if (filters.sectors.length > 0) {
      filters.sectors.forEach((s) => params.append('sector', s))
    }

    // Geographies
    if (filters.geographies.length > 0) {
      filters.geographies.forEach((g) => params.append('geography', g))
    }

    // Risk categories
    if (filters.riskCategories.length > 0) {
      filters.riskCategories.forEach((r) => params.append('riskCategory', r))
    }

    // Loan statuses
    if (filters.loanStatuses.length > 0) {
      filters.loanStatuses.forEach((s) => params.append('status', s))
    }

    // Amount range
    if (filters.amountRange.min > 0) {
      params.append('minAmount', filters.amountRange.min.toString())
    }
    if (filters.amountRange.max < 100000000) {
      params.append('maxAmount', filters.amountRange.max.toString())
    }

    // Search query
    if (filters.searchQuery) {
      params.append('search', filters.searchQuery)
    }

    return params
  },
}))
