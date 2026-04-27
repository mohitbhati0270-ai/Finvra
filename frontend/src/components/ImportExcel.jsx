import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { theme } from '../theme'

const TICKER_COLS = ['symbol', 'ticker', 'stock', 'scrip', 'tradingsymbol', 'name', 'stock name', 'scrip name', 'instrument']
const QTY_COLS    = ['qty', 'quantity', 'units', 'shares', 'net qty', 'net quantity', 'holdings qty', 'balance qty']
const PRICE_COLS  = ['avg price', 'average price', 'avg buy price', 'average buy price', 'buy price', 'cost price', 'avg cost', 'ltp', 'price']

// ── Full company name → NSE ticker mapping ──────────────────
const NAME_TO_TICKER = {
  // A
  'adani enterprises': 'ADANIENT', 'adani enterprises ltd': 'ADANIENT',
  'adani ports': 'ADANIPORTS', 'adani ports and special economic zone': 'ADANIPORTS',
  'apollo hospitals': 'APOLLOHOSP', 'apollo hospitals enterprise': 'APOLLOHOSP',
  'asian paints': 'ASIANPAINT', 'asian paints ltd': 'ASIANPAINT',
  'axis bank': 'AXISBANK', 'axis bank ltd': 'AXISBANK',
  'auropharma': 'AUROPHARMA', 'aurobindo pharma': 'AUROPHARMA', 'aurobindo pharma ltd': 'AUROPHARMA',
  // B
  'bajaj auto': 'BAJAJ-AUTO', 'bajaj auto ltd': 'BAJAJ-AUTO',
  'bajaj finance': 'BAJFINANCE', 'bajaj finance ltd': 'BAJFINANCE',
  'bajaj finserv': 'BAJAJFINSV', 'bajaj finserv ltd': 'BAJAJFINSV',
  'bandhan bank': 'BANDHANBNK', 'bandhan bank ltd': 'BANDHANBNK',
  'bharat coaking coal': 'BCCL', 'bharat coaking coal ltd': 'BCCL',
  'bharat coking coal': 'BCCL', 'bharat coking coal ltd': 'BCCL',
  'bharat electronics': 'BEL', 'bharat electronics ltd': 'BEL',
  'bharat petroleum': 'BPCL', 'bharat petroleum corporation': 'BPCL', 'bharat petroleum corporation ltd': 'BPCL',
  'bharti airtel': 'BHARTIARTL', 'bharti airtel ltd': 'BHARTIARTL',
  'britannia': 'BRITANNIA', 'britannia industries': 'BRITANNIA', 'britannia industries ltd': 'BRITANNIA',
  // C
  'cesc': 'CESC', 'cesc ltd': 'CESC',
  'cipla': 'CIPLA', 'cipla ltd': 'CIPLA',
  'coal india': 'COALINDIA', 'coal india ltd': 'COALINDIA',
  'colgate': 'COLPAL', 'colgate palmolive': 'COLPAL', 'colgate palmolive india': 'COLPAL',
  // D
  'dabur': 'DABUR', 'dabur india': 'DABUR', 'dabur india ltd': 'DABUR',
  'divis laboratories': 'DIVISLAB', 'divis labs': 'DIVISLAB', 'divis laboratories ltd': 'DIVISLAB',
  'dr reddy': 'DRREDDY', "dr reddy's": 'DRREDDY', "dr reddy's laboratories": 'DRREDDY',
  // E
  'eih': 'EIHOTEL', 'eih ltd': 'EIHOTEL', 'eih limited': 'EIHOTEL',
  'eternal': 'ETERNAL', 'eternal ltd': 'ETERNAL',
  'eicher motors': 'EICHERMOT', 'eicher motors ltd': 'EICHERMOT',
  // F
  'federal bank': 'FEDERALBNK', 'federal bank ltd': 'FEDERALBNK',
  // G
  'grasim': 'GRASIM', 'grasim industries': 'GRASIM', 'grasim industries ltd': 'GRASIM',
  'gail': 'GAIL', 'gail india': 'GAIL', 'gail india ltd': 'GAIL',
  // H
  'hcl technologies': 'HCLTECH', 'hcl tech': 'HCLTECH', 'hcl technologies ltd': 'HCLTECH',
  'hdfc bank': 'HDFCBANK', 'hdfc bank ltd': 'HDFCBANK',
  'hdfc life': 'HDFCLIFE', 'hdfc life insurance': 'HDFCLIFE',
  'hero motocorp': 'HEROMOTOCO', 'hero motocorp ltd': 'HEROMOTOCO', 'hero honda': 'HEROMOTOCO',
  'hindalco': 'HINDALCO', 'hindalco industries': 'HINDALCO', 'hindalco industries ltd': 'HINDALCO',
  'hindustan unilever': 'HINDUNILVR', 'hindustan unilever ltd': 'HINDUNILVR', 'hul': 'HINDUNILVR',
  'hindustan zinc': 'HINDZINC', 'hindustan zinc ltd': 'HINDZINC',
  // I
  'icici bank': 'ICICIBANK', 'icici bank ltd': 'ICICIBANK',
  'icici lombard': 'ICICIGI', 'icici lombard general insurance': 'ICICIGI',
  'icici prudential': 'ICICIPRULI', 'icici prudential life insurance': 'ICICIPRULI',
  'indusind bank': 'INDUSINDBK', 'indusind bank ltd': 'INDUSINDBK',
  'infosys': 'INFY', 'infosys ltd': 'INFY', 'infosys limited': 'INFY',
  'indian oil': 'IOC', 'indian oil corporation': 'IOC', 'indian oil corporation ltd': 'IOC',
  'indian overseas bank': 'IOB', 'indian overseas bank ltd': 'IOB',
  'itc': 'ITC', 'itc ltd': 'ITC', 'itc limited': 'ITC',
  // J
  'jio financial': 'JIOFIN', 'jio financial services': 'JIOFIN', 'jio financial services ltd': 'JIOFIN',
  'jsw steel': 'JSWSTEEL', 'jsw steel ltd': 'JSWSTEEL',
  // K
  'kotak mahindra bank': 'KOTAKBANK', 'kotak bank': 'KOTAKBANK', 'kotak mahindra bank ltd': 'KOTAKBANK',
  // L
  'l&t': 'LT', 'larsen & toubro': 'LT', 'larsen and toubro': 'LT', 'larsen & toubro ltd': 'LT',
  'life insurance corporation': 'LICI', 'lic': 'LICI', 'life insurance company': 'LICI',
  'life insurance corporation of india': 'LICI',
  // M
  'mahindra & mahindra': 'M&M', 'mahindra and mahindra': 'M&M', 'mahindra & mahindra ltd': 'M&M',
  'maruti': 'MARUTI', 'maruti suzuki': 'MARUTI', 'maruti suzuki india': 'MARUTI', 'maruti suzuki india ltd': 'MARUTI',
  // N
  'nmdc': 'NMDC', 'nmdc ltd': 'NMDC', 'nmdc limited': 'NMDC',
  'ntpc': 'NTPC', 'ntpc ltd': 'NTPC', 'ntpc limited': 'NTPC',
  'nestle': 'NESTLEIND', 'nestle india': 'NESTLEIND', 'nestle india ltd': 'NESTLEIND',
  // O
  'ongc': 'ONGC', 'oil & natural gas': 'ONGC', 'oil and natural gas': 'ONGC',
  'oil & natural gas corporation': 'ONGC', 'oil & natural gas corporation ltd': 'ONGC',
  'oil natural gas corporation': 'ONGC',
  // P
  'power grid': 'POWERGRID', 'power grid corporation': 'POWERGRID',
  'power grid corporation of india': 'POWERGRID', 'power grid corporation of india ltd': 'POWERGRID',
  // R
  'reliance': 'RELIANCE', 'reliance industries': 'RELIANCE', 'reliance industries ltd': 'RELIANCE',
  'reliance industries limited': 'RELIANCE',
  // S
  'sbi': 'SBIN', 'state bank of india': 'SBIN', 'state bank of india ltd': 'SBIN',
  'sbi life': 'SBILIFE', 'sbi life insurance': 'SBILIFE',
  'shriram finance': 'SHRIRAMFIN', 'shriram finance ltd': 'SHRIRAMFIN',
  'steel authority of india': 'SAIL', 'steel authority of india ltd': 'SAIL', 'sail': 'SAIL',
  'sun pharma': 'SUNPHARMA', 'sun pharmaceutical': 'SUNPHARMA', 'sun pharmaceutical industries': 'SUNPHARMA',
  // T
  'tata consultancy': 'TCS', 'tata consultancy services': 'TCS', 'tcs': 'TCS',
  'tata consumer': 'TATACONSUM', 'tata consumer products': 'TATACONSUM',
  'tata motors': 'TATAMOTORS', 'tata motors ltd': 'TATAMOTORS',
  'tata steel': 'TATASTEEL', 'tata steel ltd': 'TATASTEEL',
  'tech mahindra': 'TECHM', 'tech mahindra ltd': 'TECHM',
  'titan': 'TITAN', 'titan company': 'TITAN', 'titan company ltd': 'TITAN',
  'tsf investments': 'TSFINV', 'tsf investments ltd': 'TSFINV',
  // U
  'ultratech cement': 'ULTRACEMCO', 'ultratech cement ltd': 'ULTRACEMCO',
  // W
  'wipro': 'WIPRO', 'wipro ltd': 'WIPRO', 'wipro limited': 'WIPRO',
  // Y
  'yes bank': 'YESBANK', 'yes bank ltd': 'YESBANK',
  // Z
  'zomato': 'ZOMATO', 'zomato ltd': 'ZOMATO',
  'zydus lifesciences': 'ZYDUSLIFE', 'zydus lifesciences ltd': 'ZYDUSLIFE',
}

function resolveTickerName(raw) {
  if (!raw) return null
  const cleaned = raw.toString().trim()
  const lower   = cleaned.toLowerCase()

  // 1. If it already looks like a ticker (short, uppercase, no spaces) — use as-is
  if (/^[A-Z0-9&\-\.]{2,20}$/.test(cleaned) && !cleaned.includes(' ')) {
    return cleaned.replace(/\.(NS|BO|BSE|NSE)$/i, '')
  }

  // 2. Try direct map lookup
  if (NAME_TO_TICKER[lower]) return NAME_TO_TICKER[lower]

  // 3. Try partial match — if the name contains a known key
  for (const [key, ticker] of Object.entries(NAME_TO_TICKER)) {
    if (lower.includes(key) || key.includes(lower)) return ticker
  }

  // 4. Fallback — uppercase the name, remove common suffixes, use as ticker
  return cleaned
    .toUpperCase()
    .replace(/\s*(LTD|LIMITED|CORPORATION|CORP|INDUSTRIES|IND|ENTERPRISE|ENTERPRISES|SERVICES|BANK|PHARMA|PHARMACEUTICAL|CHEMICALS|FINANCE|FINANCIAL|INVESTMENTS|INVESTMENT|COMPANY|CO\.?)\.?\s*$/gi, '')
    .replace(/\s+/g, '')
    .trim()
}

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
          setError('File appears to be empty.')
          return
        }

        let headerRowIdx = 0
        let headers = []
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const tickerIdx = findColumn(rows[i].map(c => c?.toString()), TICKER_COLS)
          if (tickerIdx !== -1) {
            headerRowIdx = i
            headers = rows[i].map(c => c?.toString())
            break
          }
        }

        if (headers.length === 0) {
          setError('Could not find stock/symbol column. Make sure Row 1 has headers: Stock Name, Qty, Avg Buy Price')
          return
        }

        const tickerIdx = findColumn(headers, TICKER_COLS)
        const qtyIdx    = findColumn(headers, QTY_COLS)
        const priceIdx  = findColumn(headers, PRICE_COLS)

        if (tickerIdx === -1) { setError('Could not find Stock/Symbol column.'); return }
        if (qtyIdx    === -1) { setError('Could not find Quantity column.'); return }
        if (priceIdx  === -1) { setError('Could not find Average Price column.'); return }

        const holdings = []
        const unresolved = []

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row   = rows[i]
          const raw   = row[tickerIdx]?.toString().trim()
          const qty   = parseFloat(row[qtyIdx])
          const price = parseFloat(row[priceIdx])

          if (!raw || isNaN(qty) || isNaN(price)) continue
          if (qty <= 0 || price <= 0) continue

          const ticker = resolveTickerName(raw)
          if (!ticker) { unresolved.push(raw); continue }

          holdings.push({
            ticker:   ticker,
            qty:      qty,
            avgPrice: parseFloat(price.toFixed(2)),
            _original: raw,
          })
        }

        if (holdings.length === 0) {
          setError('No valid holdings found.')
          return
        }

        setPreview(holdings)
        setParsed(holdings)

      } catch (err) {
        setError('Could not read file. Please use .xlsx, .xls or .csv format.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const handleConfirm = () => {
    if (parsed) {
      onImport(parsed.map(h => ({ ticker: h.ticker, qty: h.qty, avgPrice: h.avgPrice })))
      setPreview(null)
      setParsed(null)
    }
  }

  const handleCancel = () => {
    setPreview(null)
    setParsed(null)
    setError(null)
  }

  const sampleRows = [
    { ticker: 'RELIANCE', qty: 10,  price: '2500.00' },
    { ticker: 'TCS',      qty: 5,   price: '4000.00' },
    { ticker: 'INFY',     qty: 15,  price: '1800.00' },
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
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#94A3B8' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: theme.white }}>
                  📊 Excel Format Guide
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: theme.gray }}>
                  Your Excel file must follow this column structure
                </p>
              </div>
              <button onClick={() => setShowGuide(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: theme.gray }}>×</button>
            </div>

          

            {/* Sample Table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${theme.border}`, fontSize: '11px', fontWeight: '700', color: theme.gray, letterSpacing: '1px' }}>
                EXAMPLE EXCEL FILE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr', background: 'rgba(99,102,241,0.15)', borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ padding: '8px 10px' }} />
                {['A', 'B', 'C'].map(col => (
                  <div key={col} style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: '#818CF8', textAlign: 'center', borderLeft: `1px solid ${theme.border}` }}>{col}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr', background: 'rgba(201,168,76,0.08)', borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ padding: '8px 10px', fontSize: '11px', color: theme.gray, textAlign: 'center' }}>1</div>
                {['Stock Name', 'Qty', 'Avg Buy Price'].map((h, i) => (
                  <div key={i} style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '700', color: theme.gold, borderLeft: `1px solid ${theme.border}` }}>{h}</div>
                ))}
              </div>
              {sampleRows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr', borderBottom: i < sampleRows.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <div style={{ padding: '8px 10px', fontSize: '11px', color: theme.gray, textAlign: 'center' }}>{i + 2}</div>
                  <div style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '700', color: theme.white, borderLeft: `1px solid ${theme.border}` }}>{row.ticker}</div>
                  <div style={{ padding: '8px 10px', fontSize: '12px', color: '#22C55E', borderLeft: `1px solid ${theme.border}` }}>{row.qty}</div>
                  <div style={{ padding: '8px 10px', fontSize: '12px', color: '#F59E0B', borderLeft: `1px solid ${theme.border}` }}>{row.price}</div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '12px', color: theme.gray, lineHeight: 1.8 }}>
              <div style={{ fontWeight: '700', color: '#818CF8', marginBottom: '4px' }}>📌 Important Notes</div>
              <div>• Row 1 must be the header row with column names</div>
              <div>• Stock name can be NSE ticker (RELIANCE) <strong style={{ color: theme.white }}>or</strong> full company name (Reliance Industries Ltd) — we auto-convert</div>
              <div>• Do <strong style={{ color: theme.white }}>not</strong> include .NS or .BO suffix — added automatically</div>
              <div>• Qty must be a positive number, Price must be in ₹</div>
              <div>• Supported formats: .xlsx, .xls, .csv</div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowGuide(false); setTimeout(() => fileRef.current.click(), 100) }}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
              >
                ✓ Got it — Upload my File
              </button>
              <button
                onClick={() => setShowGuide(false)}
                style={{ padding: '13px 20px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, background: 'transparent', color: theme.gray, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ──────────────────────────────────── */}
      {preview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: theme.navyCard, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.white }}>✅ {preview.length} Stocks Found</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: theme.gray }}>Please confirm the tickers look correct before importing</p>
              </div>
              <button onClick={handleCancel} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.gray }}>×</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr>
                  {['Original Name', 'NSE Ticker', 'Qty', 'Avg Price (₹)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: theme.gray, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td style={{ padding: '10px 12px', color: theme.gray, fontSize: '12px' }}>{h._original}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: theme.gold }}>{h.ticker}</td>
                    <td style={{ padding: '10px 12px', color: theme.gray }}>{h.qty}</td>
                    <td style={{ padding: '10px 12px', color: '#F59E0B' }}>₹{h.avgPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: 'rgba(201,168,76,0.08)', border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: theme.gray }}>
              💡 Check the <strong style={{ color: theme.gold }}>NSE Ticker</strong> column — if any look wrong, cancel and use the ticker symbol directly in your Excel file.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleConfirm} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                ✓ Import {preview.length} Stocks
              </button>
              <button onClick={handleCancel} style={{ padding: '12px 20px', borderRadius: '12px', border: `1.5px solid ${theme.border}`, background: 'transparent', color: theme.gray, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}