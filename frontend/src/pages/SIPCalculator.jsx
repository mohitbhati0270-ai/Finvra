import { useState, useMemo } from 'react'
import { theme } from '../theme'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts'

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    maximumFractionDigits: 0,
  }).format(value)

const formatCrLakh = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000)   return `₹${(value / 100000).toFixed(2)} L`
  return formatINR(value)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:   theme.navyCard,
      border:       `1px solid ${theme.border}`,
      borderRadius: '10px',
      padding:      '12px 16px',
      fontSize:     '12px',
    }}>
      <p style={{ color: theme.gold, fontWeight: '700', margin: '0 0 8px' }}>Year {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '4px 0' }}>
          {p.name}: {formatCrLakh(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function SIPCalculator() {
  const [sip, setSip]           = useState(10000)
  const [rate, setRate]         = useState(12)
  const [years, setYears]       = useState(10)
  const [inflation, setInflation] = useState(false)
  const [inflationRate, setInflationRate] = useState(6)
  const [mode, setMode]         = useState('sip') // sip or lumpsum
  const [lumpsum, setLumpsum]   = useState(100000)

  const results = useMemo(() => {
    if (mode === 'sip') {
      const monthlyRate = rate / 100 / 12
      const months      = years * 12
      const totalInvested = sip * months
      const finalValue  = sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
      const totalReturns = finalValue - totalInvested

      // Year by year data
      const chartData = []
      for (let y = 1; y <= years; y++) {
        const m  = y * 12
        const fv = sip * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate)
        const inv = sip * m
        chartData.push({
          year:      y,
          invested:  Math.round(inv),
          value:     Math.round(fv),
          returns:   Math.round(fv - inv),
        })
      }

      // Real value adjusted for inflation
      const realValue = inflation
        ? finalValue / Math.pow(1 + inflationRate / 100, years)
        : null

      return { totalInvested, finalValue, totalReturns, chartData, realValue }

    } else {
      // Lumpsum
      const finalValue    = lumpsum * Math.pow(1 + rate / 100, years)
      const totalReturns  = finalValue - lumpsum

      const chartData = []
      for (let y = 1; y <= years; y++) {
        const fv = lumpsum * Math.pow(1 + rate / 100, y)
        chartData.push({
          year:     y,
          invested: lumpsum,
          value:    Math.round(fv),
          returns:  Math.round(fv - lumpsum),
        })
      }

      const realValue = inflation
        ? finalValue / Math.pow(1 + inflationRate / 100, years)
        : null

      return { totalInvested: lumpsum, finalValue, totalReturns, chartData, realValue }
    }
  }, [sip, rate, years, inflation, inflationRate, mode, lumpsum])

  const wealthGain = ((results.totalReturns / results.totalInvested) * 100).toFixed(1)

  const sliderStyle = (value, min, max) => ({
    width:      '100%',
    height:     '4px',
    borderRadius:'2px',
    outline:    'none',
    cursor:     'pointer',
    background: `linear-gradient(to right, ${theme.gold} 0%, ${theme.gold} ${((value - min) / (max - min)) * 100}%, rgba(201,168,76,0.2) ${((value - min) / (max - min)) * 100}%, rgba(201,168,76,0.2) 100%)`,
    appearance: 'none',
    WebkitAppearance: 'none',
  })

  return (
    <div style={{ background: theme.navyDark, minHeight: '100vh', color: theme.white }}>

      {/* Header */}
      <section style={{
        padding:    '80px 40px 60px',
        textAlign:  'center',
        background: `radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }}>
        <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '16px' }}>
          FINANCIAL CALCULATORS
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: theme.white, lineHeight: 1.2, marginBottom: '16px' }}>
          SIP & Lumpsum
          <span style={{ color: theme.gold }}> Calculator</span>
        </h1>
        <p style={{ color: theme.gray, fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
          Calculate how your investments grow over time with the power of compounding.
        </p>
      </section>

      <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '28px' }}>

          {/* Input Panel */}
          <div style={{
            background:   theme.navyCard,
            border:       `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding:      '32px',
          }}>

            {/* Mode Toggle */}
            <div style={{
              display:      'flex',
              background:   theme.navy,
              borderRadius: '12px',
              padding:      '4px',
              marginBottom: '28px',
            }}>
              {[
                { id: 'sip',      label: '📅 SIP' },
                { id: 'lumpsum',  label: '💰 Lumpsum' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    flex:       1,
                    padding:    '8px',
                    borderRadius:'10px',
                    border:     'none',
                    cursor:     'pointer',
                    fontSize:   '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    background: mode === m.id
                      ? `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`
                      : 'transparent',
                    color:      mode === m.id ? theme.navyDark : theme.gray,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* SIP Amount */}
            {mode === 'sip' && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ color: theme.gray, fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                    MONTHLY SIP AMOUNT
                  </label>
                  <span style={{ color: theme.gold, fontWeight: '700', fontSize: '14px' }}>
                    {formatINR(sip)}
                  </span>
                </div>
                <input
                  type="range" min={500} max={200000} step={500}
                  value={sip}
                  onChange={e => setSip(Number(e.target.value))}
                  style={sliderStyle(sip, 500, 200000)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ color: theme.gray, fontSize: '11px' }}>₹500</span>
                  <span style={{ color: theme.gray, fontSize: '11px' }}>₹2L</span>
                </div>
              </div>
            )}

            {/* Lumpsum Amount */}
            {mode === 'lumpsum' && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ color: theme.gray, fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                    LUMPSUM AMOUNT
                  </label>
                  <span style={{ color: theme.gold, fontWeight: '700', fontSize: '14px' }}>
                    {formatCrLakh(lumpsum)}
                  </span>
                </div>
                <input
                  type="range" min={10000} max={10000000} step={10000}
                  value={lumpsum}
                  onChange={e => setLumpsum(Number(e.target.value))}
                  style={sliderStyle(lumpsum, 10000, 10000000)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ color: theme.gray, fontSize: '11px' }}>₹10K</span>
                  <span style={{ color: theme.gray, fontSize: '11px' }}>₹1 Cr</span>
                </div>
              </div>
            )}

            {/* Expected Return */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ color: theme.gray, fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                  EXPECTED ANNUAL RETURN
                </label>
                <span style={{ color: theme.gold, fontWeight: '700', fontSize: '14px' }}>{rate}%</span>
              </div>
              <input
                type="range" min={1} max={30} step={0.5}
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                style={sliderStyle(rate, 1, 30)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ color: theme.gray, fontSize: '11px' }}>1%</span>
                <span style={{ color: theme.gray, fontSize: '11px' }}>30%</span>
              </div>
            </div>

            {/* Time Period */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ color: theme.gray, fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                  TIME PERIOD
                </label>
                <span style={{ color: theme.gold, fontWeight: '700', fontSize: '14px' }}>{years} Years</span>
              </div>
              <input
                type="range" min={1} max={40} step={1}
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                style={sliderStyle(years, 1, 40)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ color: theme.gray, fontSize: '11px' }}>1 Year</span>
                <span style={{ color: theme.gray, fontSize: '11px' }}>40 Years</span>
              </div>
            </div>

            {/* Inflation Toggle */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              justifyContent:'space-between',
              padding:      '16px',
              background:   theme.navy,
              borderRadius: '12px',
              marginBottom: inflation ? '16px' : '0',
            }}>
              <div>
                <div style={{ color: theme.white, fontSize: '13px', fontWeight: '600' }}>Adjust for Inflation</div>
                <div style={{ color: theme.gray, fontSize: '11px', marginTop: '2px' }}>Show real value of money</div>
              </div>
              <div
                onClick={() => setInflation(!inflation)}
                style={{
                  width:        '44px',
                  height:       '24px',
                  borderRadius: '12px',
                  background:   inflation ? theme.gold : theme.navyLight || '#162444',
                  cursor:       'pointer',
                  position:     'relative',
                  transition:   'background 0.2s',
                  border:       `1px solid ${theme.border}`,
                }}
              >
                <div style={{
                  width:      '18px',
                  height:     '18px',
                  borderRadius:'50%',
                  background: 'white',
                  position:   'absolute',
                  top:        '2px',
                  left:       inflation ? '22px' : '2px',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>

            {inflation && (
              <div style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ color: theme.gray, fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
                    INFLATION RATE
                  </label>
                  <span style={{ color: theme.gold, fontWeight: '700', fontSize: '14px' }}>{inflationRate}%</span>
                </div>
                <input
                  type="range" min={1} max={15} step={0.5}
                  value={inflationRate}
                  onChange={e => setInflationRate(Number(e.target.value))}
                  style={sliderStyle(inflationRate, 1, 15)}
                />
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Result Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                {
                  label: mode === 'sip' ? 'Total Invested' : 'Amount Invested',
                  value: formatCrLakh(results.totalInvested),
                  color: theme.gray,
                  bg:    theme.navyCard,
                },
                {
                  label: 'Total Returns',
                  value: formatCrLakh(results.totalReturns),
                  color: theme.green,
                  bg:    'rgba(16,185,129,0.08)',
                },
                {
                  label: 'Final Corpus',
                  value: formatCrLakh(results.finalValue),
                  color: theme.gold,
                  bg:    'rgba(201,168,76,0.08)',
                },
              ].map((card, i) => (
                <div key={i} style={{
                  background:   card.bg,
                  border:       `1px solid ${theme.border}`,
                  borderRadius: '16px',
                  padding:      '20px',
                  textAlign:    'center',
                }}>
                  <p style={{ fontSize: '11px', color: theme.gray, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                    {card.label}
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: '800', color: card.color, margin: 0 }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Wealth Gain Badge */}
            <div style={{
              background:     'rgba(201,168,76,0.08)',
              border:         `1px solid ${theme.border}`,
              borderRadius:   '14px',
              padding:        '16px 20px',
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              flexWrap:       'wrap',
              gap:            '12px',
            }}>
              <div>
                <span style={{ color: theme.gray, fontSize: '13px' }}>Wealth Gain: </span>
                <span style={{ color: theme.gold, fontWeight: '700', fontSize: '15px' }}>{wealthGain}%</span>
                <span style={{ color: theme.gray, fontSize: '12px', marginLeft: '8px' }}>
                  over {years} years at {rate}% p.a.
                </span>
              </div>
              {results.realValue && (
                <div>
                  <span style={{ color: theme.gray, fontSize: '12px' }}>Real value (after {inflationRate}% inflation): </span>
                  <span style={{ color: '#F97316', fontWeight: '700', fontSize: '14px' }}>
                    {formatCrLakh(results.realValue)}
                  </span>
                </div>
              )}
            </div>

            {/* Growth Chart */}
            <div style={{
              background:   theme.navyCard,
              border:       `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding:      '24px',
            }}>
              <h3 style={{ color: theme.white, fontSize: '15px', fontWeight: '700', margin: '0 0 20px' }}>
                Investment Growth Over Time
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={theme.gold} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={theme.gold} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={theme.green} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={theme.green} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: theme.gray, fontSize: 11 }}
                    tickFormatter={v => `Y${v}`}
                  />
                  <YAxis
                    tick={{ fill: theme.gray, fontSize: 11 }}
                    tickFormatter={v => formatCrLakh(v)}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={v => <span style={{ color: theme.gray, fontSize: '12px' }}>{v}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Final Value"
                    stroke={theme.gold}
                    strokeWidth={2.5}
                    fill="url(#goldGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    name="Amount Invested"
                    stroke={theme.green}
                    strokeWidth={2}
                    fill="url(#greenGrad)"
                    strokeDasharray="5 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Yearly Breakdown Table */}
            <div style={{
              background:   theme.navyCard,
              border:       `1px solid ${theme.border}`,
              borderRadius: '16px',
              overflow:     'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.white }}>
                  Year-by-Year Breakdown
                </h3>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ background: theme.navy, position: 'sticky', top: 0 }}>
                    <tr>
                      {['Year', 'Invested', 'Returns', 'Total Value'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left',
                          color: theme.gray, fontWeight: '600',
                          fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.chartData.map((row, i) => (
                      <tr key={i} style={{
                        borderTop: `1px solid rgba(201,168,76,0.05)`,
                        background: i % 2 === 0 ? 'transparent' : 'rgba(201,168,76,0.02)',
                      }}>
                        <td style={{ padding: '10px 16px', color: theme.gold, fontWeight: '600' }}>Year {row.year}</td>
                        <td style={{ padding: '10px 16px', color: theme.gray }}>{formatCrLakh(row.invested)}</td>
                        <td style={{ padding: '10px 16px', color: theme.green }}>{formatCrLakh(row.returns)}</td>
                        <td style={{ padding: '10px 16px', color: theme.white, fontWeight: '600' }}>{formatCrLakh(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}