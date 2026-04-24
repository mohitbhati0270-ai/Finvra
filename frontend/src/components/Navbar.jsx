import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { theme } from '../theme'

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
  { path: '/',               label: 'Home' },
  { path: '/services',       label: 'Services' },
  { path: '/analyse',        label: 'Analyse Portfolio' },
  { path: '/sip-calculator', label: 'SIP Calculator' },
  { path: '/blog',           label: 'Blog & News' },
  { path: '/contact',        label: 'Contact Us' },
]

  return (
    <nav style={{
      background:     theme.navyDark,
      borderBottom:   `1px solid ${theme.border}`,
      padding:        '0 40px',
      height:         '72px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      position:       'sticky',
      top:            0,
      zIndex:         1000,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width:          '42px',
          height:         '42px',
          background:     `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
          borderRadius:   '12px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      `0 4px 12px rgba(201,168,76,0.3)`,
        }}>
          <span style={{ color: theme.navyDark, fontWeight: '900', fontSize: '20px' }}>F</span>
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: theme.gold, letterSpacing: '1px' }}>
            FINVRA
          </div>
          <div style={{ fontSize: '9px', color: theme.gray, letterSpacing: '2px', marginTop: '-2px' }}>
            PORTFOLIO ANALYTICS
          </div>
        </div>
      </Link>

      {/* Desktop Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              padding:        '8px 16px',
              borderRadius:   '8px',
              textDecoration: 'none',
              fontSize:       '13px',
              fontWeight:     '600',
              letterSpacing:  '0.3px',
              transition:     'all 0.2s',
              color:          location.pathname === link.path ? theme.gold : theme.grayLight,
              background:     location.pathname === link.path ? 'rgba(201,168,76,0.1)' : 'transparent',
              border:         location.pathname === link.path ? `1px solid ${theme.border}` : '1px solid transparent',
            }}
          >
            {link.label}
          </Link>
        ))}

        <Link
          to="/analyse"
          style={{
            marginLeft:     '12px',
            padding:        '10px 20px',
            borderRadius:   '10px',
            textDecoration: 'none',
            fontSize:       '13px',
            fontWeight:     '700',
            color:          theme.navyDark,
            background:     `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
            boxShadow:      '0 4px 12px rgba(201,168,76,0.3)',
            transition:     'all 0.2s',
          }}
        >
          Start Analysis →
        </Link>
      </div>
    </nav>
  )
}