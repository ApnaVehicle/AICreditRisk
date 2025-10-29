/**
 * Loan Detail Modal State Management Hook
 *
 * Provides global state management for the loan detail modal
 * Allows opening modal from anywhere in the app (alerts, buttons, etc.)
 */

'use client'

import { create } from 'zustand'

interface LoanModalState {
  isOpen: boolean
  loanId: string | null
  openModal: (loanId: string) => void
  closeModal: () => void
}

/**
 * Global state hook for loan detail modal
 * Uses Zustand for simple, performant state management
 */
export const useLoanModal = create<LoanModalState>((set) => ({
  isOpen: false,
  loanId: null,
  openModal: (loanId: string) => set({ isOpen: true, loanId }),
  closeModal: () => set({ isOpen: false, loanId: null }),
}))
