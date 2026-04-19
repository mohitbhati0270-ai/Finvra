export default function VaRChart({ data }) {
  const levels = ['90', '95', '99']

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Value at Risk</h2>
      <p className="text-xs text-gray-400 mb-4">Daily VaR at multiple confidence levels</p>

      <div className="space-y-4">
        {levels.map(level => {
          const d = data[level]
          return (
            <div key={level} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {level}% Confidence Level
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CVaR (ES)', value: d.cvar, color: 'text-red-700' },
                  { label: 'Modified VaR', value: d.modified_var, color: 'text-purple-600' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color}`}>
                      -{item.value.toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">{data.note}</p>
    </div>
  )
}