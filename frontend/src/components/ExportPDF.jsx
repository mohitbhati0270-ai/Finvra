import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ExportPDF({ result, benchData, varData }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth  = 210
      const pageHeight = 297
      const margin     = 10
      const contentWidth = pageWidth - margin * 2

      // --- Page 1: Header + Summary + Score + Insights ---
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, pageWidth, 30, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Finvra', margin, 18)

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Indian Equity Portfolio Analysis', margin, 25)

      const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
      pdf.text(`Generated: ${date}`, pageWidth - margin - 50, 25)

      // Summary Cards
      let y = 40
      pdf.setTextColor(30, 41, 59)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Portfolio Summary', margin, y)
      y += 8

      const cards = [
        { label: 'Annual Return', value: `${result.summary.annual_return_pct > 0 ? '+' : ''}${result.summary.annual_return_pct}%` },
        { label: 'Volatility',    value: `${result.summary.annual_volatility_pct}%` },
        { label: 'Sharpe Ratio',  value: result.summary.sharpe_ratio.toFixed(2) },
        { label: 'Portfolio Beta', value: result.summary.portfolio_beta.toFixed(2) },
      ]

      const cardW = (contentWidth - 9) / 4
      cards.forEach((card, i) => {
        const x = margin + i * (cardW + 3)
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, y, cardW, 20, 2, 2, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.roundedRect(x, y, cardW, 20, 2, 2, 'S')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text(card.label, x + 3, y + 7)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30, 41, 59)
        pdf.text(card.value, x + 3, y + 16)
      })
      y += 28

      // Portfolio Score
      if (result.score) {
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30, 41, 59)
        pdf.text('Portfolio Health Score', margin, y)
        y += 8

        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.roundedRect(margin, y, contentWidth, 28, 2, 2, 'S')

        pdf.setFontSize(28)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(37, 99, 235)
        pdf.text(`${result.score.total}`, margin + 8, y + 20)

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text('/100', margin + 22, y + 20)

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30, 41, 59)
        pdf.text(`Grade: ${result.score.grade} — ${result.score.label}`, margin + 40, y + 13)

        // Score breakdown
        const breakdown = Object.entries(result.score.breakdown)
        const bw = (contentWidth - 40 - 15) / breakdown.length
        breakdown.forEach(([key, item], i) => {
          const bx = margin + 40 + i * (bw + 3)
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(100, 116, 139)
          pdf.text(item.label.split(' ')[0], bx, y + 8)
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(37, 99, 235)
          pdf.text(`${item.score}/${item.max}`, bx, y + 16)
          // Mini bar
          pdf.setFillColor(226, 232, 240)
          pdf.rect(bx, y + 18, bw - 2, 3, 'F')
          pdf.setFillColor(37, 99, 235)
          pdf.rect(bx, y + 18, (bw - 2) * (item.score / item.max), 3, 'F')
        })
        y += 36
      }

      // Insights
      if (result.insights && result.insights.length > 0) {
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30, 41, 59)
        pdf.text('Key Insights', margin, y)
        y += 8

        result.insights.forEach((insight, i) => {
          pdf.setFillColor(239, 246, 255)
          const lines = pdf.splitTextToSize(`${i + 1}. ${insight}`, contentWidth - 6)
          const boxH = lines.length * 5 + 6
          pdf.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(30, 41, 59)
          pdf.text(lines, margin + 3, y + 5)
          y += boxH + 3
        })
        y += 5
      }

      // --- Individual Stocks Table ---
      if (y > pageHeight - 60) {
        pdf.addPage()
        y = 20
      }

      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 41, 59)
      pdf.text('Individual Stocks', margin, y)
      y += 8

      // Table header
      const cols = ['Stock', 'Weight', 'Return', 'Volatility', 'Beta', 'Risk %']
      const colW  = [35, 25, 28, 28, 22, 22]
      let cx = margin

      pdf.setFillColor(37, 99, 235)
      pdf.rect(margin, y, contentWidth, 8, 'F')
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      cols.forEach((col, i) => {
        pdf.text(col, cx + 2, y + 5.5)
        cx += colW[i]
      })
      y += 8

      // Table rows
      result.stocks.forEach((stock, idx) => {
        if (y > pageHeight - 20) {
          pdf.addPage()
          y = 20
        }
        pdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255)
        pdf.rect(margin, y, contentWidth, 7, 'F')

        const rowData = [
          stock.ticker,
          `${stock.weight}%`,
          `${stock.annual_return > 0 ? '+' : ''}${stock.annual_return}%`,
          `${stock.annual_volatility}%`,
          stock.beta.toFixed(2),
          `${stock.risk_contribution_pct.toFixed(1)}%`,
        ]

        cx = margin
        pdf.setFontSize(8)
        pdf.setFont('helvetica', idx === 0 ? 'bold' : 'normal')
        rowData.forEach((val, i) => {
          if (i === 2) {
            pdf.setTextColor(stock.annual_return >= 0 ? 34 : 239, stock.annual_return >= 0 ? 197 : 68, stock.annual_return >= 0 ? 94 : 68)
          } else {
            pdf.setTextColor(30, 41, 59)
          }
          pdf.text(val, cx + 2, y + 5)
          cx += colW[i]
        })
        y += 7
      })

      // Footer on each page
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFillColor(248, 250, 252)
        pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 116, 139)
        pdf.text('Finvra — Indian Equity Portfolio Analysis — finvra.vercel.app', margin, pageHeight - 5)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5)
        pdf.setFontSize(7)
        pdf.text('Not financial advice. For informational purposes only.', margin, pageHeight - 1)
      }

      // Save
      const fileName = `Finvra_Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`
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
      {exporting ? (
        <>⏳ Generating PDF...</>
      ) : (
        <>📄 Export PDF Report</>
      )}
    </button>
  )
}