import { Link } from 'react-router-dom'
import { theme } from '../theme'

const stat = (value, label) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '36px', fontWeight: '900', color: theme.gold }}>{value}</div>
    <div style={{ fontSize: '13px', color: theme.gray, marginTop: '4px' }}>{label}</div>
  </div>
)

const feature = (icon, title, desc) => (
  <div style={{
    background:   theme.navyCard,
    border:       `1px solid ${theme.border}`,
    borderRadius: '16px',
    padding:      '28px',
    transition:   'all 0.3s',
  }}
    onMouseEnter={e => {
      e.currentTarget.style.border = `1px solid ${theme.borderLight}`
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = `0 12px 32px rgba(201,168,76,0.1)`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.border = `1px solid ${theme.border}`
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
    <h3 style={{ color: theme.white, fontSize: '16px', fontWeight: '700', margin: '0 0 10px' }}>{title}</h3>
    <p style={{ color: theme.gray, fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{desc}</p>
  </div>
)

export default function Home() {
  return (
    <div style={{ background: theme.navyDark, minHeight: '100vh', color: theme.white }}>

      {/* Hero Section */}
      <section style={{
        padding:    '100px 40px 80px',
        textAlign:  'center',
        background: `radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display:      'inline-block',
            background:   'rgba(201,168,76,0.1)',
            border:       `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding:      '6px 18px',
            fontSize:     '12px',
            fontWeight:   '600',
            color:        theme.gold,
            marginBottom: '28px',
            letterSpacing:'1px',
          }}>
            🇮🇳 INDIA'S PREMIER PORTFOLIO ANALYTICS PLATFORM
          </div>

          <h1 style={{
            fontSize:     '62px',
            fontWeight:   '900',
            lineHeight:   1.1,
            marginBottom: '24px',
            color:        theme.white,
          }}>
            Institutional Grade
            <br />
            <span style={{ color: theme.gold }}>Portfolio Analytics</span>
            <br />
            For Every Investor
          </h1>

          <p style={{
            fontSize:     '18px',
            color:        theme.gray,
            lineHeight:   1.7,
            marginBottom: '40px',
            maxWidth:     '580px',
            margin:       '0 auto 40px',
          }}>
            Analyze your NSE portfolio with the same tools used by professional fund managers.
            Sharpe Ratio, Monte Carlo, Efficient Frontier, VaR — all free.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/analyse" style={{
              padding:        '16px 36px',
              borderRadius:   '12px',
              textDecoration: 'none',
              fontSize:       '15px',
              fontWeight:     '700',
              color:          theme.navyDark,
              background:     `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
              boxShadow:      '0 8px 24px rgba(201,168,76,0.4)',
              letterSpacing:  '0.3px',
            }}>
              Analyse My Portfolio →
            </Link>
            <Link to="/services" style={{
              padding:        '16px 36px',
              borderRadius:   '12px',
              textDecoration: 'none',
              fontSize:       '15px',
              fontWeight:     '700',
              color:          theme.gold,
              background:     'transparent',
              border:         `2px solid ${theme.border}`,
              letterSpacing:  '0.3px',
            }}>
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        padding:    '60px 40px',
        background: theme.navy,
        borderTop:  `1px solid ${theme.border}`,
        borderBottom:`1px solid ${theme.border}`,
      }}>
        <div style={{
          maxWidth:       '900px',
          margin:         '0 auto',
          display:        'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap:            '40px',
        }}>
          {stat('2,258+', 'NSE Stocks Covered')}
          {stat('10+', 'Analytics Metrics')}
          {stat('5,000', 'Monte Carlo Simulations')}
          {stat('Free', 'Always & Forever')}
        </div>
      </section>

      {/* About Us */}
      <section style={{ padding: '80px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '16px' }}>
              ABOUT FINVRA
            </div>
            <h2 style={{ fontSize: '40px', fontWeight: '900', color: theme.white, lineHeight: 1.2, marginBottom: '20px' }}>
              Built for the
              <span style={{ color: theme.gold }}> Indian Investor</span>
            </h2>
            <p style={{ color: theme.gray, fontSize: '15px', lineHeight: 1.8, marginBottom: '20px' }}>
              Finvra was built with one mission — to give every Indian retail investor access to the same portfolio analytics tools that institutional fund managers use every day.
            </p>
            <p style={{ color: theme.gray, fontSize: '15px', lineHeight: 1.8, marginBottom: '32px' }}>
              We believe that better analytics leads to better investment decisions. Whether you hold 2 stocks or 50, Finvra gives you a complete picture of your portfolio's risk, return, and optimization potential.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['Real NSE Data', 'Free Forever', 'No Login Required', 'PDF Export'].map((tag, i) => (
                <span key={i} style={{
                  padding:      '6px 14px',
                  borderRadius: '20px',
                  fontSize:     '12px',
                  fontWeight:   '600',
                  color:        theme.gold,
                  background:   'rgba(201,168,76,0.1)',
                  border:       `1px solid ${theme.border}`,
                }}>
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>

          <div style={{
            background:   theme.navyCard,
            border:       `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding:      '36px',
          }}>
            <h3 style={{ color: theme.gold, fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
              What makes Finvra different?
            </h3>
            {[
              { icon: '📊', title: 'Markowitz Optimization', desc: 'Full Mean-Variance optimization with Efficient Frontier' },
              { icon: '🎯', title: 'Monte Carlo Simulation', desc: '5,000 random portfolios to find optimal allocation' },
              { icon: '📉', title: 'Modified VaR', desc: 'Cornish-Fisher expansion for accurate risk measurement' },
              { icon: '🇮🇳', title: 'India Specific', desc: 'NIFTY 50 benchmark, RBI rate, NSE stocks — built for India' },
            ].map((item, i) => (
              <div key={i} style={{
                display:       'flex',
                gap:           '16px',
                marginBottom:  i < 3 ? '20px' : '0',
                paddingBottom: i < 3 ? '20px' : '0',
                borderBottom:  i < 3 ? `1px solid ${theme.border}` : 'none',
              }}>
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <div>
                  <div style={{ color: theme.white, fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ color: theme.gray, fontSize: '12px', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding:    '80px 40px',
        background: theme.navy,
        borderTop:  `1px solid ${theme.border}`,
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '12px' }}>
              FEATURES
            </div>
            <h2 style={{ fontSize: '40px', fontWeight: '900', color: theme.white, margin: 0 }}>
              Everything you need to
              <span style={{ color: theme.gold }}> master your portfolio</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {feature('📊', 'Portfolio Health Score', 'Get an overall score out of 100 based on returns, risk, diversification, beta and volatility.')}
            {feature('🎯', 'Efficient Frontier', 'Visualize the optimal risk-return tradeoff and see exactly where your portfolio sits.')}
            {feature('📉', 'Value at Risk (VaR)', 'Know your maximum expected loss at 90%, 95% and 99% confidence levels.')}
            {feature('🔄', 'Monte Carlo Simulation', '5,000 random portfolio simulations to find the best possible allocation for your stocks.')}
            {feature('📈', 'Benchmark Comparison', 'See how your portfolio performs against NIFTY 50 over time.')}
            {feature('🧮', 'Sensitivity Analysis', 'Adjust stock weights with live sliders and see instant impact on returns and risk.')}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding:    '100px 40px',
        textAlign:  'center',
        background: `radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }}>
        <h2 style={{ fontSize: '44px', fontWeight: '900', color: theme.white, marginBottom: '16px' }}>
          Ready to analyze your portfolio?
        </h2>
        <p style={{ color: theme.gray, fontSize: '16px', marginBottom: '36px' }}>
          Free. No signup. Results in under 60 seconds.
        </p>
        <Link to="/analyse" style={{
          padding:        '18px 48px',
          borderRadius:   '14px',
          textDecoration: 'none',
          fontSize:       '16px',
          fontWeight:     '800',
          color:          theme.navyDark,
          background:     `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
          boxShadow:      '0 8px 32px rgba(201,168,76,0.4)',
          letterSpacing:  '0.5px',
        }}>
          Start Free Analysis →
        </Link>
      </section>

    </div>
  )
}