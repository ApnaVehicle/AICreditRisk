'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface ReferenceEntity {
  id: string
  type: 'loan' | 'customer' | 'sector' | 'state' | 'metric'
  label: string
  description?: string
  icon?: string
}

interface ReferenceContextType {
  entities: ReferenceEntity[]
  searchEntities: (query: string, type?: string) => ReferenceEntity[]
  isLoading: boolean
}

const ReferenceContext = createContext<ReferenceContextType | undefined>(undefined)

export function ReferenceProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<ReferenceEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEntities()
  }, [])

  const loadEntities = async () => {
    try {
      // Load common reference entities
      const commonEntities: ReferenceEntity[] = [
        // Metrics
        { id: 'npa-rate', type: 'metric', label: 'NPA Rate', description: 'Non-Performing Asset Rate', icon: '📊' },
        { id: 'dpd', type: 'metric', label: 'DPD', description: 'Days Past Due', icon: '📅' },
        { id: 'collection-efficiency', type: 'metric', label: 'Collection Efficiency', description: 'Repayment success rate', icon: '💰' },
        { id: 'risk-score', type: 'metric', label: 'Risk Score', description: 'Portfolio risk score', icon: '⚠️' },
        { id: 'exposure', type: 'metric', label: 'Exposure', description: 'Total portfolio exposure', icon: '💵' },

        // Sectors (from data)
        { id: 'manufacturing', type: 'sector', label: 'Manufacturing', description: 'Manufacturing sector loans', icon: '🏭' },
        { id: 'retail', type: 'sector', label: 'Retail', description: 'Retail sector loans', icon: '🛒' },
        { id: 'services', type: 'sector', label: 'Services', description: 'Services sector loans', icon: '🔧' },
        { id: 'agriculture', type: 'sector', label: 'Agriculture', description: 'Agriculture sector loans', icon: '🌾' },
        { id: 'technology', type: 'sector', label: 'Technology', description: 'Technology sector loans', icon: '💻' },

        // States (common)
        { id: 'maharashtra', type: 'state', label: 'Maharashtra', description: 'Loans in Maharashtra', icon: '📍' },
        { id: 'karnataka', type: 'state', label: 'Karnataka', description: 'Loans in Karnataka', icon: '📍' },
        { id: 'tamil-nadu', type: 'state', label: 'Tamil Nadu', description: 'Loans in Tamil Nadu', icon: '📍' },
        { id: 'delhi', type: 'state', label: 'Delhi', description: 'Loans in Delhi', icon: '📍' },
        { id: 'west-bengal', type: 'state', label: 'West Bengal', description: 'Loans in West Bengal', icon: '📍' },

        // Common queries
        { id: 'high-risk', type: 'loan', label: 'High Risk Loans', description: 'Loans with high risk scores', icon: '🔴' },
        { id: 'npa', type: 'loan', label: 'NPA Loans', description: 'Non-performing assets', icon: '⚠️' },
        { id: 'dpd-90', type: 'loan', label: 'DPD 90+', description: 'Loans overdue 90+ days', icon: '📅' },
        { id: 'recent', type: 'loan', label: 'Recent Loans', description: 'Recently disbursed loans', icon: '🆕' },
      ]

      setEntities(commonEntities)
    } catch (error) {
      console.error('Error loading reference entities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchEntities = (query: string, type?: string): ReferenceEntity[] => {
    if (!query.trim()) {
      return type ? entities.filter(e => e.type === type).slice(0, 8) : entities.slice(0, 8)
    }

    const lowerQuery = query.toLowerCase()
    let filtered = entities.filter(entity =>
      entity.label.toLowerCase().includes(lowerQuery) ||
      entity.description?.toLowerCase().includes(lowerQuery)
    )

    if (type) {
      filtered = filtered.filter(e => e.type === type)
    }

    return filtered.slice(0, 8)
  }

  return (
    <ReferenceContext.Provider value={{ entities, searchEntities, isLoading }}>
      {children}
    </ReferenceContext.Provider>
  )
}

export function useReferences() {
  const context = useContext(ReferenceContext)
  if (!context) {
    throw new Error('useReferences must be used within ReferenceProvider')
  }
  return context
}
