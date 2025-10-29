'use client'

import React from 'react'
import { ReferenceProvider } from '@/lib/context/reference-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReferenceProvider>
      {children}
    </ReferenceProvider>
  )
}
