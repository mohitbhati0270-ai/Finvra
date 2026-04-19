import { useState } from 'react'

export default function InsightsPanel({ insights }) {
  const [isOpen, setIsOpen] = useState(true)

  if (!insights || insights.length === 0) return null

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          right: isOpen ? '320px' : '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          transition: 'right 0.3s ease',
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '12px 8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          letterSpacing: '1px',
        }}
      >
        {isOpen ? 'Hide ▶' : '◀ Insights'}
      </button>

      {/* Floating panel */}
      <div
        style={{
          position: 'fixed',
          right: isOpen ? '0px' : '-320px',
          top: '0',
          width: '300px',
          height: '100vh',
          background: 'var(--color-background-primary)',
          borderLeft: '0.5px solid var(--color-border-tertiary)',
          zIndex: 999,
          transition: 'right 0.3s ease',
          overflowY: 'auto',
          padding: '24px 16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#3B82F6',
            }} />
            <h2 style={{
              fontSize: '15px',
              fontWeight: '500',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}>
              Finvra Insights
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>
            Key findings from your portfolio analysis
          </p>
        </div>

        {/* Divider */}
        <div style={{
          height: '0.5px',
          background: 'var(--color-border-tertiary)',
          marginBottom: '20px',
        }} />

        {/* Insights list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {insights.map((insight, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                minWidth: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#EFF6FF',
                border: '0.5px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '500',
                color: '#3B82F6',
                marginTop: '1px',
              }}>
                {i + 1}
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: '1.6',
              }}>
                {insight}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'var(--color-background-secondary)',
          borderRadius: '8px',
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          lineHeight: '1.5',
        }}>
          These insights are generated automatically based on your portfolio data. Not financial advice.
        </div>
      </div>
    </>
  )
}