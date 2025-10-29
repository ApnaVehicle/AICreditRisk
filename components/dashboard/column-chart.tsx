'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ColumnChartProps {
  data: Array<Record<string, any>>
  categoryField: string
  valueField: string
  height?: number
  color?: string
}

export function ColumnChart({ data, categoryField, valueField, height = 300, color = '#3b82f6' }: ColumnChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={categoryField} stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <Bar dataKey={valueField} fill={color} radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8 + (index / data.length) * 0.2} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
