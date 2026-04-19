import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot
} from 'recharts'

export default function EfficientFrontier({ data }) {
  const points = data.risks.map((r, i) => ({
    risk: r,
    return: data.returns[i],
    sharpe: data.sharpes[i],
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Efficient Frontier</h2>
      <p className="text-xs text-gray-400 mb-4">Optimal risk-return tradeoff curve</p>

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
          <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
          <Scatter data={points} fill="#6366F1" opacity={0.8} />
          <ReferenceDot
            x={data.min_variance.risk}
            y={data.min_variance.return}
            r={8}
            fill="#10B981"
            stroke="#fff"
            strokeWidth={2}
            label={{ value: 'Min Risk', position: 'top', fontSize: 10 }}
          />
          <ReferenceDot
            x={data.max_sharpe.risk}
            y={data.max_sharpe.return}
            r={8}
            fill="#F59E0B"
            stroke="#fff"
            strokeWidth={2}
            label={{ value: 'Max Sharpe', position: 'top', fontSize: 10 }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-green-700 mb-1">Min Variance Portfolio</p>
          <p className="text-sm text-green-600">Return: {data.min_variance.return.toFixed(2)}%</p>
          <p className="text-sm text-green-600">Risk: {data.min_variance.risk.toFixed(2)}%</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Max Sharpe Portfolio</p>
          <p className="text-sm text-amber-600">Return: {data.max_sharpe.return.toFixed(2)}%</p>
          <p className="text-sm text-amber-600">Risk: {data.max_sharpe.risk.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  )
}