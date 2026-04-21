import { useState, useMemo } from 'react'
import { analyzePortfolio, getVaR, getReturnsData, getBenchmarkComparison, getOptimizationChart } from './api/portfolioApi'
import { formatPct, returnColor } from './utils/formatters'
import AllocationChart from './components/AllocationChart'
import RiskReturnChart from './components/RiskReturnChart'
import CorrelationMatrix from './components/CorrelationMatrix'
import RiskContributionChart from './components/RiskContributionChart'
import VaRChart from './components/VaRChart'
import SensitivityAnalysis from './components/SensitivityAnalysis'
import BenchmarkChart from './components/BenchmarkChart'
import PortfolioOptimizationChart from './components/PortfolioOptimizationChart'
import InsightsPanel from './components/InsightsPanel'
import PortfolioScore from './components/PortfolioScore'
import StockSearch from './components/StockSearch'
import ExportPDF from './components/ExportPDF'

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const gradientText = {
  background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #3B82F6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const cardStyle = {
  background: 'white',
  borderRadius: '16px',
  border: '1px solid rgba(99, 102, 241, 0.1)',
  boxShadow: '0 4px 24px rgba(99, 102, 241, 0.08)',
}

function App() {
  const [mode, setMode] = useState('real')

  const [holdings, setHoldings] = useState([
    { ticker: '', qty: 0, avgPrice: 0 },
    { ticker: '', qty: 0, avgPrice: 0 },
    { ticker: '', qty: 0, avgPrice: 0 },
  ])

  const [quickTickers, setQuickTickers] = useState(['', '', ''])
  const [quickWeights, setQuickWeights] = useState([0, 0, 0])

  const [period, setPeriod] = useState('2y')
  const [result, setResult] = useState(null)
  const [varData, setVarData] = useState(null)
  const [returnsData, setReturnsData] = useState(null)
  const [benchData, setBenchData] = useState(null)
  const [optData, setOptData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isWakingUp, setIsWakingUp] = useState(false)

  const holdingCalcs = useMemo(() => {
    const withAmounts = holdings.map(h => ({
      ...h,
      amount: h.qty * h.avgPrice,
    }))
    const total = withAmounts.reduce((s, h) => s + h.amount, 0)
    return withAmounts.map(h => ({
      ...h,
      weight: total > 0 ? parseFloat(((h.amount / total) * 100).toFixed(2)) : 0,
      total,
    }))
  }, [holdings])

  const totalInvested = holdingCalcs[0]?.total || 0

  const handleAnalyze = async () => {
    setLoading(true)
    setIsWakingUp(true)
    setError(null)
    setTimeout(() => setIsWakingUp(false), 5000)
    try {
      let tickers, weightDecimals
      if (mode === 'real') {
        const validHoldings = holdingCalcs.filter(h => h.ticker && h.amount > 0)
        if (validHoldings.length < 2) {
          setError('Please add at least 2 stocks with quantity and price to analyze.')
          setLoading(false)
          setIsWakingUp(false)
          return
        }
        tickers = validHoldings.map(h => h.ticker)
        weightDecimals = validHoldings.map(h => h.weight / 100)
      } else {
        const validQuick = quickTickers
          .map((t, i) => ({ ticker: t, weight: quickWeights[i] }))
          .filter(x => x.ticker && x.weight > 0)
        if (validQuick.length < 2) {
          setError('Please add at least 2 stocks with weights to analyze.')
          setLoading(false)
          setIsWakingUp(false)
          return
        }
        tickers = validQuick.map(x => x.ticker)
        const total = validQuick.reduce((s, x) => s + x.weight, 0)
        weightDecimals = validQuick.map(x => x.weight / total)
      }
      const [analytics, var_, rd, bench, opt] = await Promise.all([
        analyzePortfolio(tickers, weightDecimals, period),
        getVaR(tickers, weightDecimals, period),
        getReturnsData(tickers, weightDecimals, period),
        getBenchmarkComparison(tickers, weightDecimals, period),
        getOptimizationChart(tickers, weightDecimals, period),
      ])
      setResult(analytics)
      setVarData(var_)
      setReturnsData(rd.returns)
      setBenchData(bench)
      setOptData(opt)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || 'Something went wrong. Please check your stock tickers and try again.')
    } finally {
      setLoading(false)
      setIsWakingUp(false)
    }
  }

  const quickTotal = quickWeights.reduce((a, b) => a + b, 0)
  const isReady = mode === 'real'
    ? holdingCalcs.filter(h => h.ticker && h.amount > 0).length >= 2
    : quickTickers.filter((t, i) => t && quickWeights[i] > 0).length >= 2

  const sharedChartHeight = result
    ? (result.stocks.length > 20 ? 700 : result.stocks.length > 10 ? 600 : 420)
    : 420

  const getExplain = (result) => ({
    return: result.summary.annual_return_pct >= 15
      ? `Excellent! Portfolio grew ${result.summary.annual_return_pct}% per year`
      : result.summary.annual_return_pct >= 10
      ? `Good. Portfolio grew ${result.summary.annual_return_pct}% per year`
      : result.summary.annual_return_pct >= 0
      ? `Portfolio grew ${result.summary.annual_return_pct}% per year`
      : `Portfolio lost ${Math.abs(result.summary.annual_return_pct)}% per year`,
    volatility: result.summary.annual_volatility_pct <= 12
      ? `Low risk — swings ±${result.summary.annual_volatility_pct}% per year`
      : result.summary.annual_volatility_pct <= 20
      ? `Moderate risk — can swing ±${result.summary.annual_volatility_pct}% per year`
      : `High risk — can swing ±${result.summary.annual_volatility_pct}% per year`,
    sharpe: result.summary.sharpe_ratio >= 1.0
      ? 'Excellent — returns well justify the risk taken'
      : result.summary.sharpe_ratio >= 0.5
      ? 'Good — returns reasonably justify the risk'
      : result.summary.sharpe_ratio >= 0
      ? 'Low — returns barely justify the risk taken'
      : 'Poor — a fixed deposit currently beats this portfolio',
    beta: result.summary.portfolio_beta > 1.2
      ? `Aggressive — moves ${((result.summary.portfolio_beta - 1) * 100).toFixed(0)}% more than NIFTY 50`
      : result.summary.portfolio_beta > 1.0
      ? 'Slightly aggressive — moves a bit more than NIFTY 50'
      : result.summary.portfolio_beta > 0.8
      ? 'Slightly defensive — moves a bit less than NIFTY 50'
      : 'Defensive — much less volatile than NIFTY 50',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F7FF 0%, #EEF2FF 50%, #F5F3FF 100%)',
      paddingRight: result ? '340px' : '0',
      transition: 'padding-right 0.3s ease',
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
        padding: '0 32px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>F</span>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', ...gradientText }}>Finvra</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px', color: '#6366F1',
            background: 'rgba(99,102,241,0.08)',
            padding: '4px 10px', borderRadius: '20px',
            fontWeight: '600',
          }}>
            🇮🇳 NSE · NIFTY 50
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: 'center', padding: '56px 0 40px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6366F1',
            marginBottom: '20px',
            letterSpacing: '0.5px',
          }}>
            ✦ FREE · INSTITUTIONAL GRADE · REAL NSE DATA
          </div>
          <h1 style={{
            fontSize: '52px',
            fontWeight: '900',
            lineHeight: 1.1,
            marginBottom: '16px',
            color: '#0F172A',
          }}>
            Analyze your portfolio
            <br />
            <span style={gradientText}>like a pro</span>
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748B',
            maxWidth: '520px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}>
            Sharpe ratio, Monte Carlo, Efficient Frontier, VaR — institutional analytics made simple for every Indian investor.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              '📊 Portfolio Health Score',
              '🎯 Efficient Frontier',
              '📉 Value at Risk',
              '🔄 Monte Carlo',
              '📄 PDF Export',
            ].map((f, i) => (
              <span key={i} style={{
                fontSize: '12px',
                color: '#475569',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                padding: '6px 14px',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ── PORTFOLIO INPUT CARD ── */}
        <div style={{ ...cardStyle, padding: '32px', marginBottom: '24px' }}>

          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '28px',
            width: 'fit-content',
          }}>
            {[
              { id: 'real', label: '💼 My Real Portfolio' },
              { id: 'quick', label: '⚡ Quick Analysis' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  background: mode === m.id
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : 'transparent',
                  color: mode === m.id ? 'white' : '#64748B',
                  boxShadow: mode === m.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Real Portfolio Mode */}
          {mode === 'real' && (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      {['Stock', 'Qty', 'Avg Buy Price (₹)', 'Amount Invested', 'Weight %', ''].map(h => (
                        <th key={h} style={{
                          textAlign: 'left',
                          padding: '8px 12px 12px 0',
                          color: '#94A3B8',
                          fontWeight: '600',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdingCalcs.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <StockSearch
                            value={h.ticker}
                            onChange={val => {
                              const n = [...holdings]
                              n[i].ticker = val
                              setHoldings(n)
                            }}
                            placeholder="Search stock..."
                          />
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <input
                            type="number"
                            style={{
                              border: '1.5px solid #E2E8F0',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              width: '88px',
                              fontSize: '13px',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            value={h.qty || ''}
                            onChange={e => {
                              const n = [...holdings]
                              n[i].qty = parseFloat(e.target.value) || 0
                              setHoldings(n)
                            }}
                            placeholder="0"
                            min="0"
                            onFocus={e => e.target.style.borderColor = '#6366F1'}
                            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                          />
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <input
                            type="number"
                            style={{
                              border: '1.5px solid #E2E8F0',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              width: '110px',
                              fontSize: '13px',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            value={h.avgPrice || ''}
                            onChange={e => {
                              const n = [...holdings]
                              n[i].avgPrice = parseFloat(e.target.value) || 0
                              setHoldings(n)
                            }}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            onFocus={e => e.target.style.borderColor = '#6366F1'}
                            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                          />
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '13px' }}>
                            {h.amount > 0 ? formatINR(h.amount) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <span style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: h.weight > 0 ? '#6366F1' : '#CBD5E1',
                            background: h.weight > 0 ? 'rgba(99,102,241,0.08)' : 'transparent',
                            padding: h.weight > 0 ? '3px 8px' : '0',
                            borderRadius: '6px',
                          }}>
                            {h.weight > 0 ? `${h.weight.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 0' }}>
                          <button
                            onClick={() => setHoldings(holdings.filter((_, idx) => idx !== i))}
                            style={{
                              background: 'none', border: 'none',
                              color: '#CBD5E1', cursor: 'pointer',
                              fontSize: '18px', lineHeight: 1,
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.target.style.color = '#EF4444'}
                            onMouseLeave={e => e.target.style.color = '#CBD5E1'}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #F1F5F9' }}>
                      <td colSpan={3} style={{ padding: '12px 0 0', fontSize: '12px', fontWeight: '600', color: '#94A3B8' }}>
                        TOTAL
                      </td>
                      <td style={{ padding: '12px 0 0', fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>
                        {totalInvested > 0 ? formatINR(totalInvested) : '—'}
                      </td>
                      <td style={{ padding: '12px 0 0', fontWeight: '700', color: '#22C55E', fontSize: '14px' }}>
                        {totalInvested > 0 ? '100%' : '—'}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button
                onClick={() => setHoldings([...holdings, { ticker: '', qty: 0, avgPrice: 0 }])}
                style={{
                  marginTop: '16px',
                  background: 'none',
                  border: '1.5px dashed #C7D2FE',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  color: '#6366F1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(99,102,241,0.05)'
                  e.target.style.borderColor = '#6366F1'
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'none'
                  e.target.style.borderColor = '#C7D2FE'
                }}
              >
                + Add Stock
              </button>
            </div>
          )}

          {/* Quick Analysis Mode */}
          {mode === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickTickers.map((ticker, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <StockSearch
                    value={ticker}
                    onChange={val => {
                      const t = [...quickTickers]
                      t[i] = val
                      setQuickTickers(t)
                    }}
                    placeholder="Search stock..."
                  />
                  <input
                    type="number"
                    style={{
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      width: '90px',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                    value={quickWeights[i] || ''}
                    onChange={e => {
                      const w = [...quickWeights]
                      w[i] = parseFloat(e.target.value) || 0
                      setQuickWeights(w)
                    }}
                    placeholder="Weight %"
                    min="0"
                    max="100"
                  />
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>%</span>
                  <button
                    onClick={() => {
                      setQuickTickers(quickTickers.filter((_, idx) => idx !== i))
                      setQuickWeights(quickWeights.filter((_, idx) => idx !== i))
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: '#CBD5E1', cursor: 'pointer', fontSize: '18px',
                    }}
                    onMouseEnter={e => e.target.style.color = '#EF4444'}
                    onMouseLeave={e => e.target.style.color = '#CBD5E1'}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: quickTotal === 100 ? '#22C55E' : '#EF4444',
              }}>
                Total: {quickTotal}% {quickTotal === 100 ? '✓' : '— must equal 100%'}
              </div>
              <button
                onClick={() => {
                  setQuickTickers([...quickTickers, ''])
                  setQuickWeights([...quickWeights, 0])
                }}
                style={{
                  background: 'none',
                  border: '1.5px dashed #C7D2FE',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  color: '#6366F1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                + Add Stock
              </button>
            </div>
          )}

          {/* Period Selector */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginRight: '4px' }}>
              PERIOD
            </span>
            {['1y', '2y', '3y', '5y'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: period === p ? 'none' : '1.5px solid #E2E8F0',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  background: period === p
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : 'white',
                  color: period === p ? 'white' : '#64748B',
                  boxShadow: period === p ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !isReady}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              cursor: loading || !isReady ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              color: 'white',
              background: loading || !isReady
                ? '#CBD5E1'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: loading || !isReady
                ? 'none'
                : '0 8px 24px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
              letterSpacing: '0.3px',
            }}
          >
            {loading
              ? isWakingUp
                ? '⏳ Waking up server... please wait 30-60 seconds on first load'
                : '🔄 Analyzing your portfolio...'
              : '✦ Analyze Portfolio'
            }
          </button>

          {error && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              color: '#EF4444',
              fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── RESULTS ── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Export Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ExportPDF result={result} benchData={benchData} varData={varData} />
            </div>

            {/* Summary Cards */}
            {(() => {
              const explain = getExplain(result)
              const cards = [
                {
                  label: 'Annual Return',
                  value: formatPct(result.summary.annual_return_pct),
                  explain: explain.return,
                  gradient: result.summary.annual_return_pct >= 0
                    ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                    : 'linear-gradient(135deg, #EF4444, #DC2626)',
                  bg: result.summary.annual_return_pct >= 0 ? '#F0FDF4' : '#FEF2F2',
                  border: result.summary.annual_return_pct >= 0 ? '#BBF7D0' : '#FECACA',
                },
                {
                  label: 'Volatility',
                  value: formatPct(result.summary.annual_volatility_pct),
                  explain: explain.volatility,
                  gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
                  bg: '#FFF7ED',
                  border: '#FED7AA',
                },
                {
                  label: 'Sharpe Ratio',
                  value: result.summary.sharpe_ratio.toFixed(2),
                  explain: explain.sharpe,
                  gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  bg: '#EEF2FF',
                  border: '#C7D2FE',
                },
                {
                  label: 'Portfolio Beta',
                  value: result.summary.portfolio_beta.toFixed(2),
                  explain: explain.beta,
                  gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  bg: '#F5F3FF',
                  border: '#DDD6FE',
                },
              ]
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{
                      background: card.bg,
                      border: `1px solid ${card.border}`,
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    }}>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                        {card.label}
                      </p>
                      <p style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        margin: '0 0 8px',
                        background: card.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {card.value}
                      </p>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                        {card.explain}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Portfolio Score */}
            {result?.score && <PortfolioScore score={result.score} />}

            {/* Individual Stocks Table */}
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <div style={{
                  width: '8px', height: '8px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  borderRadius: '50%',
                }} />
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>
                  Individual Stocks
                </h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    {['Stock', 'Weight', 'Return', 'Volatility', 'Beta', 'Risk Contribution'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.stocks.map((stock, i) => (
                    <tr key={i} style={{
                      borderTop: '1px solid #F8FAFC',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: '#1E293B' }}>
                        {stock.ticker}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>{stock.weight}%</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                        <span style={{
                          color: stock.annual_return >= 0 ? '#16A34A' : '#DC2626',
                          background: stock.annual_return >= 0 ? '#F0FDF4' : '#FEF2F2',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}>
                          {formatPct(stock.annual_return)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#F97316' }}>{formatPct(stock.annual_volatility)}</td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>{stock.beta.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>{stock.risk_contribution_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Charts */}
            <RiskReturnChart stocks={result.stocks} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <AllocationChart stocks={result.stocks} sharedHeight={sharedChartHeight} />
              <RiskContributionChart stocks={result.stocks} sharedHeight={sharedChartHeight} />
            </div>

            {benchData && <BenchmarkChart data={benchData} />}
            {optData && <PortfolioOptimizationChart data={optData} />}
            <CorrelationMatrix correlationMatrix={result.correlation_matrix} />
            {varData && <VaRChart data={varData} />}
            {returnsData && (
              <SensitivityAnalysis stocks={result.stocks} returnsData={returnsData} />
            )}

          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(99,102,241,0.1)',
        }}>
          <span style={{ fontSize: '20px', fontWeight: '800', ...gradientText }}>Finvra</span>
          <p style={{ color: '#94A3B8', fontSize: '12px', marginTop: '8px' }}>
            Indian Equity Portfolio Analysis · Real NSE Data · Not financial advice
          </p>
        </div>

      </div>

      {/* Floating Insights Panel */}
      {result?.insights && <InsightsPanel insights={result.insights} />}
    </div>
  )
}

export default App