import { useState, useEffect } from 'react'
import { theme } from '../theme'

const STATIC_POSTS = [
  {
    id: 1,
    title: 'What is Sharpe Ratio and why does it matter for your portfolio?',
    summary: 'The Sharpe Ratio measures how much return you get for every unit of risk taken. A ratio above 1.0 is considered good. Learn how to use it to evaluate your portfolio.',
    category: 'Education',
    date: 'April 20, 2026',
    readTime: '3 min read',
    icon: '📊',
  },
  {
    id: 2,
    title: 'Understanding Portfolio Diversification — Why spreading risk matters',
    summary: 'Diversification is the only free lunch in investing. Learn how correlation between stocks affects your portfolio risk and how to build a truly diversified portfolio.',
    category: 'Education',
    date: 'April 18, 2026',
    readTime: '4 min read',
    icon: '🎯',
  },
  {
    id: 3,
    title: 'What is Beta and how does it affect your portfolio in a market crash?',
    summary: 'Beta measures how much your portfolio moves relative to NIFTY 50. A beta above 1 means higher gains in bull markets but higher losses in crashes.',
    category: 'Education',
    date: 'April 15, 2026',
    readTime: '3 min read',
    icon: '📈',
  },
  {
    id: 4,
    title: 'Value at Risk (VaR) explained simply for retail investors',
    summary: 'VaR tells you the maximum amount your portfolio could lose in a given time period at a given confidence level. Here is how to read and use it.',
    category: 'Education',
    date: 'April 12, 2026',
    readTime: '5 min read',
    icon: '📉',
  },
  {
    id: 5,
    title: 'How to rebalance your portfolio — A step by step guide',
    summary: 'Portfolio rebalancing means bringing your stock weights back to their target levels. Learn when and how to rebalance without selling everything.',
    category: 'Strategy',
    date: 'April 10, 2026',
    readTime: '4 min read',
    icon: '🔄',
  },
  {
    id: 6,
    title: 'NIFTY 50 vs your portfolio — Are you really beating the market?',
    summary: 'Most retail investors underperform the NIFTY 50 index over the long term. Here is how to check if you are genuinely adding value through stock selection.',
    category: 'Strategy',
    date: 'April 8, 2026',
    readTime: '3 min read',
    icon: '🏆',
  },
]

const categories = ['All', 'Education', 'Strategy', 'Market News']

export default function Blog() {
  const [selected, setSelected] = useState('All')

  const filtered = selected === 'All'
    ? STATIC_POSTS
    : STATIC_POSTS.filter(p => p.category === selected)

  return (
    <div style={{ background: theme.navyDark, minHeight: '100vh', color: theme.white }}>

      {/* Header */}
      <section style={{
        padding:    '80px 40px 60px',
        textAlign:  'center',
        background: `radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }}>
        <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '16px' }}>
          BLOG & RESOURCES
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: theme.white, lineHeight: 1.2, marginBottom: '16px' }}>
          Learn to invest
          <span style={{ color: theme.gold }}> smarter</span>
        </h1>
        <p style={{ color: theme.gray, fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
          Plain English guides on portfolio analytics, risk management and investment strategy.
        </p>
      </section>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '0 40px 40px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            style={{
              padding:      '8px 20px',
              borderRadius: '20px',
              border:       selected === cat ? 'none' : `1px solid ${theme.border}`,
              cursor:       'pointer',
              fontSize:     '13px',
              fontWeight:   '600',
              background:   selected === cat ? `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})` : 'transparent',
              color:        selected === cat ? theme.navyDark : theme.gray,
              transition:   'all 0.2s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog Posts Grid */}
      <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {filtered.map((post, i) => (
            <div key={post.id} style={{
              background:   theme.navyCard,
              border:       `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding:      '28px',
              cursor:       'pointer',
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
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{post.icon}</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <span style={{
                  fontSize:     '11px',
                  fontWeight:   '700',
                  color:        theme.gold,
                  background:   'rgba(201,168,76,0.1)',
                  padding:      '3px 10px',
                  borderRadius: '20px',
                  border:       `1px solid ${theme.border}`,
                }}>
                  {post.category}
                </span>
                <span style={{ fontSize: '11px', color: theme.gray }}>{post.readTime}</span>
              </div>
              <h3 style={{ color: theme.white, fontSize: '15px', fontWeight: '700', lineHeight: 1.4, marginBottom: '12px' }}>
                {post.title}
              </h3>
              <p style={{ color: theme.gray, fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                {post.summary}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: theme.gray }}>{post.date}</span>
                <span style={{ fontSize: '13px', color: theme.gold, fontWeight: '600' }}>Read more →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}