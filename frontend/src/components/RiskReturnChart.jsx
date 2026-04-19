import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function RiskReturnChart({ stocks }) {
  const data = stocks.map(s => ({
    name: s.ticker,
    Return: parseFloat(s.annual_return.toFixed(2)),
    Volatility: parseFloat(s.annual_volatility.toFixed(2)),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4">Return vs Volatility</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="%" />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          <Bar dataKey="Return" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Volatility" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}