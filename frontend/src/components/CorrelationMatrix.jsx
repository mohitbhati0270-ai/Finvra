export default function CorrelationMatrix({ correlationMatrix }) {
  const rawTickers = Object.keys(correlationMatrix)
  const tickers = rawTickers.map(t => t.replace('.NS', ''))

  const getColor = (value) => {
    if (value >= 0.8) return 'bg-red-500 text-white'
    if (value >= 0.6) return 'bg-red-300 text-white'
    if (value >= 0.4) return 'bg-orange-200 text-gray-800'
    if (value >= 0.2) return 'bg-yellow-100 text-gray-800'
    if (value >= 0) return 'bg-green-100 text-gray-800'
    return 'bg-blue-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4">Correlation Matrix</h2>
      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr>
              <th className="p-2"></th>
              {tickers.map(t => (
                <th key={t} className="p-2 text-gray-600 font-medium">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawTickers.map((rawRow, rowIdx) => (
              <tr key={rawRow}>
                <td className="p-2 font-medium text-gray-600">{tickers[rowIdx]}</td>
                {rawTickers.map((rawCol) => {
                  const val = correlationMatrix[rawRow][rawCol]
                  return (
                    <td
                      key={rawCol}
                      className={`p-2 text-center rounded ${getColor(val)}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-3 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> High (0.8+)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 inline-block"></span> Medium (0.4-0.6)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block"></span> Low (0-0.2)</span>
      </div>
    </div>
  )
}