'use client'

interface SimpleGaugeProps {
  value: number
  min?: number
  max?: number
  unit?: string
  height?: number
}

export function SimpleGauge({ value, min = 0, max = 100, unit = '%', height = 200 }: SimpleGaugeProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const rotation = (percentage / 100) * 180 - 90

  const getColor = () => {
    if (percentage < 33) return '#10b981'
    if (percentage < 66) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="relative flex items-center justify-center" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 251} 251`}
        />
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke="#1e293b"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${rotation} 100 100)`}
        />
        {/* Center circle */}
        <circle cx="100" cy="100" r="8" fill="#1e293b" />
      </svg>
      <div className="absolute bottom-4 text-center">
        <div className="text-2xl font-bold">{value.toFixed(1)}{unit}</div>
      </div>
    </div>
  )
}
