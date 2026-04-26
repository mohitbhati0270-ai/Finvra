import { useState } from 'react'
import jsPDF from 'jspdf'
import { theme } from '../theme'

export default function ExportPDF({ result, benchData, varData }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth    = 210
      const pageHeight   = 297
      const margin       = 16
      const contentWidth = pageWidth - margin * 2

      // ── COLORS ──────────────────────────────────────────────
      const navy      = [11, 17, 32]
      const navyCard  = [15, 23, 42]
      const gold      = [201, 168, 76]
      const goldLight = [220, 190, 100]
      const white     = [255, 255, 255]
      const gray      = [148, 163, 184]
      const lightBg   = [241, 245, 249]
      const green     = [34, 197, 94]
      const red       = [239, 68, 68]
      const orange    = [249, 115, 22]
      const purple    = [139, 92, 246]
      const border    = [30, 41, 59]

      const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })

      // ── PAGE 1 HEADER ────────────────────────────────────────
      // Full dark header band
      pdf.setFillColor(...navy)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // Gold top accent bar
      pdf.setFillColor(...gold)
      pdf.rect(0, 0, pageWidth, 1.5, 'F')

      // Logo area
      pdf.setFillColor(...navyCard)
      pdf.roundedRect(margin, 12, 50, 18, 3, 3, 'F')
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...gold)
      pdf.text('Finvra', margin + 6, 24)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...gray)
      pdf.text('PORTFOLIO ANALYTICS', margin + 6, 28)

      // Report title (right side)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...white)
      pdf.text('Indian Equity Portfolio Analysis', pageWidth - margin, 19, { align: 'right' })
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...gray)
      pdf.text(`Generated: ${date}`, pageWidth - margin, 25, { align: 'right' })

      // Divider line
      pdf.setDrawColor(...gold)
      pdf.setLineWidth(0.3)
      pdf.line(margin, 34, pageWidth - margin, 34)

      let y = 42

      // ── PORTFOLIO SUMMARY SECTION ────────────────────────────
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...gold)
      pdf.text('PORTFOLIO SUMMARY', margin, y)
      y += 6

      const summary = result.summary
      const cards = [
        {
          label: 'Annual Return',
          value: `${summary.annual_return_pct > 0 ? '+' : ''}${summary.annual_return_pct}%`,
          color: summary.annual_return_pct >= 0 ? green : red,
          bg: summary.annual_return_pct >= 0 ? [22, 101, 52] : [127, 29, 29],
        },
        {
          label: 'Volatility',
          value: `${summary.annual_volatility_pct}%`,
          color: orange,
          bg: [124, 45, 18],
        },
        {
          label: 'Sharpe Ratio',
          value: summary.sharpe_ratio.toFixed(2),
          color: gold,
          bg: [92, 70, 20],
        },
        {
          label: 'Portfolio Beta',
          value: summary.portfolio_beta.toFixed(2),
          color: purple,
          bg: [76, 29, 149],
        },
      ]

      const cardW = (contentWidth - 9) / 4
      cards.forEach((card, i) => {
        const x = margin + i * (cardW + 3)
        // Card background
        pdf.setFillColor(...card.bg)
        pdf.roundedRect(x, y, cardW, 24, 3, 3, 'F')
        // Left accent bar
        pdf.setFillColor(...card.color)
        pdf.roundedRect(x, y, 2, 24, 1, 1, 'F')
        // Label
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...gray)
        pdf.text(card.label.toUpperCase(), x + 5, y + 8)
        // Value
        pdf.setFontSize(15)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...card.color)
        pdf.text(card.value, x + 5, y + 19)
      })
      y += 32

      // ── HEALTH SCORE ─────────────────────────────────────────
      if (result.score) {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...gold)
        pdf.text('PORTFOLIO HEALTH SCORE', margin, y)
        y += 6

        pdf.setFillColor(...navyCard)
        pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F')
        pdf.setDrawColor(...border)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, 'S')

        // Score circle background
        pdf.setFillColor(...gold)
        pdf.circle(margin + 16, y + 14, 11, 'F')
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...navy)
        pdf.text(`${result.score.total}`, margin + 16, y + 18, { align: 'center' })

        // /100 label
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...gray)
        pdf.text('/100', margin + 22, y + 25)

        // Grade and label
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...white)
        pdf.text(`Grade: ${result.score.grade}  —  ${result.score.label}`, margin + 32, y + 12)

        // Breakdown
        if (result.score.breakdown) {
          const breakdown = Object.entries(result.score.breakdown)
          const bw = (contentWidth - 36) / breakdown.length - 3
          breakdown.forEach(([key, item], i) => {
            const bx = margin + 32 + i * (bw + 3)
            pdf.setFontSize(6.5)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...gray)
            pdf.text(item.label.split(' ')[0].toUpperCase(), bx, y + 20)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...gold)
            pdf.text(`${item.score}/${item.max}`, bx, y + 26)
            // Bar track
            pdf.setFillColor(...border)
            pdf.roundedRect(bx, y + 27, bw, 1.5, 0.5, 0.5, 'F')
            // Bar fill
            pdf.setFillColor(...gold)
            pdf.roundedRect(bx, y + 27, bw * (item.score / item.max), 1.5, 0.5, 0.5, 'F')
          })
        }
        y += 36
      }

      // ── KEY INSIGHTS ──────────────────────────────────────────
      if (result.insights && result.insights.length > 0) {
        if (y > pageHeight - 80) { pdf.addPage(); _fillPageBg(pdf, pageWidth, pageHeight, navy, gold); y = 20 }

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...gold)
        pdf.text('KEY INSIGHTS', margin, y)
        y += 6

        result.insights.forEach((insight, i) => {
          if (y > pageHeight - 25) { pdf.addPage(); _fillPageBg(pdf, pageWidth, pageHeight, navy, gold); y = 20 }
          const lines = pdf.splitTextToSize(`${insight}`, contentWidth - 16)
          const boxH  = lines.length * 5 + 10

          pdf.setFillColor(...navyCard)
          pdf.roundedRect(margin, y, contentWidth, boxH, 3, 3, 'F')
          pdf.setDrawColor(...border)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(margin, y, contentWidth, boxH, 3, 3, 'S')

          // Number badge
          pdf.setFillColor(...gold)
          pdf.circle(margin + 6, y + boxH / 2, 4, 'F')
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...navy)
          pdf.text(`${i + 1}`, margin + 6, y + boxH / 2 + 2, { align: 'center' })

          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...white)
          pdf.text(lines, margin + 14, y + 7)
          y += boxH + 4
        })
        y += 4
      }

      // ── INDIVIDUAL STOCKS TABLE ───────────────────────────────
      if (y > pageHeight - 60) { pdf.addPage(); _fillPageBg(pdf, pageWidth, pageHeight, navy, gold); y = 20 }

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...gold)
      pdf.text('INDIVIDUAL STOCKS', margin, y)
      y += 6

      const cols = ['Stock', 'Weight %', 'Return %', 'Volatility %', 'Beta', 'Risk Contrib %']
      const colW = [32, 26, 28, 30, 22, 30]

      // Table header
      pdf.setFillColor(...gold)
      pdf.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F')
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...navy)
      let cx = margin + 3
      cols.forEach((col, i) => {
        pdf.text(col, cx, y + 6)
        cx += colW[i]
      })
      y += 9

      result.stocks.forEach((stock, idx) => {
        if (y > pageHeight - 15) { pdf.addPage(); _fillPageBg(pdf, pageWidth, pageHeight, navy, gold); y = 20 }

        pdf.setFillColor(idx % 2 === 0 ? 15 : 20, idx % 2 === 0 ? 23 : 30, idx % 2 === 0 ? 42 : 55)
        pdf.rect(margin, y, contentWidth, 9, 'F')
        pdf.setDrawColor(...border)
        pdf.setLineWidth(0.1)
        pdf.rect(margin, y, contentWidth, 9, 'S')

        const rowData = [
          stock.ticker,
          `${stock.weight}%`,
          `${stock.annual_return > 0 ? '+' : ''}${stock.annual_return}%`,
          `${stock.annual_volatility}%`,
          stock.beta.toFixed(2),
          `${stock.risk_contribution_pct.toFixed(1)}%`,
        ]

        cx = margin + 3
        rowData.forEach((val, i) => {
          pdf.setFontSize(8)
          pdf.setFont('helvetica', i === 0 ? 'bold' : 'normal')
          if (i === 0) {
            pdf.setTextColor(...gold)
          } else if (i === 2) {
            pdf.setTextColor(...(stock.annual_return >= 0 ? green : red))
          } else {
            pdf.setTextColor(...white)
          }
          pdf.text(val, cx, y + 6)
          cx += colW[i]
        })
        y += 9
      })
      y += 10

      // ── BENCHMARK COMPARISON ──────────────────────────────────
      if (benchData) {
        if (y > pageHeight - 40) { pdf.addPage(); _fillPageBg(pdf, pageWidth, pageHeight, navy, gold); y = 20 }

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...gold)
        pdf.text('BENCHMARK COMPARISON vs NIFTY 50', margin, y)
        y += 6

        const portLast  = benchData.portfolio[benchData.portfolio.length - 1]
        const niftyLast = benchData.nifty50[benchData.nifty50.length - 1]
        const diff      = (portLast - niftyLast).toFixed(2)
        const beating   = portLast > niftyLast

        pdf.setFillColor(...navyCard)
        pdf.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F')
        pdf.setDrawColor(...(beating ? green : red))
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S')

        // Left color bar
        pdf.setFillColor(...(beating ? green : red))
        pdf.roundedRect(margin, y, 3, 22, 1, 1, 'F')

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...(beating ? green : red))
        pdf.text(
          beating
            ? `' Outperforming NIFTY 50 by ${Math.abs(diff)}%`
            : `✗ Underperforming NIFTY 50 by ${Math.abs(diff)}%`,
          margin + 8, y + 10
        )
        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...gray)
        pdf.text(
          `Portfolio: ${portLast > 0 ? '+' : ''}${portLast}%   |   NIFTY 50: ${niftyLast > 0 ? '+' : ''}${niftyLast}%`,
          margin + 8, y + 17
        )
        y += 30
      }

      // ── VAR SECTION ───────────────────────────────────────────
      if (varData) {
        if (y > pageHeight - 55) { pdf.addPage(); _fillPageBg(pdf, pageWidth, pageHeight, navy, gold); y = 20 }

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...gold)
        pdf.text('VALUE AT RISK (VaR)', margin, y)
        y += 6

        const levels = ['90', '95', '99']
        const varW   = (contentWidth - 6) / 3

        levels.forEach((level, i) => {
          if (!varData[level]) return
          const x = margin + i * (varW + 3)

          pdf.setFillColor(...navyCard)
          pdf.roundedRect(x, y, varW, 32, 3, 3, 'F')
          pdf.setDrawColor(...red)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(x, y, varW, 32, 3, 3, 'S')

          // Top accent
          pdf.setFillColor(...red)
          pdf.roundedRect(x, y, varW, 2, 1, 1, 'F')

          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...red)
          pdf.text(`${level}% Confidence`, x + 4, y + 10)

          pdf.setDrawColor(...border)
          pdf.setLineWidth(0.2)
          pdf.line(x + 4, y + 12, x + varW - 4, y + 12)

          const rows = [
            ['Historical VaR', `${varData[level].historical_var}%`],
            ['CVaR (ES)',       `${varData[level].cvar}%`],
            ['Parametric',      `${varData[level].parametric_var}%`],
          ]
          rows.forEach(([label, val], ri) => {
            pdf.setFontSize(7.5)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...gray)
            pdf.text(label, x + 4, y + 17 + ri * 6)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...white)
            pdf.text(val, x + varW - 4, y + 17 + ri * 6, { align: 'right' })
          })
        })
        y += 40
      }

      // ── FOOTER ON EVERY PAGE ──────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setDrawColor(...gold)
        pdf.setLineWidth(0.3)
        pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...gold)
        pdf.text('Finvra', margin, pageHeight - 8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...gray)
        pdf.text('— Indian Equity Portfolio Analysis — finvra.vercel.app', margin + 11, pageHeight - 8)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
        pdf.setFontSize(6.5)
        pdf.text('Not financial advice. For informational purposes only.', margin, pageHeight - 4)
      }

      // ── SAVE ──────────────────────────────────────────────────
      const fileName = `Finvra_Portfolio_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        padding:      '10px 20px',
        background:   exporting ? '#1E293B' : 'linear-gradient(135deg, #C9A84C, #A87D2A)',
        border:       'none',
        borderRadius: '10px',
        color:        exporting ? '#64748B' : '#0B1120',
        fontSize:     '13px',
        fontWeight:   '700',
        cursor:       exporting ? 'not-allowed' : 'pointer',
        boxShadow:    exporting ? 'none' : '0 4px 12px rgba(201,168,76,0.3)',
        transition:   'all 0.2s',
        letterSpacing: '0.3px',
      }}
    >
      {exporting ? '⏳ Generating PDF...' : '📄 Export PDF Report'}
    </button>
  )
}

// Helper — fills page background dark on new pages
function _fillPageBg(pdf, pageWidth, pageHeight, navy, gold) {
  pdf.setFillColor(...navy)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  pdf.setFillColor(...gold)
  pdf.rect(0, 0, pageWidth, 1.5, 'F')
}