import { useState } from 'react'
import jsPDF from 'jspdf'

export default function ExportPDF({ result, benchData, varData, optData }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const pdf        = new jsPDF('p', 'mm', 'a4')
      const pageWidth  = 210
      const pageHeight = 297
      const margin     = 14
      const cw         = pageWidth - margin * 2   // content width = 182

      // ── PALETTE ────────────────────────────────────────────────
      const C = {
        white     : [255, 255, 255],
        offWhite  : [248, 250, 252],
        lightBlue : [239, 246, 255],
        blue      : [37,  99,  235],
        blueDark  : [30,  58,  138],
        blueMid   : [59, 130, 246],
        gray100   : [241, 245, 249],
        gray200   : [226, 232, 240],
        gray400   : [148, 163, 184],
        gray700   : [51,  65,  85],
        black     : [15,  23,  42],
        green     : [22, 163,  74],
        greenBg   : [240, 253, 244],
        red       : [220,  38,  38],
        redBg     : [254, 242, 242],
        orange    : [234, 88,  12],
        orangeBg  : [255, 247, 237],
        purple    : [109,  40, 217],
        purpleBg  : [245, 243, 255],
        teal      : [13, 148, 136],
        tealBg    : [240, 253, 250],
        amber     : [180, 120,  10],
        amberBg   : [255, 251, 235],
      }

      const fillBg  = (pdf, page, pw, ph) => {
        pdf.setPage(page)
        pdf.setFillColor(...C.white)
        pdf.rect(0, 0, pw, ph, 'F')
      }

      const newPage = () => {
        pdf.addPage()
        pdf.setFillColor(...C.white)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
        // top blue bar
        pdf.setFillColor(...C.blue)
        pdf.rect(0, 0, pageWidth, 8, 'F')
      }

      const checkPage = (y, needed = 30) => {
        if (y > pageHeight - needed - 14) { newPage(); return 16 }
        return y
      }

      const sectionTitle = (pdf, text, y) => {
        pdf.setFillColor(...C.blue)
        pdf.rect(margin, y, 3, 6, 'F')
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(text, margin + 6, y + 5)
        return y + 10
      }

      const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })

      // ── PAGE 1 BACKGROUND ──────────────────────────────────────
      pdf.setFillColor(...C.white)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // ── HEADER ─────────────────────────────────────────────────
      pdf.setFillColor(...C.blueDark)
      pdf.rect(0, 0, pageWidth, 36, 'F')

      // diagonal accent strip
      pdf.setFillColor(...C.blue)
      pdf.triangle(pageWidth - 60, 0, pageWidth, 0, pageWidth, 36, 'F')

      // Finvra logo text
      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.white)
      pdf.text('Finvra', margin, 18)

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(180, 210, 255)
      pdf.text('PORTFOLIO ANALYTICS', margin, 25)

      // Right side
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.white)
      pdf.text('Equity Portfolio Analysis Report', pageWidth - margin, 15, { align: 'right' })
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(180, 210, 255)
      pdf.text(`Generated: ${date}`, pageWidth - margin, 22, { align: 'right' })

      // Portfolio value info
      const summary = result.summary
      const totalValue = result.stocks
        ? result.stocks.reduce((s, st) => s + (st.current_value || 0), 0)
        : 0

      let y = 44

      // ── SUMMARY CARDS ──────────────────────────────────────────
      y = sectionTitle(pdf, 'PORTFOLIO SUMMARY', y)

      const cards = [
        {
          label : 'Annual Return',
          value : `${summary.annual_return_pct > 0 ? '+' : ''}${summary.annual_return_pct}%`,
          color : summary.annual_return_pct >= 0 ? C.green : C.red,
          bg    : summary.annual_return_pct >= 0 ? C.greenBg : C.redBg,
          border: summary.annual_return_pct >= 0 ? C.green : C.red,
        },
        {
          label : 'Volatility',
          value : `${summary.annual_volatility_pct}%`,
          color : C.orange, bg: C.orangeBg, border: C.orange,
        },
        {
          label : 'Sharpe Ratio',
          value : summary.sharpe_ratio.toFixed(2),
          color : C.blue, bg: C.lightBlue, border: C.blueMid,
        },
        {
          label : 'Portfolio Beta',
          value : summary.portfolio_beta.toFixed(2),
          color : C.purple, bg: C.purpleBg, border: C.purple,
        },
      ]

      const cardW = (cw - 9) / 4
      cards.forEach((card, i) => {
        const x = margin + i * (cardW + 3)
        pdf.setFillColor(...card.bg)
        pdf.roundedRect(x, y, cardW, 22, 2, 2, 'F')
        pdf.setDrawColor(...card.border)
        pdf.setLineWidth(0.4)
        pdf.roundedRect(x, y, cardW, 22, 2, 2, 'S')
        // top accent
        pdf.setFillColor(...card.color)
        pdf.rect(x, y, cardW, 2, 'F')
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray400)
        pdf.text(card.label.toUpperCase(), x + 4, y + 9)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...card.color)
        pdf.text(card.value, x + 4, y + 19)
      })
      y += 30

      // ── HEALTH SCORE ───────────────────────────────────────────
      if (result.score) {
        y = checkPage(y, 38)
        y = sectionTitle(pdf, 'PORTFOLIO HEALTH SCORE', y)

        pdf.setFillColor(...C.lightBlue)
        pdf.roundedRect(margin, y, cw, 26, 3, 3, 'F')
        pdf.setDrawColor(...C.gray200)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(margin, y, cw, 26, 3, 3, 'S')

        // Score badge
        pdf.setFillColor(...C.blue)
        pdf.circle(margin + 14, y + 13, 10, 'F')
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.white)
        pdf.text(`${result.score.total}`, margin + 14, y + 17, { align: 'center' })

        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray400)
        pdf.text('/100', margin + 20, y + 23)

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(`Grade: ${result.score.grade}  —  ${result.score.label}`, margin + 30, y + 11)

        if (result.score.breakdown) {
          const breakdown = Object.entries(result.score.breakdown)
          const bw = (cw - 34) / breakdown.length - 2
          breakdown.forEach(([, item], i) => {
            const bx = margin + 30 + i * (bw + 2)
            pdf.setFontSize(6.5)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...C.gray400)
            pdf.text(item.label.split(' ')[0].toUpperCase(), bx, y + 19)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...C.blue)
            pdf.text(`${item.score}/${item.max}`, bx, y + 24)
            pdf.setFillColor(...C.gray200)
            pdf.roundedRect(bx, y + 25, bw, 1.5, 0.5, 0.5, 'F')
            pdf.setFillColor(...C.blue)
            pdf.roundedRect(bx, y + 25, bw * (item.score / item.max), 1.5, 0.5, 0.5, 'F')
          })
        }
        y += 34
      }

      // ── KEY INSIGHTS ───────────────────────────────────────────
      if (result.insights?.length > 0) {
        y = checkPage(y, 50)
        y = sectionTitle(pdf, 'KEY INSIGHTS', y)

        result.insights.forEach((insight, i) => {
          y = checkPage(y, 20)
          const lines = pdf.splitTextToSize(insight, cw - 16)
          const boxH  = lines.length * 5 + 10

          pdf.setFillColor(...C.offWhite)
          pdf.roundedRect(margin, y, cw, boxH, 2, 2, 'F')
          pdf.setDrawColor(...C.gray200)
          pdf.setLineWidth(0.2)
          pdf.roundedRect(margin, y, cw, boxH, 2, 2, 'S')

          // number badge
          pdf.setFillColor(...C.blue)
          pdf.circle(margin + 5, y + boxH / 2, 3.5, 'F')
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.white)
          pdf.text(`${i + 1}`, margin + 5, y + boxH / 2 + 2, { align: 'center' })

          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...C.gray700)
          pdf.text(lines, margin + 12, y + 7)
          y += boxH + 3
        })
        y += 4
      }

      // ── INDIVIDUAL STOCKS TABLE ────────────────────────────────
      y = checkPage(y, 50)
      y = sectionTitle(pdf, 'INDIVIDUAL STOCKS', y)

      const cols = ['Stock', 'Weight %', 'Return %', 'Volatility %', 'Beta', 'Risk Contrib %']
      const colW = [32, 26, 28, 30, 22, 28]

      pdf.setFillColor(...C.blueDark)
      pdf.roundedRect(margin, y, cw, 8, 2, 2, 'F')
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.white)
      let cx = margin + 3
      cols.forEach((col, i) => { pdf.text(col, cx, y + 5.5); cx += colW[i] })
      y += 8

      result.stocks.forEach((stock, idx) => {
        y = checkPage(y, 12)
        pdf.setFillColor(...(idx % 2 === 0 ? C.offWhite : C.white))
        pdf.rect(margin, y, cw, 8, 'F')
        pdf.setDrawColor(...C.gray200)
        pdf.setLineWidth(0.1)
        pdf.rect(margin, y, cw, 8, 'S')

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
          if (i === 0)      pdf.setTextColor(...C.blueDark)
          else if (i === 2) pdf.setTextColor(...(stock.annual_return >= 0 ? C.green : C.red))
          else              pdf.setTextColor(...C.gray700)
          pdf.text(val, cx, y + 5.5)
          cx += colW[i]
        })
        y += 8
      })
      y += 8

      // ── RETURN VS VOLATILITY CHART (drawn in PDF) ──────────────
      y = checkPage(y, 70)
      y = sectionTitle(pdf, 'RETURN vs VOLATILITY', y)

      const chartX = margin
      const chartY = y
      const chartW = cw
      const chartH = 55
      const padL = 18, padB = 12, padT = 6, padR = 8

      const plotX = chartX + padL
      const plotY = chartY + padT
      const plotW = chartW - padL - padR
      const plotH = chartH - padB - padT

      // chart background
      pdf.setFillColor(...C.offWhite)
      pdf.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'F')
      pdf.setDrawColor(...C.gray200)
      pdf.setLineWidth(0.2)
      pdf.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'S')

      const risks    = result.stocks.map(s => s.annual_volatility)
      const returns  = result.stocks.map(s => s.annual_return)
      const minR     = Math.min(...risks)   - 2
      const maxR     = Math.max(...risks)   + 2
      const minRet   = Math.min(...returns) - 3
      const maxRet   = Math.max(...returns) + 3

      const toChartX = v => plotX + ((v - minR)   / (maxR   - minR))   * plotW
      const toChartY = v => plotY + plotH - ((v - minRet) / (maxRet - minRet)) * plotH

      // grid lines
      pdf.setDrawColor(...C.gray200)
      pdf.setLineWidth(0.15)
      for (let g = 0; g <= 4; g++) {
        const gy = plotY + (g / 4) * plotH
        pdf.line(plotX, gy, plotX + plotW, gy)
        const label = (maxRet - (g / 4) * (maxRet - minRet)).toFixed(0)
        pdf.setFontSize(5.5)
        pdf.setTextColor(...C.gray400)
        pdf.text(`${label}%`, chartX + 1, gy + 1.5)
      }

      // zero line
      const zeroY = toChartY(0)
      if (zeroY > plotY && zeroY < plotY + plotH) {
        pdf.setDrawColor(...C.gray400)
        pdf.setLineWidth(0.3)
        pdf.setLineDashPattern([2, 1], 0)
        pdf.line(plotX, zeroY, plotX + plotW, zeroY)
        pdf.setLineDashPattern([], 0)
      }

      // dots + labels
      const dotColors = [C.blue, C.green, C.orange, C.purple, C.teal, C.red,
                         [236,72,153],[16,185,129],[245,158,11],[99,102,241]]
      result.stocks.forEach((stock, i) => {
        const dx = toChartX(stock.annual_volatility)
        const dy = toChartY(stock.annual_return)
        const col = dotColors[i % dotColors.length]
        pdf.setFillColor(...col)
        pdf.circle(dx, dy, 3, 'F')
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...col)
        pdf.text(stock.ticker.replace('.NS',''), dx + 4, dy + 1.5)
      })

      // x-axis labels
      pdf.setFontSize(5.5)
      pdf.setTextColor(...C.gray400)
      for (let g = 0; g <= 4; g++) {
        const gx = plotX + (g / 4) * plotW
        const label = (minR + (g / 4) * (maxR - minR)).toFixed(0)
        pdf.text(`${label}%`, gx - 2, chartY + chartH - 1)
      }
      pdf.setFontSize(7)
      pdf.setTextColor(...C.gray400)
      pdf.text('Volatility (Risk) %', plotX + plotW / 2 - 10, chartY + chartH + 1)

      y += chartH + 8

      // ── PORTFOLIO ALLOCATION ───────────────────────────────────
      y = checkPage(y, 55)
      y = sectionTitle(pdf, 'PORTFOLIO ALLOCATION', y)

      const alloc = result.stocks
      const total = alloc.reduce((s, st) => s + st.weight, 0)
      const pieColors = dotColors
      const pieX = margin + 25
      const pieY = y + 25
      const pieR = 22
      let startAngle = -Math.PI / 2

      alloc.forEach((stock, i) => {
        const slice = (stock.weight / total) * 2 * Math.PI
        const endAngle = startAngle + slice
        const midAngle = startAngle + slice / 2

        // draw pie slice as triangle approximation using lines
        pdf.setFillColor(...pieColors[i % pieColors.length])
        const steps = Math.max(3, Math.round(slice * 20))
        const pts = [[pieX, pieY]]
        for (let s = 0; s <= steps; s++) {
          const a = startAngle + (s / steps) * slice
          pts.push([pieX + pieR * Math.cos(a), pieY + pieR * Math.sin(a)])
        }
        // draw as filled polygon
        pdf.setLineWidth(0.1)
        pdf.setDrawColor(...C.white)
        // fill using moveTo approach via lines
        for (let s = 0; s < steps; s++) {
          const a1 = startAngle + (s / steps) * slice
          const a2 = startAngle + ((s + 1) / steps) * slice
          pdf.triangle(
            pieX, pieY,
            pieX + pieR * Math.cos(a1), pieY + pieR * Math.sin(a1),
            pieX + pieR * Math.cos(a2), pieY + pieR * Math.sin(a2),
            'F'
          )
        }
        startAngle = endAngle
      })

      // white center circle (donut effect)
      pdf.setFillColor(...C.white)
      pdf.circle(pieX, pieY, pieR * 0.5, 'F')
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.blueDark)
      pdf.text('Alloc', pieX, pieY + 1.5, { align: 'center' })

      // Legend
      const legX = margin + 58
      alloc.forEach((stock, i) => {
        const ly = y + i * 9
        pdf.setFillColor(...pieColors[i % pieColors.length])
        pdf.roundedRect(legX, ly + 1, 8, 5, 1, 1, 'F')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(stock.ticker.replace('.NS',''), legX + 11, ly + 5.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(`${stock.weight}%`, legX + 50, ly + 5.5)
      })

      y += Math.max(52, alloc.length * 9 + 10)

      // ── RISK CONTRIBUTION ─────────────────────────────────────
      y = checkPage(y, 40)
      y = sectionTitle(pdf, 'RISK CONTRIBUTION', y)

      result.stocks.forEach((stock, i) => {
        y = checkPage(y, 10)
        const barW = (cw - 60) * (stock.risk_contribution_pct / 100)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(stock.ticker.replace('.NS',''), margin, y + 5)
        pdf.setFillColor(...C.gray200)
        pdf.roundedRect(margin + 32, y + 1, cw - 60, 5, 1, 1, 'F')
        pdf.setFillColor(...pieColors[i % pieColors.length])
        pdf.roundedRect(margin + 32, y + 1, barW, 5, 1, 1, 'F')
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(`${stock.risk_contribution_pct.toFixed(1)}%`, margin + cw - 26, y + 5.5)
        y += 9
      })
      y += 6

      // ── BENCHMARK COMPARISON ──────────────────────────────────
      if (benchData) {
        y = checkPage(y, 35)
        y = sectionTitle(pdf, 'BENCHMARK COMPARISON vs NIFTY 50', y)

        const portLast  = benchData.portfolio[benchData.portfolio.length - 1]
        const niftyLast = benchData.nifty50[benchData.nifty50.length - 1]
        const diff      = (portLast - niftyLast).toFixed(2)
        const beating   = portLast > niftyLast

        pdf.setFillColor(...(beating ? C.greenBg : C.redBg))
        pdf.roundedRect(margin, y, cw, 22, 3, 3, 'F')
        pdf.setDrawColor(...(beating ? C.green : C.red))
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, cw, 22, 3, 3, 'S')
        pdf.setFillColor(...(beating ? C.green : C.red))
        pdf.roundedRect(margin, y, 3, 22, 1, 1, 'F')

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...(beating ? C.green : C.red))
        pdf.text(
          beating
            ? `Outperforming NIFTY 50 by ${Math.abs(diff)}%`
            : `Underperforming NIFTY 50 by ${Math.abs(diff)}%`,
          margin + 8, y + 10
        )
        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(
          `Your Portfolio: ${portLast > 0 ? '+' : ''}${portLast}%   |   NIFTY 50: ${niftyLast > 0 ? '+' : ''}${niftyLast}%`,
          margin + 8, y + 17
        )
        y += 30
      }

      // ── PORTFOLIO OPTIMIZATION WEIGHTS ────────────────────────
      if (optData) {
        y = checkPage(y, 60)
        y = sectionTitle(pdf, 'OPTIMAL PORTFOLIO WEIGHTS', y)

        // Max Sharpe
        pdf.setFillColor(...C.amberBg)
        pdf.roundedRect(margin, y, cw, 28, 3, 3, 'F')
        pdf.setDrawColor(...C.amber)
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, cw, 28, 3, 3, 'S')
        pdf.setFillColor(...C.amber)
        pdf.roundedRect(margin, y, 3, 28, 1, 1, 'F')

        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.amber)
        pdf.text('MAX SHARPE RATIO  —  Best Risk-Adjusted Return', margin + 7, y + 8)
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(
          `Return: ${optData.max_sharpe.return.toFixed(2)}%   |   Risk: ${optData.max_sharpe.risk.toFixed(2)}%`,
          margin + 7, y + 14
        )

        // weight badges
        const sharpeWeights = Object.entries(optData.best_sharpe_weights)
        let wx = margin + 7
        sharpeWeights.forEach(([ticker, weight]) => {
          const label = `${ticker}: ${weight}%`
          const tw = pdf.getTextWidth(label) + 6
          pdf.setFillColor(...C.white)
          pdf.roundedRect(wx, y + 17, tw, 7, 1.5, 1.5, 'F')
          pdf.setDrawColor(...C.amber)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(wx, y + 17, tw, 7, 1.5, 1.5, 'S')
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.amber)
          pdf.text(label, wx + 3, y + 22.5)
          wx += tw + 3
          if (wx > margin + cw - 20) { wx = margin + 7 }
        })
        y += 33

        // Min Variance
        y = checkPage(y, 35)
        pdf.setFillColor(...C.tealBg)
        pdf.roundedRect(margin, y, cw, 28, 3, 3, 'F')
        pdf.setDrawColor(...C.teal)
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, cw, 28, 3, 3, 'S')
        pdf.setFillColor(...C.teal)
        pdf.roundedRect(margin, y, 3, 28, 1, 1, 'F')

        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.teal)
        pdf.text('MINIMUM VARIANCE  —  Lowest Possible Risk', margin + 7, y + 8)
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(
          `Return: ${optData.min_variance.return.toFixed(2)}%   |   Risk: ${optData.min_variance.risk.toFixed(2)}%`,
          margin + 7, y + 14
        )

        const minVarWeights = Object.entries(optData.min_variance_weights || {})
        wx = margin + 7
        minVarWeights.forEach(([ticker, weight]) => {
          const label = `${ticker}: ${weight}%`
          const tw = pdf.getTextWidth(label) + 6
          pdf.setFillColor(...C.white)
          pdf.roundedRect(wx, y + 17, tw, 7, 1.5, 1.5, 'F')
          pdf.setDrawColor(...C.teal)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(wx, y + 17, tw, 7, 1.5, 1.5, 'S')
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.teal)
          pdf.text(label, wx + 3, y + 22.5)
          wx += tw + 3
          if (wx > margin + cw - 20) { wx = margin + 7 }
        })
        y += 33
      }

      // ── VAR SECTION — CVaR + Modified VaR only ────────────────
      if (varData) {
        y = checkPage(y, 65)
        y = sectionTitle(pdf, 'VALUE AT RISK', y)

        // compute portfolio total invested
        const portValue = result.stocks.reduce((s, st) => {
          return s + (st.weight / 100) * 100000
        }, 0)
        // we'll show % and derive INR amount from weights
        // Better: show as % and note user should multiply by portfolio value
        // We will use a reference note

        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(...C.gray400)
        pdf.text(
          'Amounts shown are per ₹1,00,000 of portfolio value. Scale proportionally for your actual portfolio.',
          margin, y
        )
        y += 6

        const levels  = ['90', '95', '99']
        const varW    = (cw - 6) / 3

        levels.forEach((level, i) => {
          if (!varData[level]) return
          const x    = margin + i * (varW + 3)
          const vd   = varData[level]
          const ref  = 100000

          pdf.setFillColor(...C.redBg)
          pdf.roundedRect(x, y, varW, 42, 3, 3, 'F')
          pdf.setDrawColor(...C.red)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(x, y, varW, 42, 3, 3, 'S')
          pdf.setFillColor(...C.red)
          pdf.rect(x, y, varW, 2, 'F')

          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.red)
          pdf.text(`${level}% Confidence`, x + 4, y + 9)

          pdf.setDrawColor(...C.gray200)
          pdf.setLineWidth(0.2)
          pdf.line(x + 4, y + 11, x + varW - 4, y + 11)

          const rows = [
            {
              label   : 'CVaR (Expected Shortfall)',
              pct     : vd.cvar,
              amount  : ((vd.cvar / 100) * ref).toFixed(0),
            },
            {
              label   : 'Modified VaR (Cornish-Fisher)',
              pct     : vd.parametric_var,
              amount  : ((vd.parametric_var / 100) * ref).toFixed(0),
            },
          ]

          rows.forEach((row, ri) => {
            const ry = y + 15 + ri * 13
            pdf.setFontSize(7)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...C.gray700)
            pdf.text(row.label, x + 4, ry)
            pdf.setFontSize(8.5)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...C.red)
            pdf.text(`${row.pct}%`, x + 4, ry + 6)
            pdf.setFontSize(7.5)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...C.gray700)
            pdf.text(
              `₹${parseInt(row.amount).toLocaleString('en-IN')} per ₹1L`,
              x + 4, ry + 11
            )
          })
        })
        y += 50
      }

      // ── FOOTER ON ALL PAGES ────────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p)
        pdf.setFillColor(...C.blueDark)
        pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F')
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.white)
        pdf.text('Finvra', margin, pageHeight - 5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(180, 210, 255)
        pdf.text('— Equity Portfolio Analysis — finvra.vercel.app', margin + 10, pageHeight - 5)
        pdf.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' })
        pdf.setFontSize(6.5)
        pdf.setTextColor(150, 180, 220)
        pdf.text('Not financial advice. For informational purposes only.', margin, pageHeight - 1.5)
      }

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
        display      : 'flex',
        alignItems   : 'center',
        gap          : '8px',
        padding      : '10px 20px',
        background   : exporting
          ? '#F1F5F9'
          : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
        border       : 'none',
        borderRadius : '10px',
        color        : exporting ? '#94A3B8' : '#FFFFFF',
        fontSize     : '13px',
        fontWeight   : '700',
        cursor       : exporting ? 'not-allowed' : 'pointer',
        boxShadow    : exporting ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
        transition   : 'all 0.2s',
        letterSpacing: '0.3px',
      }}
    >
      {exporting ? '⏳ Generating PDF...' : '📄 Export PDF Report'}
    </button>
  )
}