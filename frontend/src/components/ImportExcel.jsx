import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'

const TICKER_COLS = ['symbol', 'ticker', 'stock', 'scrip', 'tradingsymbol', 'name', 'stock name', 'scrip name', 'instrument']
const QTY_COLS    = ['qty', 'quantity', 'units', 'shares', 'net qty', 'net quantity', 'holdings qty', 'balance qty']
const PRICE_COLS  = ['avg price', 'average price', 'avg buy price', 'average buy price', 'buy price', 'cost price', 'avg cost', 'ltp', 'price']

function findColumn(headers, candidates) {
  const lower = headers.map(h => h?.toString().toLowerCase().trim())
  for (const candidate of candidates) {
    const idx = lower.findIndex(h => h === candidate || h?.includes(candidate))
    if (idx !== -1) return idx
  }
  return -1
}

export default function ImportExcel({ onImport }) {
  const fileRef  = useRef(null)
  const [error, setError]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [parsed, setParsed]   = useState(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError(null)
    setPreview(null)
    setParsed(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data     = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet    = workbook.Sheets[workbook.SheetNames[0]]
        const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (rows.length < 2) {
          setError('File appears to be empty. Please check your Excel file.')
          return
        }

        // Find header row
        let headerRowIdx = 0
        let headers = []
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const row = rows[i].map(c => c?.toString().toLowerCase().trim())
          const tickerIdx = findColumn(row.map((_, j) => rows[i][j]), TICKER_COLS)
          if (tickerIdx !== -1) {
            headerRowIdx = i
            headers = rows[i].map(c => c?.toString())
            break
          }
        }

        if (headers.length === 0) {
          setError('Could not find stock/symbol column. Please make sure your Excel has columns for Stock Name, Qty and Avg Buy Price.')
          return
        }

        const tickerIdx = findColumn(headers, TICKER_COLS)
        const qtyIdx    = findColumn(headers, QTY_COLS)
        const priceIdx  = findColumn(headers, PRICE_COLS)

        if (tickerIdx === -1) {
          setError('Could not find Stock/Symbol column. Expected column names: Symbol, Stock, Scrip, Ticker.')
          return
        }
        if (qtyIdx === -1) {
          setError('Could not find Quantity column. Expected column names: Qty, Quantity, Units, Shares.')
          return
        }
        if (priceIdx === -1) {
          setError('Could not find Average Price column. Expected column names: Avg Price, Average Price, Buy Price, Cost Price.')
          return
        }

        // Parse data rows
        const holdings = []
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row    = rows[i]
          const ticker = row[tickerIdx]?.toString().trim().toUpperCase()
          const qty    = parseFloat(row[qtyIdx])
          const price  = parseFloat(row[priceIdx])

          if (!ticker || isNaN(qty) || isNaN(price)) continue
          if (qty <= 0 || price <= 0) continue

          // Remove .NS or .BO suffix if present
          const cleanTicker = ticker.replace(/\.(NS|BO|BSE|NSE)$/i, '')

          holdings.push({
            ticker: cleanTicker,
            qty:    qty,
            avgPrice: parseFloat(price.toFixed(2)),
          })
        }

        if (holdings.length === 0) {
          setError('No valid holdings found. Please check your file has stock data with positive quantity and price.')
          return
        }

        setPreview(holdings)
        setParsed(holdings)

      } catch (err) {
        setError('Could not read file. Please make sure it is a valid Excel (.xlsx) or CSV (.csv) file.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleConfirm = () => {
    if (parsed) {
      onImport(parsed)
      setPreview(null)
      setParsed(null)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setParsed(null)
    setError(null)
  }

  return (
    <div>
      {/* Import Button */}
      <button
        onClick={() => fileRef.current.click()}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '6px',
          padding:        '8px 16px',
          borderRadius:   '10px',
          border:         '1.5px solid #C7D2FE',
          background:     'rgba(99,102,241,0.05)',
          color:          '#6366F1',
          fontSize:       '13px',
          fontWeight:     '600',
          cursor:         'pointer',
          transition:     'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
      >
        📥 Import from Excel
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* Error */}
      {error && (
        <div style={{
          marginTop:    '12px',
          padding:      '12px 16px',
          background:   '#FEF2F2',
          border:       '1px solid #FECACA',
          borderRadius: '10px',
          color:        '#EF4444',
          fontSize:     '13px',
        }}>
          ⚠️ {error}
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
            💡 Tip: Your Excel should have columns like — Symbol/Stock, Qty/Quantity, Avg Price/Buy Price
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div style={{
          position:   'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex:     9999,
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding:    '20px',
        }}>
          <div style={{
            background:   'white',
            borderRadius: '20px',
            padding:      '28px',
            maxWidth:     '600px',
            width:        '100%',
            maxHeight:    '80vh',
            overflowY:    'auto',
            boxShadow:    '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>
                  Preview — {preview.length} stocks found
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Please confirm these holdings look correct
                </p>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '24px', cursor: 'pointer', color: '#94A3B8',
                }}
              >
                ×
              </button>
            </div>

            {/* Preview Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Stock', 'Qty', 'Avg Buy Price (₹)'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px',
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
                {preview.map((h, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1E293B' }}>{h.ticker}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{h.qty}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>₹{h.avgPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConfirm}
                style={{
                  flex:         1,
                  padding:      '12px',
                  borderRadius: '12px',
                  border:       'none',
                  background:   'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color:        'white',
                  fontSize:     '14px',
                  fontWeight:   '700',
                  cursor:       'pointer',
                  boxShadow:    '0 4px 12px rgba(99,102,241,0.3)',
                }}
              >
                ✓ Import {preview.length} Stocks
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding:      '12px 20px',
                  borderRadius: '12px',
                  border:       '1.5px solid #E2E8F0',
                  background:   'white',
                  color:        '#64748B',
                  fontSize:     '14px',
                  fontWeight:   '600',
                  cursor:       'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}