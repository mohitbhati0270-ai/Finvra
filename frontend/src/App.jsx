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

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

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

    // After 5 seconds stop showing waking up message
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
      if (detail) {
        setError(detail)
      } else {
        setError('Something went wrong. Please check your stock tickers and try again.')
      }
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
    ? (result.stocks.length > 20 ? 700
      : result.stocks.length > 10 ? 600
      : 420)
    : 420

  return (
    <div
      className="min-h-screen bg-gray-50 p-6"
      style={{
        paddingRight: result ? '340px' : '24px',
        transition: 'padding-right 0.3s ease'
      }}
    >
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finvra</h1>
          <p className="text-gray-500 mt-1">Indian Equity Portfolio Analysis</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('real')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'real' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Real Portfolio
            </button>
            <button
              onClick={() => setMode('quick')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'quick' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quick Analysis
            </button>
          </div>

          {mode === 'real' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Stock</th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Qty</th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Avg Buy Price (₹)</th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Amount Invested</th>
                      <th className="text-left text-xs text-gray-500 font-medium pb-3">Weight %</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {holdingCalcs.map((h, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-3">
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
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            className="border border-gray-200 rounded-lg px-3 py-2 w-24 text-sm focus:outline-none focus:border-blue-400"
                            value={h.qty || ''}
                            onChange={e => {
                              const n = [...holdings]
                              n[i].qty = parseFloat(e.target.value) || 0
                              setHoldings(n)
                            }}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="number"
                            className="border border-gray-200 rounded-lg px-3 py-2 w-32 text-sm focus:outline-none focus:border-blue-400"
                            value={h.avgPrice || ''}
                            onChange={e => {
                              const n = [...holdings]
                              n[i].avgPrice = parseFloat(e.target.value) || 0
                              setHoldings(n)
                            }}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <span className="text-sm font-medium text-gray-700">
                            {h.amount > 0 ? formatINR(h.amount) : '—'}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="text-sm font-bold text-blue-600">
                            {h.weight > 0 ? `${h.weight.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => setHoldings(holdings.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td className="pt-3 text-xs font-semibold text-gray-600">Total</td>
                      <td></td>
                      <td></td>
                      <td className="pt-3 text-sm font-bold text-gray-900">
                        {totalInvested > 0 ? formatINR(totalInvested) : '—'}
                      </td>
                      <td className="pt-3 text-sm font-bold text-green-600">
                        {totalInvested > 0 ? '100%' : '—'}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button
                onClick={() => setHoldings([...holdings, { ticker: '', qty: 0, avgPrice: 0 }])}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Stock
              </button>
            </div>
          )}

          {mode === 'quick' && (
            <div className="space-y-3">
              {quickTickers.map((ticker, i) => (
                <div key={i} className="flex gap-3 items-center">
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
                    className="border border-gray-300 rounded-lg px-3 py-2 w-24 text-sm"
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
                  <span className="text-sm text-gray-400">%</span>
                  <button
                    onClick={() => {
                      setQuickTickers(quickTickers.filter((_, idx) => idx !== i))
                      setQuickWeights(quickWeights.filter((_, idx) => idx !== i))
                    }}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className={`text-sm font-medium ${quickTotal === 100 ? 'text-green-600' : 'text-red-500'}`}>
                Total weight: {quickTotal}% {quickTotal === 100 ? '✓' : '(must be 100%)'}
              </div>
              <button
                onClick={() => {
                  setQuickTickers([...quickTickers, ''])
                  setQuickWeights([...quickWeights, 0])
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Stock
              </button>
            </div>
          )}

          <div className="mt-6 flex gap-3 items-center">
            <span className="text-sm text-gray-600">Period:</span>
            {['1y', '2y', '3y', '5y'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !isReady}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition"
          >
            {loading
              ? isWakingUp
                ? '⏳ Waking up server... please wait 30-60 seconds on first load'
                : '🔄 Analyzing your portfolio...'
              : 'Analyze Portfolio'
            }
          </button>

          {error && (
            <div className="mt-3 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              ⚠️ {error}
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Annual Return', value: formatPct(result.summary.annual_return_pct), color: returnColor(result.summary.annual_return_pct) },
                { label: 'Volatility', value: formatPct(result.summary.annual_volatility_pct), color: 'text-orange-500' },
                { label: 'Sharpe Ratio', value: result.summary.sharpe_ratio.toFixed(2), color: 'text-blue-600' },
                { label: 'Portfolio Beta', value: result.summary.portfolio_beta.toFixed(2), color: 'text-purple-600' },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {result?.score && <PortfolioScore score={result.score} />}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Individual Stocks</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Stock', 'Weight', 'Return', 'Volatility', 'Beta', 'Risk Contribution'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.stocks.map((stock, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{stock.ticker}</td>
                      <td className="px-4 py-3 text-gray-600">{stock.weight}%</td>
                      <td className={`px-4 py-3 font-medium ${returnColor(stock.annual_return)}`}>
                        {formatPct(stock.annual_return)}
                      </td>
                      <td className="px-4 py-3 text-orange-500">{formatPct(stock.annual_volatility)}</td>
                      <td className="px-4 py-3 text-gray-600">{stock.beta.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{stock.risk_contribution_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <RiskReturnChart stocks={result.stocks} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AllocationChart
                stocks={result.stocks}
                sharedHeight={sharedChartHeight}
              />
              <RiskContributionChart
                stocks={result.stocks}
                sharedHeight={sharedChartHeight}
              />
            </div>

            {benchData && <BenchmarkChart data={benchData} />}
            {optData && <PortfolioOptimizationChart data={optData} />}
            <CorrelationMatrix correlationMatrix={result.correlation_matrix} />
            {varData && <VaRChart data={varData} />}

            {returnsData && (
              <SensitivityAnalysis
                stocks={result.stocks}
                returnsData={returnsData}
              />
            )}

          </div>
        )}
      </div>

      {result?.insights && (
        <InsightsPanel insights={result.insights} />
      )}
    </div>
  )
}

export default App