import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { theme } from '../theme'

export default function Navbar() {
  const location = useLocation()
  const [servicesOpen, setServicesOpen] = useState(false)

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

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {/* Home */}
        <Link to="/" style={{
          padding:        '8px 16px',
          borderRadius:   '8px',
          textDecoration: 'none',
          fontSize:       '13px',
          fontWeight:     '600',
          letterSpacing:  '0.3px',
          transition:     'all 0.2s',
          color:          location.pathname === '/' ? theme.gold : theme.grayLight,
          background:     location.pathname === '/' ? 'rgba(201,168,76,0.1)' : 'transparent',
          border:         location.pathname === '/' ? `1px solid ${theme.border}` : '1px solid transparent',
        }}>
          Home
        </Link>

        {/* Services with Dropdown */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setServicesOpen(true)}
          onMouseLeave={() => setServicesOpen(false)}
        >
          <div style={{
            padding:        '8px 16px',
            borderRadius:   '8px',
            fontSize:       '13px',
            fontWeight:     '600',
            letterSpacing:  '0.3px',
            cursor:         'pointer',
            transition:     'all 0.2s',
            display:        'flex',
            alignItems:     'center',
            gap:            '6px',
            color:          ['/analyse', '/sip-calculator'].includes(location.pathname) ? theme.gold : theme.grayLight,
            background:     ['/analyse', '/sip-calculator'].includes(location.pathname) ? 'rgba(201,168,76,0.1)' : 'transparent',
            border:         ['/analyse', '/sip-calculator'].includes(location.pathname) ? `1px solid ${theme.border}` : '1px solid transparent',
          }}>
            Services
            <span style={{
              fontSize:   '10px',
              transition: 'transform 0.2s',
              transform:  servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              display:    'inline-block',
            }}>▼</span>
          </div>

          {/* Dropdown Menu */}
          {servicesOpen && (
            <div style={{
              position:     'absolute',
              top:          '100%',
              left:         '0',
              background:   theme.navyCard,
              border:       `1px solid ${theme.border}`,
              borderRadius: '12px',
              padding:      '8px',
              minWidth:     '220px',
              boxShadow:    '0 16px 40px rgba(0,0,0,0.4)',
              zIndex:       9999,
              marginTop:    '4px',
            }}>
              <Link
                to="/analyse"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '12px',
                  padding:        '12px 14px',
                  borderRadius:   '8px',
                  textDecoration: 'none',
                  transition:     'all 0.2s',
                  background:     location.pathname === '/analyse' ? 'rgba(201,168,76,0.1)' : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = location.pathname === '/analyse' ? 'rgba(201,168,76,0.1)' : 'transparent'}
              >
                <span style={{ fontSize: '20px' }}>📊</span>
                <div>
                  <div style={{ color: theme.white, fontSize: '13px', fontWeight: '600' }}>
                    Analyse Portfolio
                  </div>
                  <div style={{ color: theme.gray, fontSize: '11px', marginTop: '2px' }}>
                    Full portfolio analytics
                  </div>
                </div>
              </Link>

              <div style={{ height: '1px', background: theme.border, margin: '4px 0' }} />

              <Link
                to="/sip-calculator"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '12px',
                  padding:        '12px 14px',
                  borderRadius:   '8px',
                  textDecoration: 'none',
                  transition:     'all 0.2s',
                  background:     location.pathname === '/sip-calculator' ? 'rgba(201,168,76,0.1)' : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = location.pathname === '/sip-calculator' ? 'rgba(201,168,76,0.1)' : 'transparent'}
              >
                <span style={{ fontSize: '20px' }}>📅</span>
                <div>
                  <div style={{ color: theme.white, fontSize: '13px', fontWeight: '600' }}>
                    SIP Calculator
                  </div>
                  <div style={{ color: theme.gray, fontSize: '11px', marginTop: '2px' }}>
                    Plan your wealth creation
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Blog & News */}
        <Link to="/blog" style={{
          padding:        '8px 16px',
          borderRadius:   '8px',
          textDecoration: 'none',
          fontSize:       '13px',
          fontWeight:     '600',
          letterSpacing:  '0.3px',
          transition:     'all 0.2s',
          color:          location.pathname === '/blog' ? theme.gold : theme.grayLight,
          background:     location.pathname === '/blog' ? 'rgba(201,168,76,0.1)' : 'transparent',
          border:         location.pathname === '/blog' ? `1px solid ${theme.border}` : '1px solid transparent',
        }}>
          Blog & News
        </Link>

        {/* Contact Us */}
        <Link to="/contact" style={{
          padding:        '8px 16px',
          borderRadius:   '8px',
          textDecoration: 'none',
          fontSize:       '13px',
          fontWeight:     '600',
          letterSpacing:  '0.3px',
          transition:     'all 0.2s',
          color:          location.pathname === '/contact' ? theme.gold : theme.grayLight,
          background:     location.pathname === '/contact' ? 'rgba(201,168,76,0.1)' : 'transparent',
          border:         location.pathname === '/contact' ? `1px solid ${theme.border}` : '1px solid transparent',
        }}>
          Contact Us
        </Link>

      </div>
    </nav>
  )
}