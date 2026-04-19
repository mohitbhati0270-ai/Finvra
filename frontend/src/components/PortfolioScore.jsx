export default function PortfolioScore({ score }) {
  if (!score) return null

  const { total, grade, label, breakdown } = score

  const getColor = (total) => {
    if (total >= 80) return { ring: '#22C55E', bg: '#F0FDF4', text: '#15803D', light: '#DCFCE7' }
    if (total >= 60) return { ring: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', light: '#DBEAFE' }
    if (total >= 40) return { ring: '#F59E0B', bg: '#FFFBEB', text: '#B45309', light: '#FEF3C7' }
    if (total >= 20) return { ring: '#F97316', bg: '#FFF7ED', text: '#C2410C', light: '#FFEDD5' }
    return { ring: '#EF4444', bg: '#FEF2F2', text: '#B91C1C', light: '#FEE2E2' }
  }

  const colors = getColor(total)
  const circumference = 2 * Math.PI * 54
  const progress = (total / 100) * circumference

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4">Portfolio Health Score</h2>

      <div className="flex gap-6 items-center">

        {/* Circular score */}
        <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="12"
            />
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke={colors.ring}
              strokeWidth="12"
              strokeDasharray={`${progress} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: colors.text,
              lineHeight: 1,
            }}>
              {total}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              out of 100
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: colors.text,
              marginTop: '4px',
            }}>
              {grade} — {label}
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(breakdown).map(([key, item]) => (
            <div key={key}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>
                  {item.score}/{item.max}
                </span>
              </div>
              <div style={{
                height: '6px',
                background: '#F1F5F9',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(item.score / item.max) * 100}%`,
                  background: colors.ring,
                  borderRadius: '3px',
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}