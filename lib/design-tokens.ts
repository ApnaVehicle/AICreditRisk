/**
 * Premium Design Tokens
 * Surgical precision spacing and styling system
 * Base unit: 4px - All spacing must be multiples
 */

export const tokens = {
  // Spacing System (4px base unit)
  space: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },

  // Border Radius
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Layered Shadows (Premium effect)
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03) inset',
    md: '0 4px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04) inset',
    lg: '0 8px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset',
    xl: '0 12px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08) inset',
    glow: {
      primary: '0 0 20px rgba(99, 102, 241, 0.4)',
      success: '0 0 20px rgba(16, 185, 129, 0.4)',
      warning: '0 0 20px rgba(245, 158, 11, 0.4)',
      danger: '0 0 20px rgba(239, 68, 68, 0.4)',
    },
  },

  // Typography System
  typography: {
    hero: {
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '-0.03em',
      lineHeight: '1.2',
    },
    h1: {
      fontSize: '28px',
      fontWeight: '700',
      letterSpacing: '-0.025em',
      lineHeight: '1.25',
    },
    h2: {
      fontSize: '20px',
      fontWeight: '600',
      letterSpacing: '-0.02em',
      lineHeight: '1.3',
    },
    h3: {
      fontSize: '16px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      lineHeight: '1.4',
    },
    bodyLarge: {
      fontSize: '15px',
      fontWeight: '400',
      letterSpacing: '0',
      lineHeight: '1.6',
    },
    body: {
      fontSize: '14px',
      fontWeight: '400',
      letterSpacing: '0',
      lineHeight: '1.6',
    },
    caption: {
      fontSize: '13px',
      fontWeight: '500',
      letterSpacing: '0',
      lineHeight: '1.5',
    },
    label: {
      fontSize: '12px',
      fontWeight: '500',
      letterSpacing: '0.02em',
      lineHeight: '1.4',
      textTransform: 'uppercase' as const,
    },
    metricLarge: {
      fontSize: '36px',
      fontWeight: '700',
      letterSpacing: '-0.04em',
      lineHeight: '1.1',
    },
    metricMedium: {
      fontSize: '28px',
      fontWeight: '700',
      letterSpacing: '-0.03em',
      lineHeight: '1.15',
    },
    metricSmall: {
      fontSize: '24px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      lineHeight: '1.2',
    },
  },

  // Premium Color System
  colors: {
    // Background Layers
    bg: {
      primary: '#0A0F1C',
      secondary: '#111827',
      tertiary: '#1F2937',
    },

    // Borders
    border: {
      primary: 'rgba(255, 255, 255, 0.06)',
      hover: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(99, 102, 241, 0.5)',
    },

    // Text Hierarchy
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      quaternary: '#6B7280',
    },

    // Accents
    accent: {
      primary: '#6366F1',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },

    // Gradients
    gradient: {
      primary: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      card: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
      text: 'linear-gradient(90deg, #F9FAFB 0%, #D1D5DB 100%)',
    },
  },

  // Glass Morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(17, 24, 39, 0.6)',
    blur: {
      sm: '10px',
      md: '20px',
      lg: '24px',
    },
  },

  // Animation Timings
  transition: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Component Sizes
  sizes: {
    nav: {
      height: '64px',
    },
    sidebar: {
      left: '340px',
      right: '360px',
    },
    search: {
      width: '320px',
      height: '36px',
    },
    avatar: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    icon: {
      sm: '16px',
      md: '20px',
      lg: '24px',
    },
  },
} as const

// Helper function to get spacing value
export const spacing = (multiplier: number) => `${multiplier * 4}px`

// Helper for creating layered shadows
export const layeredShadow = (size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => tokens.shadow[size]
