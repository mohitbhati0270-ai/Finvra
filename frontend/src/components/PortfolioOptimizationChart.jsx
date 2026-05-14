import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ZAxis, Cell, Line, LineChart,
  ComposedChart
} from 'recharts'
import { theme } from '../theme'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background:   theme.navyCard,
      border:       `1px solid ${theme.border}`,
      borderRadius: 8,
      padding:      '8px 12px',
      fontSize:     12,
    }}>
      <p style={{ color: theme.gray, margin: 0 }}>
        Return: <strong style={{ color: theme.white }}>{d.return?.toFixed(2)}%</strong>
      </p>
      <p style={{ color: theme.gray, margin: 0 }}>
        Risk: <strong style={{ color: theme.white }}>{d.risk?.toFixed(2)}%</strong>
      </p>
      {d.sharpe !== undefined && (
        <p style={{ color: theme.gray, margin: 0 }}>
          Sharpe: <strong style={{ color: theme.gold }}>{d.sharpe?.toFixed(2)}</strong>
        </p>
      )}
    </div>
  )
}

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

export default function PortfolioOptimizationChart({ data }) {
  if (!data) return null

  const simPoints      = data.simulations
  const frontierPoints = [...data.frontier].sort((a, b) => a.risk - b.risk)
  const current        = data.current_portfolio
  const maxSharpe      = data.max_sharpe
  const minVar         = data.min_variance
  const bestWeights    = data.best_sharpe_weights
  const minVarWeights  = data.min_variance_weights || {}

  const allRisks   = [...simPoints.map(p => p.risk), ...frontierPoints.map(p => p.risk), current.risk]
  const allReturns = [...simPoints.map(p => p.return), ...frontierPoints.map(p => p.return), current.return]
  const minRisk    = Math.floor(Math.min(...allRisks) - 1)
  const maxRisk    = Math.ceil(Math.max(...allRisks)  + 1)
  const minReturn  = Math.floor(Math.min(...allReturns) - 2)
  const maxReturn  = Math.ceil(Math.max(...allReturns)  + 2)

  return (
    <div style={{
      background:   theme.navyCard,
      border:       `1px solid ${theme.border}`,
      borderRadius: '16px',
      padding:      '24px',
    }}>
      <h2 style={{ color: theme.white, fontSize: '15px', fontWeight: '700', margin: '0 0 4px' }}>
        Portfolio Optimization
      </h2>
      <p style={{ color: theme.gray, fontSize: '12px', margin: '0 0 20px' }}>
        5,000 random portfolios — find where your portfolio sits vs optimal
      </p>

      <ResponsiveContainer width="100%" height={460}>
        <ComposedChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
          <XAxis
            dataKey="risk"
            type="number"
            domain={[minRisk, maxRisk]}
            name="Risk"
            unit="%"
            tick={{ fontSize: 11, fill: theme.gray }}
            label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -15, fontSize: 12, fill: theme.gray }}
          />
          <YAxis
            dataKey="return"
            type="number"
            domain={[minReturn, maxReturn]}
            name="Return"
            unit="%"
            tick={{ fontSize: 11, fill: theme.gray }}
            label={{ value: 'Return %', angle: -90, position: 'insideLeft', fontSize: 12, fill: theme.gray }}
          />
          <ZAxis range={[20, 20]} />
          <Tooltip content={<CustomTooltip />} />

          {/* 5000 simulation dots */}
          <Scatter data={simPoints} opacity={0.4}>
            {simPoints.map((_, i) => (
              <Cell key={i} fill="rgba(148,163,184,0.5)" />
            ))}
          </Scatter>

          {/* Efficient Frontier — clean line using Line component */}
          <Line
            data={frontierPoints}
            dataKey="return"
            dot={false}
            activeDot={false}
            stroke={theme.gold}
            strokeWidth={2.5}
            type="monotone"
          />

          {/* Min Variance point */}
          <Scatter
            data={[{ risk: minVar.risk, return: minVar.return }]}
            shape={<MinVarianceTriangle />}
          />

          {/* Max Sharpe point */}
          <Scatter
            data={[{ risk: maxSharpe.risk, return: maxSharpe.return }]}
            shape={<MaxSharpeStar />}
          />

          {/* Your Portfolio */}
          <Scatter
            data={[{ risk: current.risk, return: current.return, sharpe: current.sharpe }]}
            shape={<PortfolioTriangle />}
          />

        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', fontSize: '12px', color: theme.gray }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 15,14 1,14" fill="#EF4444" />
          </svg>
          <span>Your portfolio — Return: {current.return.toFixed(2)}%, Risk: {current.risk.toFixed(2)}%, Sharpe: {current.sharpe.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" fill="#F59E0B" />
          </svg>
          <span>Max Sharpe — Return: {maxSharpe.return.toFixed(2)}%, Risk: {maxSharpe.risk.toFixed(2)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,15 15,2 1,2" fill="#06B6D4" />
          </svg>
          <span>Min Variance — Return: {minVar.return.toFixed(2)}%, Risk: {minVar.risk.toFixed(2)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 24, height: 3, background: theme.gold, borderRadius: 2 }} />
          <span>Efficient Frontier</span>
        </div>
      </div>

      {/* Max Sharpe Weights */}
      <div style={{
        marginTop:    '16px',
        background:   'rgba(245,158,11,0.08)',
        border:       '1px solid rgba(245,158,11,0.2)',
        borderRadius: '12px',
        padding:      '16px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#F59E0B', margin: '0 0 10px' }}>
          ⭐ Suggested weights for best risk-adjusted return (Max Sharpe)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(bestWeights).map(([ticker, weight]) => (
            <span key={ticker} style={{
              background:   'rgba(245,158,11,0.1)',
              border:       '1px solid rgba(245,158,11,0.3)',
              color:        '#F59E0B',
              fontSize:     '12px',
              padding:      '4px 10px',
              borderRadius: '8px',
              fontWeight:   '600',
            }}>
              {ticker}: {weight}%
            </span>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: theme.gray, margin: '8px 0 0' }}>
          Return: {maxSharpe.return.toFixed(2)}% | Risk: {maxSharpe.risk.toFixed(2)}%
        </p>
      </div>

      {/* Min Variance Weights */}
      <div style={{
        marginTop:    '12px',
        background:   'rgba(6,182,212,0.08)',
        border:       '1px solid rgba(6,182,212,0.2)',
        borderRadius: '12px',
        padding:      '16px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#06B6D4', margin: '0 0 10px' }}>
          🛡️ Suggested weights for minimum risk (Min Variance)
        </p>
        {Object.keys(minVarWeights).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(minVarWeights).map(([ticker, weight]) => (
              <span key={ticker} style={{
                background:   'rgba(6,182,212,0.1)',
                border:       '1px solid rgba(6,182,212,0.3)',
                color:        '#06B6D4',
                fontSize:     '12px',
                padding:      '4px 10px',
                borderRadius: '8px',
                fontWeight:   '600',
              }}>
                {ticker}: {weight}%
              </span>
            ))}
          </div>
        )}
        <p style={{ fontSize: '11px', color: theme.gray, margin: '8px 0 0' }}>
          Return: {minVar.return.toFixed(2)}% | Risk: {minVar.risk.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}