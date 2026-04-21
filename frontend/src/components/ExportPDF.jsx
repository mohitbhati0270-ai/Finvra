import { useState } from 'react'
import jsPDF from 'jspdf'

export default function ExportPDF({ result, benchData, varData }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth    = 210
      const pageHeight   = 297
      const margin       = 12
      const contentWidth = pageWidth - margin * 2

      // ─── HEADER ───────────────────────────────────────────────
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, pageWidth, 32, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Finvra', margin, 16)

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Indian Equity Portfolio Analysis Report', margin, 24)

      const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
      pdf.setFontSize(9)
      pdf.text(`Generated: ${date}`, pageWidth - margin - 55, 24)

      let y = 42

      // ─── SUMMARY CARDS ────────────────────────────────────────
      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Portfolio Summary', margin, y)
      y += 7

      const summary = result.summary
      const cards = [
        {
          label: 'Annual Return',
          value: `${summary.annual_return_pct > 0 ? '+' : ''}${summary.annual_return_pct}%`,
          color: summary.annual_return_pct >= 0 ? [34, 197, 94] : [239, 68, 68]
        },
        {
          label: 'Volatility',
          value: `${summary.annual_volatility_pct}%`,
          color: [249, 115, 22]
        },
        {
          label: 'Sharpe Ratio',
          value: summary.sharpe_ratio.toFixed(2),
          color: [59, 130, 246]
        },
        {
          label: 'Portfolio Beta',
          value: summary.portfolio_beta.toFixed(2),
          color: [139, 92, 246]
        },
      ]

      const cardW = (contentWidth - 9) / 4
      cards.forEach((card, i) => {
        const x = margin + i * (cardW + 3)
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, y, cardW, 22, 2, 2, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.roundedRect(x, y, cardW, 22, 2, 2, 'S')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text(card.label, x + 3, y + 7)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...card.color)
        pdf.text(card.value, x + 3, y + 17)
      })
      y += 30

      // ─── PORTFOLIO HEALTH SCORE ───────────────────────────────
      if (result.score) {
        pdf.setTextColor(30, 41, 59)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Portfolio Health Score', margin, y)
        y += 7

        pdf.setFillColor(239, 246, 255)
        pdf.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F')
        pdf.setDrawColor(191, 219, 254)
        pdf.roundedRect(margin, y, contentWidth, 32, 3, 3, 'S')

        // Big score number
        pdf.setFontSize(30)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(37, 99, 235)
        pdf.text(`${result.score.total}`, margin + 6, y + 22)

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text('/100', margin + 24, y + 22)

        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30, 41, 59)
        pdf.text(
          `Grade: ${result.score.grade}  —  ${result.score.label}`,
          margin + 45, y + 14
        )

        // Breakdown bars
        const breakdown = Object.entries(result.score.breakdown)
        const bw = (contentWidth - 50) / breakdown.length - 2
        breakdown.forEach(([key, item], i) => {
          const bx = margin + 45 + i * (bw + 3)
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(100, 116, 139)
          const shortLabel = item.label.split(' ')[0]
          pdf.text(shortLabel, bx, y + 22)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(37, 99, 235)
          pdf.text(`${item.score}/${item.max}`, bx, y + 29)
          // Bar background
          pdf.setFillColor(209, 213, 219)
          pdf.rect(bx, y + 30, bw, 2, 'F')
          // Bar fill
          pdf.setFillColor(37, 99, 235)
          pdf.rect(bx, y + 30, bw * (item.score / item.max), 2, 'F')
        })
        y += 40
      }

      // ─── KEY INSIGHTS ─────────────────────────────────────────
      if (result.insights && result.insights.length > 0) {
        if (y > pageHeight - 80) { pdf.addPage(); y = 20 }

        pdf.setTextColor(30, 41, 59)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Key Insights', margin, y)
        y += 7

        result.insights.forEach((insight, i) => {
          if (y > pageHeight - 30) { pdf.addPage(); y = 20 }
          const lines   = pdf.splitTextToSize(`${i + 1}.  ${insight}`, contentWidth - 8)
          const boxH    = lines.length * 5 + 8
          pdf.setFillColor(239, 246, 255)
          pdf.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(30, 41, 59)
          pdf.text(lines, margin + 4, y + 6)
          y += boxH + 3
        })
        y += 4
      }

      // ─── INDIVIDUAL STOCKS TABLE ──────────────────────────────
      if (y > pageHeight - 60) { pdf.addPage(); y = 20 }

      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Individual Stocks', margin, y)
      y += 7

      const cols = ['Stock', 'Weight %', 'Return %', 'Volatility %', 'Beta', 'Risk Contrib %']
      const colW = [32, 26, 28, 30, 22, 32]

      // Header row
      pdf.setFillColor(37, 99, 235)
      pdf.rect(margin, y, contentWidth, 9, 'F')
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      let cx = margin
      cols.forEach((col, i) => {
        pdf.text(col, cx + 2, y + 6)
        cx += colW[i]
      })
      y += 9

      // Data rows
      result.stocks.forEach((stock, idx) => {
        if (y > pageHeight - 15) { pdf.addPage(); y = 20 }

        pdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255)
        pdf.rect(margin, y, contentWidth, 8, 'F')
        pdf.setDrawColor(241, 245, 249)
        pdf.rect(margin, y, contentWidth, 8, 'S')

        const rowData = [
          stock.ticker,
          `${stock.weight}%`,
          `${stock.annual_return > 0 ? '+' : ''}${stock.annual_return}%`,
          `${stock.annual_volatility}%`,
          stock.beta.toFixed(2),
          `${stock.risk_contribution_pct.toFixed(1)}%`,
        ]

        cx = margin
        rowData.forEach((val, i) => {
          pdf.setFontSize(8)
          pdf.setFont('helvetica', i === 0 ? 'bold' : 'normal')
          if (i === 2) {
            pdf.setTextColor(
              stock.annual_return >= 0 ? 34 : 239,
              stock.annual_return >= 0 ? 197 : 68,
              stock.annual_return >= 0 ? 94 : 68
            )
          } else {
            pdf.setTextColor(30, 41, 59)
          }
          pdf.text(val, cx + 2, y + 5.5)
          cx += colW[i]
        })
        y += 8
      })

      y += 8

      // ─── BENCHMARK COMPARISON ─────────────────────────────────
      if (benchData) {
        if (y > pageHeight - 40) { pdf.addPage(); y = 20 }

        pdf.setTextColor(30, 41, 59)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Benchmark Comparison vs NIFTY 50', margin, y)
        y += 7

        const portLast  = benchData.portfolio[benchData.portfolio.length - 1]
        const niftyLast = benchData.nifty50[benchData.nifty50.length - 1]
        const diff      = (portLast - niftyLast).toFixed(2)
        const beating   = portLast > niftyLast

        pdf.setFillColor(beating ? 240 : 254, beating ? 253 : 242, beating ? 244 : 242)
        pdf.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F')
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(beating ? 34 : 239, beating ? 197 : 68, beating ? 94 : 68)
        pdf.text(
          beating
            ? `✓ Outperforming NIFTY 50 by ${Math.abs(diff)}%`
            : `✗ Underperforming NIFTY 50 by ${Math.abs(diff)}%`,
          margin + 4, y + 8
        )
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text(
          `Portfolio: ${portLast > 0 ? '+' : ''}${portLast}%   |   NIFTY 50: ${niftyLast > 0 ? '+' : ''}${niftyLast}%`,
          margin + 4, y + 15
        )
        y += 26
      }

      // ─── VAR SECTION ──────────────────────────────────────────
      if (varData) {
        if (y > pageHeight - 50) { pdf.addPage(); y = 20 }

        pdf.setTextColor(30, 41, 59)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Value at Risk (VaR)', margin, y)
        y += 7

        const levels = ['90', '95', '99']
        const varW   = (contentWidth - 6) / 3

        levels.forEach((level, i) => {
          if (!varData[level]) return
          const x = margin + i * (varW + 3)
          pdf.setFillColor(254, 242, 242)
          pdf.roundedRect(x, y, varW, 28, 2, 2, 'F')
          pdf.setDrawColor(254, 202, 202)
          pdf.roundedRect(x, y, varW, 28, 2, 2, 'S')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(239, 68, 68)
          pdf.text(`${level}% Confidence`, x + 3, y + 7)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(30, 41, 59)
          pdf.text(`Historical VaR: ${varData[level].historical_var}%`, x + 3, y + 13)
          pdf.text(`CVaR: ${varData[level].cvar}%`, x + 3, y + 19)
          pdf.text(`Parametric: ${varData[level].parametric_var}%`, x + 3, y + 25)
        })
        y += 34
      }

      // ─── FOOTER ON EVERY PAGE ─────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFillColor(248, 250, 252)
        pdf.rect(0, pageHeight - 14, pageWidth, 14, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.line(0, pageHeight - 14, pageWidth, pageHeight - 14)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text('Finvra — Indian Equity Portfolio Analysis — finvra.vercel.app', margin, pageHeight - 7)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 22, pageHeight - 7)
        pdf.setFontSize(7)
        pdf.text('Not financial advice. For informational purposes only.', margin, pageHeight - 3)
      }

      // ─── SAVE ─────────────────────────────────────────────────
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
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition"
    >
      {exporting ? '⏳ Generating PDF...' : '📄 Export PDF Report'}
    </button>
  )
}