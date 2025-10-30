'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, ChevronDown, User } from 'lucide-react'

interface PremiumNavProps {
  userName?: string
  appName?: string
}

export function PremiumNav({
  userName = 'Shahabaj Sheikh',
  appName = 'Argus Credit Risk Platform'
}: PremiumNavProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked')
    setIsDropdownOpen(false)
  }

  const handleSettings = () => {
    // TODO: Implement settings navigation
    console.log('Settings clicked')
    setIsDropdownOpen(false)
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav
      className="glass-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border-primary)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      {/* App Name - Left */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A78BFA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <motion.h1
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-premium-h3"
          style={{
            color: 'var(--text-primary)',
            fontWeight: '600',
          }}
        >
          {appName}
        </motion.h1>
      </div>

      {/* User Profile - Right */}
      <div style={{ position: 'relative' }}>
        <motion.button
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center premium-button"
          style={{
            gap: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)'
            e.currentTarget.style.borderColor = 'var(--border-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--border-primary)'
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A78BFA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
              letterSpacing: '0.5px',
            }}
          >
            {getInitials(userName)}
          </div>

          {/* Name */}
          <span className="text-premium-body" style={{ fontWeight: '500' }}>
            {userName}
          </span>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDropdownOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999,
                }}
              />

              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '240px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset',
                  zIndex: 1000,
                }}
              >
                {/* User Info Section */}
                <div
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-primary)',
                    marginBottom: '8px',
                  }}
                >
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A78BFA 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {getInitials(userName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        className="text-premium-body"
                        style={{
                          color: 'var(--text-primary)',
                          fontWeight: '600',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {userName}
                      </p>
                      <p
                        className="text-premium-caption"
                        style={{
                          color: 'var(--text-quaternary)',
                          marginTop: '2px',
                        }}
                      >
                        Admin Account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSettings}
                    className="flex items-center text-premium-body"
                    style={{
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="flex items-center text-premium-body"
                    style={{
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
