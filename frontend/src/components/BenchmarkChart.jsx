import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'

export default function BenchmarkChart({ data }) {
  const chartData = data.dates.map((date, i) => ({
    date: date.slice(0, 7),
    Portfolio: data.portfolio[i],
    'NIFTY 50': data.nifty50[i],
  }))

  const portfolioFinal = data.portfolio[data.portfolio.length - 1]
  const niftyFinal = data.nifty50[data.nifty50.length - 1]
  const outperforming = portfolioFinal > niftyFinal

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Benchmark Comparison</h2>
          <p className="text-xs text-gray-400 mt-0.5">Portfolio vs NIFTY 50</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          outperforming
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {outperforming ? 'Outperforming' : 'Underperforming'} NIFTY 50
        </span>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            unit="%"
            tickFormatter={v => `${v.toFixed(0)}%`}
          />
          <Tooltip
            formatter={(value, name) => [`${value.toFixed(2)}%`, name]}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="Portfolio"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="NIFTY 50"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium mb-1">Portfolio total return</p>
          <p className={`text-xl font-bold ${portfolioFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioFinal >= 0 ? '+' : ''}{portfolioFinal.toFixed(2)}%
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs text-amber-600 font-medium mb-1">NIFTY 50 total return</p>
          <p className={`text-xl font-bold ${niftyFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {niftyFinal >= 0 ? '+' : ''}{niftyFinal.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  )
}