import { useState } from 'react'
import { theme } from '../theme'

export default function InsightsPanel({ insights }) {
  const [isOpen, setIsOpen] = useState(true)

  if (!insights || insights.length === 0) return null

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position:        'fixed',
          right:           isOpen ? '320px' : '0px',
          top:             '50%',
          transform:       'translateY(-50%)',
          zIndex:          1000,
          transition:      'right 0.3s ease',
          background:      `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
          color:           theme.navyDark,
          border:          'none',
          borderRadius:    '8px 0 0 8px',
          padding:         '12px 8px',
          cursor:          'pointer',
          fontSize:        '11px',
          fontWeight:      '700',
          writingMode:     'vertical-rl',
          textOrientation: 'mixed',
          letterSpacing:   '1px',
          boxShadow:       '-4px 0 12px rgba(201,168,76,0.2)',
        }}
      >
        {isOpen ? 'Hide ▶' : '◀ Insights'}
      </button>

      {/* Floating panel */}
      <div style={{
        position:   'fixed',
        right:      isOpen ? '0px' : '-320px',
        top:        '0',
        width:      '300px',
        height:     '100vh',
        background: theme.navyCard,
        borderLeft: `1px solid ${theme.border}`,
        zIndex:     999,
        transition: 'right 0.3s ease',
        overflowY:  'auto',
        padding:    '24px 16px',
        boxSizing:  'border-box',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              width:      '8px',
              height:     '8px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
            }} />
            <h2 style={{
              fontSize:   '15px',
              fontWeight: '700',
              color:      theme.white,
              margin:     0,
            }}>
              Finvra Insights
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: theme.gray, margin: 0 }}>
            Key findings from your portfolio analysis
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height:        '1px',
          background:    theme.border,
          marginBottom:  '20px',
        }} />

        {/* Insights list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {insights.map((insight, i) => (
            <div key={i} style={{
              display:      'flex',
              gap:          '10px',
              alignItems:   'flex-start',
              background:   'rgba(201,168,76,0.05)',
              border:       `1px solid rgba(201,168,76,0.1)`,
              borderRadius: '10px',
              padding:      '12px',
            }}>
              {/* Number badge */}
              <div style={{
                minWidth:       '22px',
                height:         '22px',
                borderRadius:   '50%',
                background:     `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '10px',
                fontWeight:     '700',
                color:          theme.navyDark,
                marginTop:      '1px',
                flexShrink:     0,
              }}>
                {i + 1}
              </div>
              <p style={{
                fontSize:   '12px',
                color:      theme.white,
                margin:     0,
                lineHeight: '1.7',
              }}>
                {insight}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop:    '24px',
          padding:      '12px',
          background:   'rgba(255,255,255,0.03)',
          border:       `1px solid ${theme.border}`,
          borderRadius: '10px',
          fontSize:     '11px',
          color:        theme.gray,
          lineHeight:   '1.6',
        }}>
          💡 These insights are generated automatically based on your portfolio data. Not financial advice.
        </div>
      </div>
    </>
  )
}