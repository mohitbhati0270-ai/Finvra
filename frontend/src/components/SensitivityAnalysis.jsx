import { useState, useEffect } from 'react'
import { formatPct, returnColor } from '../utils/formatters'

function computePortfolioStats(returns, weights) {
  const n = returns.length
  const T = 252

  // Mean returns
  const means = returns[0].map((_, col) =>
    returns.reduce((sum, row) => sum + row[col], 0) / n
  )

  // Covariance matrix
  const numStocks = means.length
  const cov = Array(numStocks).fill(0).map(() => Array(numStocks).fill(0))
  for (let i = 0; i < numStocks; i++) {
    for (let j = 0; j < numStocks; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) {
        sum += (returns[k][i] - means[i]) * (returns[k][j] - means[j])
      }
      cov[i][j] = (sum / (n - 1)) * T
    }
  }

  const annMeans = means.map(m => m * T)
  const portReturn = weights.reduce((s, w, i) => s + w * annMeans[i], 0)
  let portVar = 0
  for (let i = 0; i < numStocks; i++) {
    for (let j = 0; j < numStocks; j++) {
      portVar += weights[i] * weights[j] * cov[i][j]
    }
  }
  const portVol = Math.sqrt(portVar)
  const sharpe = (portReturn - 0.065) / portVol

  return {
    return: parseFloat((portReturn * 100).toFixed(2)),
    risk: parseFloat((portVol * 100).toFixed(2)),
    sharpe: parseFloat(sharpe.toFixed(4)),
  }
}

export default function SensitivityAnalysis({ stocks, returnsData }) {
  const [sliderWeights, setSliderWeights] = useState(
    stocks.map(s => s.weight)
  )
  const [stats, setStats] = useState(null)

  const totalWeight = sliderWeights.reduce((a, b) => a + b, 0)
  const isValid = Math.abs(totalWeight - 100) < 0.01

  useEffect(() => {
    if (!returnsData || !isValid) return
    const w = sliderWeights.map(w => w / 100)
    const result = computePortfolioStats(returnsData, w)
    setStats(result)
  }, [sliderWeights, returnsData, isValid])

  const handleSliderChange = (index, value) => {
    const newWeights = [...sliderWeights]
    newWeights[index] = parseFloat(value)
    setSliderWeights(newWeights)
  }

  const handleReset = () => {
    setSliderWeights(stocks.map(s => s.weight))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Sensitivity Analysis</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Move sliders to see how weights affect portfolio metrics
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded-lg"
        >
          Reset
        </button>
      </div>

      {/* Weight sliders */}
      <div className="space-y-4 mb-6">
        {stocks.map((stock, i) => (
          <div key={stock.ticker}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                {stock.ticker}
              </span>
              <span className="text-sm font-bold text-blue-600">
                {sliderWeights[i].toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={sliderWeights[i]}
              onChange={e => handleSliderChange(i, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        ))}
      </div>

      {/* Total weight indicator */}
      <div className={`text-sm font-medium mb-4 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
        Total weight: {totalWeight.toFixed(1)}%
        {isValid ? ' ✓' : ' — must equal 100% to see results'}
      </div>

      {/* Live stats */}
      {stats && isValid && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Annual Return</p>
            <p className={`text-xl font-bold ${returnColor(stats.return)}`}>
              {formatPct(stats.return)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Volatility</p>
            <p className="text-xl font-bold text-orange-500">
              {formatPct(stats.risk)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Sharpe Ratio</p>
            <p className="text-xl font-bold text-blue-600">
              {stats.sharpe.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {!isValid && (
        <div className="bg-red-50 rounded-lg p-3 text-sm text-red-500 text-center">
          Adjust sliders so total equals 100%
        </div>
      )}
    </div>
  )
}