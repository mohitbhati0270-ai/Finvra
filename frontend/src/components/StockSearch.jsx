import { useState, useRef, useEffect } from 'react'
import { searchStocks } from '../api/portfolioApi'

export default function StockSearch({ value, onChange, placeholder }) {
  const [query, setQuery]               = useState(value || '')
  const [results, setResults]           = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [dropdownPos, setDropdownPos]   = useState({ top: 0, left: 0, width: 0 })
  const debounceRef = useRef(null)
  const inputRef    = useRef(null)
  const wrapperRef  = useRef(null)

  // Sync query when parent changes value (e.g. Excel import)
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const updatePos = () => {
      if (showDropdown && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect()
        setDropdownPos({
          top:   rect.bottom + 4,
          left:  rect.left,
          width: Math.max(rect.width, 280),
        })
      }
    }
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [showDropdown])

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({
        top:   rect.bottom + 4,
        left:  rect.left,
        width: Math.max(rect.width, 280),
      })
    }
  }

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase()
    setQuery(val)
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (val.length < 1) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchStocks(val)
        setResults(data)
        if (data.length > 0) {
          updateDropdownPosition()
          setShowDropdown(true)
        } else {
          setShowDropdown(false)
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }

  const handleSelect = (stock) => {
    setQuery(stock.ticker)
    onChange(stock.ticker)
    setShowDropdown(false)
    setResults([])
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <input
        ref={inputRef}
        style={{
          border:       '1.5px solid rgba(201,168,76,0.3)',
          borderRadius: '10px',
          padding:      '8px 12px',
          width:        '176px',
          fontSize:     '13px',
          fontWeight:   '500',
          outline:      'none',
          background:   '#0B1120',
          color:        '#FFFFFF',
        }}
        value={query}
        onChange={handleInput}
        onFocus={() => {
          if (query.length > 0 && results.length > 0) {
            updateDropdownPosition()
            setShowDropdown(true)
          }
        }}
        placeholder={placeholder || 'Search stock...'}
        autoComplete="off"
      />

      {loading && (
        <div style={{
          position:  'absolute',
          top:       '50%',
          right:     '10px',
          transform: 'translateY(-50%)',
          fontSize:  '10px',
          color:     'rgba(255,255,255,0.4)',
        }}>
          ...
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div style={{
          position:     'fixed',
          top:          `${dropdownPos.top}px`,
          left:         `${dropdownPos.left}px`,
          width:        `${dropdownPos.width}px`,
          zIndex:       99999,
          background:   '#0F172A',
          border:       '1px solid rgba(201,168,76,0.2)',
          borderRadius: '10px',
          boxShadow:    '0 8px 24px rgba(0,0,0,0.4)',
          overflow:     'hidden',
          maxHeight:    '320px',
          overflowY:    'auto',
        }}>
          {results.map((stock, i) => (
            <div
              key={i}
              onClick={() => handleSelect(stock)}
              style={{
                padding:        '10px 14px',
                cursor:         'pointer',
                borderBottom:   i < results.length - 1 ? '1px solid rgba(201,168,76,0.08)' : 'none',
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                background:     'transparent',
                transition:     'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                  {stock.ticker}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {stock.name}
                </span>
              </div>
              <span style={{
                fontSize:     '10px',
                color:        '#C9A84C',
                background:   'rgba(201,168,76,0.1)',
                padding:      '2px 7px',
                borderRadius: '4px',
                fontWeight:   '500',
                flexShrink:   0,
                marginLeft:   '8px',
              }}>
                NSE
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}