import { Link } from 'react-router-dom'
import { theme } from '../theme'

export default function Footer() {
  return (
    <footer style={{
      background:   theme.navy,
      borderTop:    `1px solid ${theme.border}`,
      padding:      '48px 40px 24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width:          '36px', height: '36px',
                background:     `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
                borderRadius:   '10px',
                display:        'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: theme.navyDark, fontWeight: '900', fontSize: '16px' }}>F</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '900', color: theme.gold, letterSpacing: '1px' }}>FINVRA</span>
            </div>
            <p style={{ color: theme.gray, fontSize: '13px', lineHeight: 1.7, maxWidth: '260px' }}>
              India's premier portfolio analytics platform. Institutional grade tools for every Indian investor — free forever.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: theme.white, fontSize: '13px', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>
              PLATFORM
            </h4>
            {[
              { to: '/analyse', label: 'Analyse Portfolio' },
              { to: '/services', label: 'Services' },
              { to: '/blog', label: 'Blog & News' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display:        'block',
                color:          theme.gray,
                textDecoration: 'none',
                fontSize:       '13px',
                marginBottom:   '10px',
                transition:     'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = theme.gold}
                onMouseLeave={e => e.target.style.color = theme.gray}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <h4 style={{ color: theme.white, fontSize: '13px', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>
              ANALYTICS
            </h4>
            {['Sharpe Ratio', 'Efficient Frontier', 'Value at Risk', 'Monte Carlo', 'Correlation Matrix'].map(l => (
              <div key={l} style={{ color: theme.gray, fontSize: '13px', marginBottom: '10px' }}>{l}</div>
            ))}
          </div>

          <div>
            <h4 style={{ color: theme.white, fontSize: '13px', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>
              COMPANY
            </h4>
            {[
              { to: '/', label: 'About Us' },
              { to: '/contact', label: 'Contact Us' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display:        'block',
                color:          theme.gray,
                textDecoration: 'none',
                fontSize:       '13px',
                marginBottom:   '10px',
                transition:     'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = theme.gold}
                onMouseLeave={e => e.target.style.color = theme.gray}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{
          borderTop:  `1px solid ${theme.border}`,
          paddingTop: '24px',
          display:    'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap:   'wrap',
          gap:        '12px',
        }}>
          <span style={{ color: theme.gray, fontSize: '12px' }}>
            © 2026 Finvra. All rights reserved.
          </span>
          <span style={{ color: theme.gray, fontSize: '12px' }}>
            Not financial advice. For informational purposes only. Real NSE data via yfinance.
          </span>
        </div>
      </div>
    </footer>
  )
}