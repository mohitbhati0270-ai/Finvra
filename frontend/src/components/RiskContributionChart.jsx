import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6',
  '#6366F1', '#F43F5E', '#22C55E', '#EAB308', '#0EA5E9',
  '#A855F7', '#FB923C', '#4ADE80', '#FACC15', '#38BDF8',
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 600, color: '#1E293B', margin: 0 }}>{d.ticker}</p>
      <p style={{ color: '#64748B', margin: 0 }}>Risk: {d.risk_contribution_pct?.toFixed(2)}%</p>
      <p style={{ color: '#64748B', margin: 0 }}>Weight: {d.weight}%</p>
    </div>
  )
}

export default function RiskContributionChart({ stocks, sharedHeight }) {
  if (!stocks || stocks.length === 0) return null

  const sorted      = [...stocks].sort((a, b) => b.risk_contribution_pct - a.risk_contribution_pct)
  const HEADER_HEIGHT = 80
  const chartHeight   = sharedHeight - HEADER_HEIGHT

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      style={{ height: sharedHeight }}
    >
      <h2 className="font-semibold text-gray-800 mb-1">Risk Contribution</h2>
      <p className="text-xs text-gray-400 mb-4">
        How much each stock contributes to total portfolio risk
      </p>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11 }}
            domain={[0, 'auto']}
          />
          <YAxis
            type="category"
            dataKey="ticker"
            tick={{ fontSize: 11 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="risk_contribution_pct"
            radius={[0, 4, 4, 0]}
            label={{
              position:  'right',
              formatter: v => `${v.toFixed(1)}%`,
              fontSize:  11,
              fill:      '#64748B',
            }}
          >
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}