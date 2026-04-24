import { Routes, Route } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { analyzePortfolio, getVaR, getReturnsData, getBenchmarkComparison, getOptimizationChart } from './api/portfolioApi'
import { formatPct, returnColor } from './utils/formatters'
import { theme } from './theme'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Services from './pages/Services'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import SIPCalculator from './pages/SIPCalculator'
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
import ImportExcel from './components/ImportExcel'

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

function AnalysePage() {
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
    const withAmounts = holdings.map(h => ({ ...h, amount: h.qty * h.avgPrice }))
    const total = withAmounts.reduce((s, h) => s + h.amount, 0)
    return withAmounts.map(h => ({
      ...h,
      weight: total > 0 ? parseFloat(((h.amount / total) * 100).toFixed(2)) : 0,
      total,
    }))
  }, [holdings])

  const totalInvested = holdingCalcs[0]?.total || 0

  const handleImport = (importedHoldings) => {
    setHoldings(importedHoldings)
    setResult(null)
    setError(null)
  }

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
      background:   theme.navyDark,
      minHeight:    '100vh',
      paddingRight: result ? '340px' : '0',
      transition:   'padding-right 0.3s ease',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 60px' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '8px' }}>
            PORTFOLIO ANALYSIS
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: theme.white, margin: 0 }}>
            Analyse Your Portfolio
          </h1>
          <p style={{ color: theme.gray, fontSize: '14px', marginTop: '8px' }}>
            Enter your holdings below and get institutional grade analytics in seconds
          </p>
        </div>

        <div style={{
          background:   theme.navyCard,
          border:       `1px solid ${theme.border}`,
          borderRadius: '20px',
          padding:      '32px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
          }}>
            <div style={{ display: 'flex', background: theme.navy, borderRadius: '12px', padding: '4px' }}>
              {[
                { id: 'real',  label: '💼 My Real Portfolio' },
                { id: 'quick', label: '⚡ Quick Analysis' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                  background: mode === m.id ? `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})` : 'transparent',
                  color: mode === m.id ? theme.navyDark : theme.gray,
                  boxShadow: mode === m.id ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
                }}>
                  {m.label}
                </button>
              ))}
            </div>
            {mode === 'real' && <ImportExcel onImport={handleImport} />}
          </div>

          {mode === 'real' && (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                      {['Stock', 'Qty', 'Avg Buy Price (₹)', 'Amount Invested', 'Weight %', ''].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 12px 12px 0',
                          color: theme.gray, fontWeight: '600', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdingCalcs.map((h, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid rgba(201,168,76,0.05)` }}>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <StockSearch value={h.ticker} onChange={val => {
                            const n = [...holdings]; n[i].ticker = val; setHoldings(n)
                          }} placeholder="Search stock..." />
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <input type="number" style={{
                            border: `1.5px solid ${theme.border}`, borderRadius: '10px',
                            padding: '8px 12px', width: '88px', fontSize: '13px',
                            outline: 'none', background: theme.navy, color: theme.white,
                          }}
                            value={h.qty || ''} placeholder="0" min="0"
                            onChange={e => { const n = [...holdings]; n[i].qty = parseFloat(e.target.value) || 0; setHoldings(n) }}
                            onFocus={e => e.target.style.borderColor = theme.gold}
                            onBlur={e => e.target.style.borderColor = theme.border}
                          />
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <input type="number" style={{
                            border: `1.5px solid ${theme.border}`, borderRadius: '10px',
                            padding: '8px 12px', width: '110px', fontSize: '13px',
                            outline: 'none', background: theme.navy, color: theme.white,
                          }}
                            value={h.avgPrice || ''} placeholder="0.00" min="0" step="0.01"
                            onChange={e => { const n = [...holdings]; n[i].avgPrice = parseFloat(e.target.value) || 0; setHoldings(n) }}
                            onFocus={e => e.target.style.borderColor = theme.gold}
                            onBlur={e => e.target.style.borderColor = theme.border}
                          />
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <span style={{ fontWeight: '600', color: theme.white, fontSize: '13px' }}>
                            {h.amount > 0 ? formatINR(h.amount) : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <span style={{
                            fontWeight: '700', fontSize: '13px',
                            color: h.weight > 0 ? theme.gold : theme.gray,
                            background: h.weight > 0 ? 'rgba(201,168,76,0.1)' : 'transparent',
                            padding: h.weight > 0 ? '3px 8px' : '0', borderRadius: '6px',
                          }}>
                            {h.weight > 0 ? `${h.weight.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 0' }}>
                          <button onClick={() => setHoldings(holdings.filter((_, idx) => idx !== i))}
                            style={{ background: 'none', border: 'none', color: theme.gray, cursor: 'pointer', fontSize: '18px' }}
                            onMouseEnter={e => e.target.style.color = theme.red}
                            onMouseLeave={e => e.target.style.color = theme.gray}
                          >×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${theme.border}` }}>
                      <td colSpan={3} style={{ padding: '12px 0 0', fontSize: '12px', fontWeight: '600', color: theme.gray }}>TOTAL</td>
                      <td style={{ padding: '12px 0 0', fontWeight: '700', color: theme.white, fontSize: '14px' }}>
                        {totalInvested > 0 ? formatINR(totalInvested) : '—'}
                      </td>
                      <td style={{ padding: '12px 0 0', fontWeight: '700', color: theme.green, fontSize: '14px' }}>
                        {totalInvested > 0 ? '100%' : '—'}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button onClick={() => setHoldings([...holdings, { ticker: '', qty: 0, avgPrice: 0 }])}
                style={{
                  marginTop: '16px', background: 'none',
                  border: `1.5px dashed rgba(201,168,76,0.3)`, borderRadius: '10px',
                  padding: '8px 16px', color: theme.gold, fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', width: '100%',
                }}>
                + Add Stock
              </button>
            </div>
          )}

          {mode === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quickTickers.map((ticker, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <StockSearch value={ticker} onChange={val => {
                    const t = [...quickTickers]; t[i] = val; setQuickTickers(t)
                  }} placeholder="Search stock..." />
                  <input type="number" style={{
                    border: `1.5px solid ${theme.border}`, borderRadius: '10px',
                    padding: '8px 12px', width: '90px', fontSize: '13px',
                    outline: 'none', background: theme.navy, color: theme.white,
                  }}
                    value={quickWeights[i] || ''} placeholder="Weight %" min="0" max="100"
                    onChange={e => { const w = [...quickWeights]; w[i] = parseFloat(e.target.value) || 0; setQuickWeights(w) }}
                  />
                  <span style={{ fontSize: '13px', color: theme.gray }}>%</span>
                  <button onClick={() => {
                    setQuickTickers(quickTickers.filter((_, idx) => idx !== i))
                    setQuickWeights(quickWeights.filter((_, idx) => idx !== i))
                  }} style={{ background: 'none', border: 'none', color: theme.gray, cursor: 'pointer', fontSize: '18px' }}
                    onMouseEnter={e => e.target.style.color = theme.red}
                    onMouseLeave={e => e.target.style.color = theme.gray}
                  >×</button>
                </div>
              ))}
              <div style={{ fontSize: '13px', fontWeight: '600', color: quickTotal === 100 ? theme.green : theme.red }}>
                Total: {quickTotal}% {quickTotal === 100 ? '✓' : '— must equal 100%'}
              </div>
              <button onClick={() => { setQuickTickers([...quickTickers, '']); setQuickWeights([...quickWeights, 0]) }}
                style={{
                  background: 'none', border: `1.5px dashed rgba(201,168,76,0.3)`,
                  borderRadius: '10px', padding: '8px 16px', color: theme.gold,
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%',
                }}>
                + Add Stock
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '12px', color: theme.gray, fontWeight: '600', marginRight: '4px', letterSpacing: '1px' }}>PERIOD</span>
            {['1y', '2y', '3y', '5y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 16px', borderRadius: '8px',
                border: period === p ? 'none' : `1.5px solid ${theme.border}`,
                cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                background: period === p ? `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})` : 'transparent',
                color: period === p ? theme.navyDark : theme.gray,
                boxShadow: period === p ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
              }}>{p}</button>
            ))}
          </div>

          <button onClick={handleAnalyze} disabled={loading || !isReady} style={{
            marginTop: '20px', width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            cursor: loading || !isReady ? 'not-allowed' : 'pointer',
            fontSize: '15px', fontWeight: '700',
            color: loading || !isReady ? theme.gray : theme.navyDark,
            background: loading || !isReady ? theme.navy : `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
            boxShadow: loading || !isReady ? 'none' : '0 8px 24px rgba(201,168,76,0.4)',
            transition: 'all 0.2s', letterSpacing: '0.3px',
          }}>
            {loading
              ? isWakingUp
                ? '⏳ Waking up server... please wait 30-60 seconds on first load'
                : '🔄 Analyzing your portfolio...'
              : '✦ Analyse Portfolio'
            }
          </button>

          {error && (
            <div style={{
              marginTop: '12px', padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', color: theme.red, fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ExportPDF result={result} benchData={benchData} varData={varData} />
            </div>

            {(() => {
              const explain = getExplain(result)
              const cards = [
                {
                  label: 'Annual Return', value: formatPct(result.summary.annual_return_pct), explain: explain.return,
                  gradient: result.summary.annual_return_pct >= 0 ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
                  bg: result.summary.annual_return_pct >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: result.summary.annual_return_pct >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                },
                {
                  label: 'Volatility', value: formatPct(result.summary.annual_volatility_pct), explain: explain.volatility,
                  gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
                  bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)',
                },
                {
                  label: 'Sharpe Ratio', value: result.summary.sharpe_ratio.toFixed(2), explain: explain.sharpe,
                  gradient: `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
                  bg: 'rgba(201,168,76,0.08)', border: theme.border,
                },
                {
                  label: 'Portfolio Beta', value: result.summary.portfolio_beta.toFixed(2), explain: explain.beta,
                  gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)',
                },
              ]
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{
                      background: card.bg, border: `1px solid ${card.border}`,
                      borderRadius: '16px', padding: '20px',
                    }}>
                      <p style={{ fontSize: '11px', color: theme.gray, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>{card.label}</p>
                      <p style={{
                        fontSize: '28px', fontWeight: '800', margin: '0 0 8px',
                        background: card.gradient, WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      }}>{card.value}</p>
                      <p style={{ fontSize: '11px', color: theme.gray, margin: 0, lineHeight: 1.5 }}>{card.explain}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {result?.score && <PortfolioScore score={result.score} />}

            <div style={{ background: theme.navyCard, border: `1px solid ${theme.border}`, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`, borderRadius: '50%' }} />
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.white }}>Individual Stocks</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: theme.navy }}>
                  <tr>
                    {['Stock', 'Weight', 'Return', 'Volatility', 'Beta', 'Risk Contribution'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: theme.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.stocks.map((stock, i) => (
                    <tr key={i} style={{ borderTop: `1px solid rgba(201,168,76,0.05)`, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: theme.white }}>{stock.ticker}</td>
                      <td style={{ padding: '14px 16px', color: theme.gray }}>{stock.weight}%</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                        <span style={{
                          color: stock.annual_return >= 0 ? theme.green : theme.red,
                          background: stock.annual_return >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          padding: '3px 8px', borderRadius: '6px', fontSize: '12px',
                        }}>{formatPct(stock.annual_return)}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#F97316' }}>{formatPct(stock.annual_volatility)}</td>
                      <td style={{ padding: '14px 16px', color: theme.gray }}>{stock.beta.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px', color: theme.gray }}>{stock.risk_contribution_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <RiskReturnChart stocks={result.stocks} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <AllocationChart stocks={result.stocks} sharedHeight={sharedChartHeight} />
              <RiskContributionChart stocks={result.stocks} sharedHeight={sharedChartHeight} />
            </div>
            {benchData && <BenchmarkChart data={benchData} />}
            {optData && <PortfolioOptimizationChart data={optData} />}
            <CorrelationMatrix correlationMatrix={result.correlation_matrix} />
            {varData && <VaRChart data={varData} />}
            {returnsData && <SensitivityAnalysis stocks={result.stocks} returnsData={returnsData} />}

          </div>
        )}
      </div>
      {result?.insights && <InsightsPanel insights={result.insights} />}
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const keepAlive = () => fetch('https://finvra-backend.onrender.com').catch(() => {})
    keepAlive()
    const interval = setInterval(keepAlive, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/services"        element={<Services />} />
        <Route path="/analyse"         element={<AnalysePage />} />
        <Route path="/sip-calculator"  element={<SIPCalculator />} />
        <Route path="/blog"            element={<Blog />} />
        <Route path="/contact"         element={<Contact />} />
      </Routes>
      <Footer />
    </div>
  )
}