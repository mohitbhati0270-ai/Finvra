import { useState, useRef, useEffect } from 'react'
import { searchStocks } from '../api/portfolioApi'

export default function StockSearch({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recalculate position on scroll or resize
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
        className="border border-gray-200 rounded-lg px-3 py-2 w-44 text-sm font-medium focus:outline-none focus:border-blue-400"
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
          position: 'absolute',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          fontSize: '10px',
          color: 'var(--color-text-tertiary)',
        }}>
          ...
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div
          style={{
            position:     'fixed',
            top:          `${dropdownPos.top}px`,
            left:         `${dropdownPos.left}px`,
            width:        `${dropdownPos.width}px`,
            zIndex:       99999,
            background:   'white',
            border:       '1px solid #E2E8F0',
            borderRadius: '10px',
            boxShadow:    '0 8px 24px rgba(0,0,0,0.15)',
            overflow:     'hidden',
            maxHeight:    '320px',
            overflowY:    'auto',
          }}
        >
          {results.map((stock, i) => (
            <div
              key={i}
              onClick={() => handleSelect(stock)}
              style={{
                padding:        '10px 14px',
                cursor:         'pointer',
                borderBottom:   i < results.length - 1 ? '1px solid #F1F5F9' : 'none',
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                background:     'white',
                transition:     'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                  fontSize:   '13px',
                  fontWeight: '600',
                  color:      '#1E293B',
                }}>
                  {stock.ticker}
                </span>
                <span style={{
                  fontSize: '11px',
                  color:    '#64748B',
                }}>
                  {stock.name}
                </span>
              </div>
              <span style={{
                fontSize:     '10px',
                color:        '#3B82F6',
                background:   '#EFF6FF',
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