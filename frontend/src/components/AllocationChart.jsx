import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
      <p style={{ color: '#64748B', margin: 0 }}>{d.weight}%</p>
    </div>
  )
}

function Treemap({ stocks, height }) {
  const layout = (items, x, y, w, h) => {
    if (items.length === 0) return []
    if (items.length === 1) return [{ ...items[0], x, y, w, h }]
    const half        = Math.floor(items.length / 2)
    const firstHalf   = items.slice(0, half)
    const secondHalf  = items.slice(half)
    const firstWeight = firstHalf.reduce((s, i) => s + i.weight, 0)
    const totalWeight = items.reduce((s, i) => s + i.weight, 0)
    if (w >= h) {
      const splitX = x + (firstWeight / totalWeight) * w
      return [
        ...layout(firstHalf,  x,      y, splitX - x,      h),
        ...layout(secondHalf, splitX, y, w - (splitX - x), h),
      ]
    } else {
      const splitY = y + (firstWeight / totalWeight) * h
      return [
        ...layout(firstHalf,  x, y,      w, splitY - y),
        ...layout(secondHalf, x, splitY, w, h - (splitY - y)),
      ]
    }
  }

  const sorted = [...stocks].sort((a, b) => b.weight - a.weight)
  const boxes  = layout(sorted, 0, 0, 100, 100)

  return (
    <div style={{ width: '100%', height: height, position: 'relative' }}>
      {boxes.map((box, i) => {
        const fontSize = box.w > 8 && box.h > 6 ? Math.min(box.w, box.h) * 1.4 : 0
        return (
          <div
            key={i}
            title={`${box.ticker} — ${box.weight}%`}
            style={{
              position:       'absolute',
              left:           `${box.x}%`,
              top:            `${box.y}%`,
              width:          `${box.w}%`,
              height:         `${box.h}%`,
              background:     COLORS[i % COLORS.length],
              boxSizing:      'border-box',
              border:         '2px solid white',
              borderRadius:   '4px',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              overflow:       'hidden',
              cursor:         'default',
              transition:     'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {fontSize > 6 && (
              <>
                <span style={{
                  fontSize:     `${Math.min(fontSize, 14)}px`,
                  fontWeight:   '700',
                  color:        'white',
                  textAlign:    'center',
                  lineHeight:   1.2,
                  textShadow:   '0 1px 2px rgba(0,0,0,0.3)',
                  padding:      '0 4px',
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth:     '100%',
                }}>
                  {box.ticker}
                </span>
                <span style={{
                  fontSize: `${Math.min(fontSize * 0.75, 11)}px`,
                  color:    'rgba(255,255,255,0.85)',
                  textAlign: 'center',
                }}>
                  {box.weight}%
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AllocationChart({ stocks, sharedHeight }) {
  if (!stocks || stocks.length === 0) return null
  const useTreemap = stocks.length > 10
  const HEADER_HEIGHT = 80  // title + subtitle
  const LEGEND_HEIGHT = useTreemap ? 60 : 0
  const chartHeight   = sharedHeight - HEADER_HEIGHT - LEGEND_HEIGHT

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      style={{ height: sharedHeight }}
    >
      <h2 className="font-semibold text-gray-800 mb-1">Portfolio Allocation</h2>
      <p className="text-xs text-gray-400 mb-4">
        {useTreemap
          ? 'Larger box = higher weight in portfolio'
          : 'Weight distribution across your stocks'}
      </p>

      {useTreemap ? (
        <>
          <Treemap stocks={stocks} height={chartHeight - LEGEND_HEIGHT} />
          <div style={{
            display:   'flex',
            flexWrap:  'wrap',
            gap:       '6px',
            marginTop: '10px',
          }}>
            {[...stocks]
              .sort((a, b) => b.weight - a.weight)
              .map((stock, i) => (
                <div key={i} style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '4px',
                  fontSize:   '10px',
                  color:      '#475569',
                }}>
                  <div style={{
                    width:        '8px',
                    height:       '8px',
                    borderRadius: '2px',
                    background:   COLORS[i % COLORS.length],
                    flexShrink:   0,
                  }} />
                  <span>{stock.ticker} {stock.weight}%</span>
                </div>
              ))}
          </div>
        </>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={stocks}
              dataKey="weight"
              nameKey="ticker"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(chartHeight / 2 - 20, 110)}
              label={({ ticker, weight }) => `${ticker} ${weight}%`}
              labelLine={true}
            >
              {stocks.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}