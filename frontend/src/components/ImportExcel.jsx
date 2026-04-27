import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { theme } from '../theme'

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
  const [error, setError]         = useState(null)
  const [preview, setPreview]     = useState(null)
  const [parsed, setParsed]       = useState(null)
  const [showGuide, setShowGuide] = useState(false)

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
          setError('Could not find Stock/Symbol column. Expected: Symbol, Stock, Scrip, Ticker.')
          return
        }
        if (qtyIdx === -1) {
          setError('Could not find Quantity column. Expected: Qty, Quantity, Units, Shares.')
          return
        }
        if (priceIdx === -1) {
          setError('Could not find Average Price column. Expected: Avg Price, Average Price, Buy Price, Cost Price.')
          return
        }

        const holdings = []
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row    = rows[i]
          const ticker = row[tickerIdx]?.toString().trim().toUpperCase()
          const qty    = parseFloat(row[qtyIdx])
          const price  = parseFloat(row[priceIdx])

          if (!ticker || isNaN(qty) || isNaN(price)) continue
          if (qty <= 0 || price <= 0) continue

          const cleanTicker = ticker.replace(/\.(NS|BO|BSE|NSE)$/i, '')
          holdings.push({
            ticker:   cleanTicker,
            qty:      qty,
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

  // Sample rows for the format guide
  const sampleRows = [
    { ticker: 'RELIANCE', qty: 10, price: '2500.00' },
    { ticker: 'TCS',      qty: 5,  price: '4000.00' },
    { ticker: 'INFY',     qty: 15, price: '1800.00' },
  ]

  return (
    <div>
      {/* Import Button */}
      <button
        onClick={() => setShowGuide(true)}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          padding:      '8px 16px',
          borderRadius: '10px',
          border:       '1.5px solid rgba(99,102,241,0.4)',
          background:   'rgba(99,102,241,0.05)',
          color:        '#818CF8',
          fontSize:     '13px',
          fontWeight:   '600',
          cursor:       'pointer',
          transition:   'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
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
          background:   'rgba(239,68,68,0.1)',
          border:       '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          color:        '#EF4444',
          fontSize:     '13px',
        }}>
          ⚠️ {error}
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
            💡 Column A: Stock Name &nbsp;|&nbsp; Column B: Qty &nbsp;|&nbsp; Column C: Avg Buy Price
          </div>
        </div>
      )}

      {/* ── FORMAT GUIDE MODAL ─────────────────────────────── */}
      {showGuide && (
        <div style={{
          position:       'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background:     'rgba(0,0,0,0.6)',
          zIndex:         9999,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '20px',
        }}>
          <div style={{
            background:   theme.navyCard,
            border:       `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding:      '32px',
            maxWidth:     '560px',
            width:        '100%',
            boxShadow:    '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: theme.white }}>
                  📊 Excel Format Guide
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: theme.gray }}>
                  Your Excel file must follow this column structure
                </p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '22px', cursor: 'pointer', color: theme.gray,
                  lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* Column Guide Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                {
                  col    : 'Column A',
                  header : 'Stock Name',
                  desc   : 'NSE ticker symbol of the stock',
                  example: 'RELIANCE',
                  color  : '#6366F1',
                  bg     : 'rgba(99,102,241,0.1)',
                  border : 'rgba(99,102,241,0.3)',
                },
                {
                  col    : 'Column B',
                  header : 'Qty',
                  desc   : 'Number of shares you own',
                  example: '10',
                  color  : '#22C55E',
                  bg     : 'rgba(34,197,94,0.1)',
                  border : 'rgba(34,197,94,0.3)',
                },
                {
                  col    : 'Column C',
                  header : 'Avg Buy Price',
                  desc   : 'Average price you paid per share',
                  example: '2500.00',
                  color  : '#F59E0B',
                  bg     : 'rgba(245,158,11,0.1)',
                  border : 'rgba(245,158,11,0.3)',
                },
              ].map((item, i) => (
                <div key={i} style={{
                  background:   item.bg,
                  border:       `1px solid ${item.border}`,
                  borderRadius: '12px',
                  padding:      '14px',
                  textAlign:    'center',
                }}>
                  <div style={{
                    fontSize:     '10px',
                    fontWeight:   '700',
                    color:        item.color,
                    letterSpacing:'1px',
                    marginBottom: '6px',
                  }}>
                    {item.col}
                  </div>
                  <div style={{
                    fontSize:     '14px',
                    fontWeight:   '800',
                    color:        theme.white,
                    marginBottom: '4px',
                  }}>
                    {item.header}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color:    theme.gray,
                    marginBottom: '10px',
                    lineHeight: 1.4,
                  }}>
                    {item.desc}
                  </div>
                  <div style={{
                    background:   'rgba(255,255,255,0.05)',
                    border:       `1px solid ${item.border}`,
                    borderRadius: '6px',
                    padding:      '4px 8px',
                    fontSize:     '12px',
                    fontWeight:   '700',
                    color:        item.color,
                    fontFamily:   'monospace',
                  }}>
                    {item.example}
                  </div>
                </div>
              ))}
            </div>

            {/* Sample Table Preview */}
            <div style={{
              background:   'rgba(255,255,255,0.03)',
              border:       `1px solid ${theme.border}`,
              borderRadius: '12px',
              overflow:     'hidden',
              marginBottom: '24px',
            }}>
              <div style={{
                padding:    '10px 16px',
                borderBottom: `1px solid ${theme.border}`,
                fontSize:   '11px',
                fontWeight: '700',
                color:      theme.gray,
                letterSpacing: '1px',
              }}>
                EXAMPLE EXCEL FILE
              </div>

              {/* Column headers row */}
              <div style={{
                display:  'grid',
                gridTemplateColumns: '32px 1fr 1fr 1fr',
                background: 'rgba(99,102,241,0.15)',
                borderBottom: `1px solid ${theme.border}`,
              }}>
                <div style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: '#818CF8' }}></div>
                {['A', 'B', 'C'].map(col => (
                  <div key={col} style={{
                    padding:    '8px 10px',
                    fontSize:   '11px',
                    fontWeight: '700',
                    color:      '#818CF8',
                    textAlign:  'center',
                    borderLeft: `1px solid ${theme.border}`,
                  }}>
                    {col}
                  </div>
                ))}
              </div>

              {/* Row 1 — Headers */}
              <div style={{
                display:  'grid',
                gridTemplateColumns: '32px 1fr 1fr 1fr',
                background: 'rgba(201,168,76,0.08)',
                borderBottom: `1px solid ${theme.border}`,
              }}>
                <div style={{ padding: '8px 10px', fontSize: '11px', color: theme.gray, textAlign: 'center' }}>1</div>
                {['Stock Name', 'Qty', 'Avg Buy Price'].map((h, i) => (
                  <div key={i} style={{
                    padding:    '8px 10px',
                    fontSize:   '12px',
                    fontWeight: '700',
                    color:      theme.gold,
                    borderLeft: `1px solid ${theme.border}`,
                  }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {sampleRows.map((row, i) => (
                <div key={i} style={{
                  display:    'grid',
                  gridTemplateColumns: '32px 1fr 1fr 1fr',
                  borderBottom: i < sampleRows.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ padding: '8px 10px', fontSize: '11px', color: theme.gray, textAlign: 'center' }}>{i + 2}</div>
                  <div style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '700', color: theme.white, borderLeft: `1px solid ${theme.border}` }}>
                    {row.ticker}
                  </div>
                  <div style={{ padding: '8px 10px', fontSize: '12px', color: '#22C55E', borderLeft: `1px solid ${theme.border}` }}>
                    {row.qty}
                  </div>
                  <div style={{ padding: '8px 10px', fontSize: '12px', color: '#F59E0B', borderLeft: `1px solid ${theme.border}` }}>
                    {row.price}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{
              background:   'rgba(99,102,241,0.08)',
              border:       '1px solid rgba(99,102,241,0.2)',
              borderRadius: '10px',
              padding:      '12px 16px',
              marginBottom: '24px',
              fontSize:     '12px',
              color:        theme.gray,
              lineHeight:   1.7,
            }}>
              <div style={{ fontWeight: '700', color: '#818CF8', marginBottom: '4px' }}>📌 Important Notes</div>
              <div>• Row 1 must be the header row with column names</div>
              <div>• Stock names should be NSE ticker symbols (e.g. RELIANCE, TCS, INFY)</div>
              <div>• Do <strong style={{ color: theme.white }}>not</strong> include .NS or .BO suffix — we add it automatically</div>
              <div>• Quantity must be a positive number</div>
              <div>• Avg Buy Price must be in ₹ (INR), no currency symbol needed</div>
              <div>• Supported formats: .xlsx, .xls, .csv</div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowGuide(false)
                  setTimeout(() => fileRef.current.click(), 100)
                }}
                style={{
                  flex:         1,
                  padding:      '13px',
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
                ✓ Got it — Upload my File
              </button>
              <button
                onClick={() => setShowGuide(false)}
                style={{
                  padding:      '13px 20px',
                  borderRadius: '12px',
                  border:       `1.5px solid ${theme.border}`,
                  background:   'transparent',
                  color:        theme.gray,
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

      {/* ── PREVIEW MODAL ──────────────────────────────────── */}
      {preview && (
        <div style={{
          position:       'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background:     'rgba(0,0,0,0.6)',
          zIndex:         9999,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '20px',
        }}>
          <div style={{
            background:   theme.navyCard,
            border:       `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding:      '28px',
            maxWidth:     '560px',
            width:        '100%',
            maxHeight:    '80vh',
            overflowY:    'auto',
            boxShadow:    '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.white }}>
                  ✅ {preview.length} Stocks Found
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: theme.gray }}>
                  Please confirm these holdings look correct
                </p>
              </div>
              <button
                onClick={handleCancel}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.gray }}
              >×</button>
            </div>

            {/* Preview Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Stock', 'Qty', 'Avg Buy Price (₹)'].map(h => (
                    <th key={h} style={{
                      padding:       '10px 12px',
                      textAlign:     'left',
                      fontSize:      '11px',
                      fontWeight:    '600',
                      color:         theme.gray,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom:  `1px solid ${theme.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: theme.white }}>{h.ticker}</td>
                    <td style={{ padding: '10px 12px', color: theme.gray }}>{h.qty}</td>
                    <td style={{ padding: '10px 12px', color: '#F59E0B' }}>₹{h.avgPrice}</td>
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
                  border:       `1.5px solid ${theme.border}`,
                  background:   'transparent',
                  color:        theme.gray,
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