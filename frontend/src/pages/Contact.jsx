import { useState } from 'react'
import { theme } from '../theme'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // For now just show success — can connect to email service later
    setSubmitted(true)
  }

  const inputStyle = {
    width:        '100%',
    padding:      '14px 16px',
    borderRadius: '10px',
    border:       `1px solid ${theme.border}`,
    background:   theme.navy,
    color:        theme.white,
    fontSize:     '14px',
    outline:      'none',
    boxSizing:    'border-box',
    transition:   'border-color 0.2s',
  }

  return (
    <div style={{ background: theme.navyDark, minHeight: '100vh', color: theme.white }}>

      {/* Header */}
      <section style={{
        padding:    '80px 40px 60px',
        textAlign:  'center',
        background: `radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 70%)`,
      }}>
        <div style={{ color: theme.gold, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '16px' }}>
          GET IN TOUCH
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: theme.white, lineHeight: 1.2, marginBottom: '16px' }}>
          We'd love to
          <span style={{ color: theme.gold }}> hear from you</span>
        </h1>
        <p style={{ color: theme.gray, fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
          Have feedback, suggestions or questions? Send us a message and we'll get back to you.
        </p>
      </section>

      <section style={{ padding: '20px 40px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>

          {/* Contact Info */}
          <div>
            <h3 style={{ color: theme.gold, fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
              Contact Information
            </h3>
            {[
              { icon: '📧', label: 'Email', value: 'hello@finvra.in' },
              { icon: '🌐', label: 'Website', value: 'finvra.vercel.app' },
              { icon: '🇮🇳', label: 'Based in', value: 'India' },
              { icon: '⚡', label: 'Response time', value: 'Within 24 hours' },
            ].map((item, i) => (
              <div key={i} style={{
                display:       'flex',
                gap:           '16px',
                marginBottom:  '24px',
                padding:       '16px',
                background:    theme.navyCard,
                border:        `1px solid ${theme.border}`,
                borderRadius:  '12px',
              }}>
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <div>
                  <div style={{ color: theme.gray, fontSize: '11px', fontWeight: '600', letterSpacing: '1px', marginBottom: '4px' }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{ color: theme.white, fontSize: '14px', fontWeight: '600' }}>{item.value}</div>
                </div>
              </div>
            ))}

            <div style={{
              padding:      '20px',
              background:   'rgba(201,168,76,0.08)',
              border:       `1px solid ${theme.border}`,
              borderRadius: '12px',
              marginTop:    '8px',
            }}>
              <p style={{ color: theme.gold, fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                💡 Feature Request?
              </p>
              <p style={{ color: theme.gray, fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                We actively build features based on user feedback. Tell us what you need and we'll consider adding it to Finvra!
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{
            background:   theme.navyCard,
            border:       `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding:      '36px',
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ color: theme.gold, fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
                  Message Sent!
                </h3>
                <p style={{ color: theme.gray, fontSize: '14px', lineHeight: 1.6 }}>
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  style={{
                    marginTop:    '24px',
                    padding:      '12px 24px',
                    borderRadius: '10px',
                    border:       `1px solid ${theme.border}`,
                    background:   'transparent',
                    color:        theme.gold,
                    fontSize:     '14px',
                    fontWeight:   '600',
                    cursor:       'pointer',
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ color: theme.white, fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                  Send us a message
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: theme.gray, fontSize: '12px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      YOUR NAME
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="John Doe"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      onFocus={e => e.target.style.borderColor = theme.gold}
                      onBlur={e => e.target.style.borderColor = theme.border}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: theme.gray, fontSize: '12px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      style={inputStyle}
                      type="email"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                      onFocus={e => e.target.style.borderColor = theme.gold}
                      onBlur={e => e.target.style.borderColor = theme.border}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: theme.gray, fontSize: '12px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    SUBJECT
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="Feature request, bug report, general feedback..."
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    required
                    onFocus={e => e.target.style.borderColor = theme.gold}
                    onBlur={e => e.target.style.borderColor = theme.border}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: theme.gray, fontSize: '12px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    MESSAGE
                  </label>
                  <textarea
                    style={{ ...inputStyle, height: '140px', resize: 'vertical' }}
                    placeholder="Tell us what you think about Finvra, what features you need, or report any issues..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    required
                    onFocus={e => e.target.style.borderColor = theme.gold}
                    onBlur={e => e.target.style.borderColor = theme.border}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width:        '100%',
                    padding:      '14px',
                    borderRadius: '12px',
                    border:       'none',
                    background:   `linear-gradient(135deg, ${theme.gold}, ${theme.goldDark})`,
                    color:        theme.navyDark,
                    fontSize:     '15px',
                    fontWeight:   '700',
                    cursor:       'pointer',
                    boxShadow:    '0 4px 16px rgba(201,168,76,0.3)',
                    letterSpacing:'0.3px',
                  }}
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}