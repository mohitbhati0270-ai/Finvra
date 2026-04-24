import { Link } from 'react-router-dom'
import { theme } from '../theme'

const services = [
  {
    icon: '📊',
    title: 'Portfolio Analysis',
    subtitle: 'Complete Risk & Return Analysis',
    desc: 'Get a full breakdown of your portfolio including annual return, volatility, Sharpe ratio, beta, and individual stock risk contributions.',
    features: ['Annual Return', 'Portfolio Volatility', 'Sharpe Ratio', 'Portfolio Beta', 'Risk Contribution per stock'],
    cta: 'Analyse Now',
    link: '/analyse',
    highlight: true,
  },
  {
    icon: '🎯',
    title: 'Portfolio Optimization',
    subtitle: 'Efficient Frontier & Monte Carlo',
    desc: 'See where your portfolio sits on the Efficient Frontier and discover the optimal weights for maximum risk-adjusted returns.',
    features: ['5,000 Monte Carlo simulations', 'Efficient Frontier curve', 'Max Sharpe portfolio weights', 'Min Variance portfolio weights'],
    cta: 'Try Optimization',
    link: '/analyse',
    highlight: false,
  },
  {
    icon: '📉',
    title: 'Risk Analysis',
    subtitle: 'Value at Risk & Correlation',
    desc: 'Understand your true downside risk with Historical VaR, CVaR, Parametric VaR and Modified VaR at multiple confidence levels.',
    features: ['Historical VaR', 'Conditional VaR (CVaR)', 'Parametric VaR', 'Modified VaR (Cornish-Fisher)', 'Correlation Matrix'],
    cta: 'Analyse Risk',
    link: '/analyse',
    highlight: false,
  },
  {
    icon: '📈',
    title: 'Benchmark Comparison',
    subtitle: 'Portfolio vs NIFTY 50',
    desc: 'Compare your portfolio performance against NIFTY 50 over 1, 2, 3 or 5 years and see if you are outperforming the market.',
    features: ['Cumulative return comparison', 'Outperforming/Underperforming badge', 'Multiple time periods', 'Real NSE data'],
    cta: 'Compare Now',
    link: '/analyse',
    highlight: false,
  },
  {
    icon: '🧮',
    title: 'Sensitivity Analysis',
    subtitle: 'Live Portfolio Rebalancing',
    desc: 'Use interactive sliders to adjust stock weights and see the instant impact on your portfolio return, volatility and Sharpe ratio.',
    features: ['Live weight adjustment', 'Instant return recalculation', 'Instant risk recalculation', 'Sharpe ratio impact'],
    cta: 'Try It',
    link: '/analyse',
    highlight: false,
  },
  {
    icon: '📄',
    title: 'PDF Export',
    subtitle: 'Professional Report',
    desc: 'Export a complete portfolio analysis report as a PDF with all metrics, insights, scores and stock details.',
    features: ['Portfolio summary', 'Health score', 'Individual stocks table', 'Key insights', 'Benchmark comparison'],
    cta: 'Export Report',
    link: '/analyse',
    highlight: false,
  },
]

export default function Services() {
  return (
    <div style={{ background: theme.navyDark, minHeight: '100vh', color: theme.white }}>

      {/* Header */}
      <section style={{
        padding:    '80px 40px 60px',
        textAlign:  'center',
        background: `radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }}>
        <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '16px' }}>
          OUR SERVICES
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: theme.white, lineHeight: 1.2, marginBottom: '16px' }}>
          Institutional Analytics
          <span style={{ color: theme.gold }}> Made Simple</span>
        </h1>
        <p style={{ color: theme.gray, fontSize: '16px', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
          Every tool a professional fund manager uses — available to you for free.
        </p>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '20px 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {services.map((s, i) => (
            <div key={i} style={{
              background:   s.highlight ? `linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))` : theme.navyCard,
              border:       s.highlight ? `1px solid ${theme.gold}` : `1px solid ${theme.border}`,
              borderRadius: '20px',
              padding:      '32px',
              display:      'flex',
              flexDirection:'column',
              transition:   'all 0.3s',
              position:     'relative',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = `0 16px 40px rgba(201,168,76,0.15)`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {s.highlight && (
                <div style={{
                  position:     'absolute',
                  top:          '-12px',
                  left:         '50%',
                  transform:    'translateX(-50%)',
                  background:   `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
                  color:        theme.navyDark,
                  fontSize:     '11px',
                  fontWeight:   '800',
                  padding:      '4px 16px',
                  borderRadius: '20px',
                  letterSpacing:'1px',
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{s.icon}</div>
              <h3 style={{ color: s.highlight ? theme.gold : theme.white, fontSize: '20px', fontWeight: '800', margin: '0 0 4px' }}>
                {s.title}
              </h3>
              <div style={{ color: theme.gray, fontSize: '12px', fontWeight: '600', marginBottom: '16px', letterSpacing: '0.5px' }}>
                {s.subtitle}
              </div>
              <p style={{ color: theme.gray, fontSize: '13px', lineHeight: 1.7, marginBottom: '20px', flex: 1 }}>
                {s.desc}
              </p>

              <div style={{ marginBottom: '24px' }}>
                {s.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: theme.gold, fontSize: '12px' }}>✓</span>
                    <span style={{ color: theme.grayLight, fontSize: '13px' }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link to={s.link} style={{
                display:        'block',
                textAlign:      'center',
                padding:        '12px',
                borderRadius:   '10px',
                textDecoration: 'none',
                fontSize:       '14px',
                fontWeight:     '700',
                color:          s.highlight ? theme.navyDark : theme.gold,
                background:     s.highlight
                  ? `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`
                  : 'rgba(201,168,76,0.1)',
                border:         s.highlight ? 'none' : `1px solid ${theme.border}`,
                boxShadow:      s.highlight ? '0 4px 16px rgba(201,168,76,0.3)' : 'none',
              }}>
                {s.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}