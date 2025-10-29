'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TrendChartProps {
  data: Array<Record<string, any>>
  xField: string
  series: Array<{
    name: string
    field: string
    color?: string
  }>
  height?: number
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function TrendChart({ data, xField, series, height = 400 }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xField} stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
        />
        <Legend />
        {series.map((s, index) => (
          <Line
            key={s.field}
            type="monotone"
            dataKey={s.field}
            name={s.name}
            stroke={s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            strokeWidth={2}
            dot={{ fill: s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length], r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
