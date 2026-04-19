import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, Cell
} from 'recharts'

const getSharpeColor = (sharpe) => {
  if (sharpe >= 0.5)  return '#22C55E'
  if (sharpe >= 0.2)  return '#84CC16'
  if (sharpe >= 0)    return '#EAB308'
  if (sharpe >= -0.3) return '#F97316'
  return '#EF4444'
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ color: '#64748B', margin: 0 }}>
        Return: <strong>{d.return?.toFixed(2)}%</strong>
      </p>
      <p style={{ color: '#64748B', margin: 0 }}>
        Risk: <strong>{d.risk?.toFixed(2)}%</strong>
      </p>
      {d.sharpe !== undefined && (
        <p style={{ color: '#64748B', margin: 0 }}>
          Sharpe: <strong>{d.sharpe?.toFixed(2)}</strong>
        </p>
      )}
    </div>
  )
}

// Custom shape components
const PortfolioTriangle = (props) => {
  const { cx, cy } = props
  if (!cx || !cy) return null
  return (
    <polygon
      points={`${cx},${cy-13} ${cx+11},${cy+9} ${cx-11},${cy+9}`}
      fill="#EF4444" stroke="#fff" strokeWidth={2}
    />
  )
}

const MaxSharpeStar = (props) => {
  const { cx, cy } = props
  if (!cx || !cy) return null
  const pts = []
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const rad = i % 2 === 0 ? 13 : 5
    pts.push(`${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`)
  }
  return <polygon points={pts.join(' ')} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} />
}

const MinVarianceTriangle = (props) => {
  const { cx, cy } = props
  if (!cx || !cy) return null
  return (
    <polygon
      points={`${cx},${cy+13} ${cx+11},${cy-9} ${cx-11},${cy-9}`}
      fill="#06B6D4" stroke="#fff" strokeWidth={2}
    />
  )
}

// Custom frontier line rendered as SVG path inside the chart
const FrontierLine = (props) => {
  const { points } = props
  if (!points || points.length < 2) return null

  // Sort by x (risk) for smooth curve
  const sorted = [...points].sort((a, b) => a.x - b.x)

  // Build smooth SVG cubic bezier path
  const d = sorted.map((pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = sorted[i - 1]
    const cpx  = (prev.x + pt.x) / 2
    return `C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`
  }).join(' ')

  return (
    <path
      d={d}
      fill="none"
      stroke="#1E293B"
      strokeWidth={2.5}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  )
}

export default function PortfolioOptimizationChart({ data }) {
  if (!data) return null

  const simPoints      = data.simulations
  const frontierPoints = [...data.frontier].sort((a, b) => a.risk - b.risk)
  const current        = data.current_portfolio
  const maxSharpe      = data.max_sharpe
  const minVar         = data.min_variance
  const bestWeights    = data.best_sharpe_weights
  const minVarWeights  = data.min_variance_weights || {}

  // Compute axis domains with padding
  const allRisks   = [...simPoints.map(p => p.risk), ...frontierPoints.map(p => p.risk), current.risk]
  const allReturns = [...simPoints.map(p => p.return), ...frontierPoints.map(p => p.return), current.return]
  const minRisk    = Math.floor(Math.min(...allRisks) - 1)
  const maxRisk    = Math.ceil(Math.max(...allRisks) + 1)
  const minReturn  = Math.floor(Math.min(...allReturns) - 2)
  const maxReturn  = Math.ceil(Math.max(...allReturns) + 2)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Portfolio Optimization</h2>
      <p className="text-xs text-gray-400 mb-4">
        5,000 random portfolios — find where your portfolio sits vs optimal
      </p>

      <ResponsiveContainer width="100%" height={460}>
        <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="risk"
            type="number"
            domain={[minRisk, maxRisk]}
            name="Risk"
            unit="%"
            tick={{ fontSize: 11 }}
            label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -15, fontSize: 12 }}
          />
          <YAxis
            dataKey="return"
            type="number"
            domain={[minReturn, maxReturn]}
            name="Return"
            unit="%"
            tick={{ fontSize: 11 }}
            label={{ value: 'Return %', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <ZAxis range={[20, 20]} />
          <Tooltip content={<CustomTooltip />} />

          {/* 5000 simulation dots */}
          <Scatter data={simPoints} opacity={0.5}>
            {simPoints.map((_, i) => (
              <Cell key={i} fill="#CBD5E1" />
            ))}
          </Scatter>

          {/* Efficient Frontier as smooth curve */}
          <Scatter
            data={frontierPoints}
            shape={<FrontierLine />}
            line={{ stroke: '#1E293B', strokeWidth: 2.5 }}
            lineType="joint"
            fill="none"
            opacity={1}
          >
            {frontierPoints.map((_, i) => (
              <Cell key={i} fill="none" />
            ))}
          </Scatter>

          {/* Min Variance */}
          <Scatter
            data={[{ risk: minVar.risk, return: minVar.return }]}
            shape={<MinVarianceTriangle />}
          />

          {/* Max Sharpe */}
          <Scatter
            data={[{ risk: maxSharpe.risk, return: maxSharpe.return }]}
            shape={<MaxSharpeStar />}
          />

          {/* Your Portfolio */}
          <Scatter
            data={[{ risk: current.risk, return: current.return, sharpe: current.sharpe }]}
            shape={<PortfolioTriangle />}
          />

        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 15,14 1,14" fill="#EF4444" />
          </svg>
          <span>Your portfolio — Return: {current.return.toFixed(2)}%, Risk: {current.risk.toFixed(2)}%, Sharpe: {current.sharpe.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" fill="#F59E0B" />
          </svg>
          <span>Max Sharpe — Return: {maxSharpe.return.toFixed(2)}%, Risk: {maxSharpe.risk.toFixed(2)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,15 15,2 1,2" fill="#06B6D4" />
          </svg>
          <span>Min Variance — Return: {minVar.return.toFixed(2)}%, Risk: {minVar.risk.toFixed(2)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 24, height: 3, background: '#1E293B', borderRadius: 2 }} />
          <span>Efficient Frontier</span>
        </div>
      </div>

      {/* Max Sharpe Weights */}
      <div className="mt-4 bg-amber-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-amber-700 mb-2">
          Suggested weights for best risk-adjusted return (Max Sharpe)
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(bestWeights).map(([ticker, weight]) => (
            <span key={ticker} className="bg-white border border-amber-200 text-amber-700 text-xs px-2 py-1 rounded-lg">
              {ticker}: {weight}%
            </span>
          ))}
        </div>
        <p className="text-xs text-amber-600 mt-2">
          Return: {maxSharpe.return.toFixed(2)}% | Risk: {maxSharpe.risk.toFixed(2)}%
        </p>
      </div>

      {/* Min Variance Weights */}
      <div className="mt-3 bg-cyan-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-cyan-700 mb-2">
          Suggested weights for minimum risk (Min Variance)
        </p>
        {Object.keys(minVarWeights).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(minVarWeights).map(([ticker, weight]) => (
              <span key={ticker} className="bg-white border border-cyan-200 text-cyan-700 text-xs px-2 py-1 rounded-lg">
                {ticker}: {weight}%
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-cyan-600 mt-2">
          Return: {minVar.return.toFixed(2)}% | Risk: {minVar.risk.toFixed(2)}%
        </p>
      </div>

    </div>
  )
}