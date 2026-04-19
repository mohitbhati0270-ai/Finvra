import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot
} from 'recharts'

export default function MonteCarloChart({ data }) {
  const points = data.returns.map((r, i) => ({
    risk: data.risks[i],
    return: r,
    sharpe: data.sharpes[i],
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Monte Carlo Simulation</h2>
      <p className="text-xs text-gray-400 mb-4">{points.length} random portfolios</p>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="risk"
            name="Risk"
            unit="%"
            tick={{ fontSize: 11 }}
            label={{ value: 'Risk (%)', position: 'insideBottom', offset: -5, fontSize: 11 }}
          />
          <YAxis
            dataKey="return"
            name="Return"
            unit="%"
            tick={{ fontSize: 11 }}
            label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
          />
          <Scatter data={points} fill="#93C5FD" opacity={0.5} />
          <ReferenceDot
            x={data.best_sharpe.risk}
            y={data.best_sharpe.return}
            r={8}
            fill="#EF4444"
            stroke="#fff"
            strokeWidth={2}
            label={{ value: 'Best', position: 'top', fontSize: 11 }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 bg-red-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-red-700 mb-2">
          Best Sharpe Portfolio — {data.best_sharpe.sharpe.toFixed(2)}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.best_sharpe.weights).map(([ticker, weight]) => (
            <span key={ticker} className="bg-white border border-red-200 text-red-700 text-xs px-2 py-1 rounded-lg">
              {ticker}: {weight}%
            </span>
          ))}
        </div>
        <p className="text-xs text-red-500 mt-2">
          Return: {data.best_sharpe.return.toFixed(2)}% | Risk: {data.best_sharpe.risk.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}