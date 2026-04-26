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
      const cw         = pageWidth - margin * 2

      // ── PALETTE ──────────────────────────────────────────────
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
        orange    : [234,  88,  12],
        orangeBg  : [255, 247, 237],
        purple    : [109,  40, 217],
        purpleBg  : [245, 243, 255],
        teal      : [13,  148, 136],
        tealBg    : [240, 253, 250],
        amber     : [180, 120,  10],
        amberBg   : [255, 251, 235],
      }

      const dotColors = [
        C.blue, C.green, C.orange, C.purple, C.teal, C.red,
        [236,72,153],[16,185,129],[245,158,11],[99,102,241],
      ]

      // ── HELPERS ───────────────────────────────────────────────
      const initPage = () => {
        pdf.setFillColor(...C.white)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
        pdf.setFillColor(...C.blueDark)
        pdf.rect(0, 0, pageWidth, 8, 'F')
      }

      const newPage = () => {
        pdf.addPage()
        initPage()
        return 16
      }

      const checkPage = (y, needed = 30) => {
        if (y > pageHeight - needed - 16) return newPage()
        return y
      }

      const sectionTitle = (y, text) => {
        pdf.setFillColor(...C.blue)
        pdf.rect(margin, y, 3, 7, 'F')
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(text, margin + 6, y + 5.5)
        return y + 12
      }

      const rupee = (n) => {
        // Use Rs. to avoid encoding issues
        return `Rs.${parseInt(n).toLocaleString('en-IN')}`
      }

      const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      // ── PAGE 1 SETUP ─────────────────────────────────────────
      pdf.setFillColor(...C.white)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // ── HEADER ────────────────────────────────────────────────
      pdf.setFillColor(...C.blueDark)
      pdf.rect(0, 0, pageWidth, 38, 'F')
      pdf.setFillColor(...C.blue)
      pdf.triangle(pageWidth - 55, 0, pageWidth, 0, pageWidth, 38, 'F')

      pdf.setFontSize(22)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.white)
      pdf.text('Finvra', margin, 19)
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(180, 210, 255)
      pdf.text('PORTFOLIO ANALYTICS', margin, 26)

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.white)
      pdf.text('Equity Portfolio Analysis Report', pageWidth - margin, 16, { align: 'right' })
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(180, 210, 255)
      pdf.text(`Generated: ${date}`, pageWidth - margin, 23, { align: 'right' })

      let y = 46

      // ── SUMMARY CARDS ─────────────────────────────────────────
      y = sectionTitle(y, 'PORTFOLIO SUMMARY')

      const summary = result.summary
      const cards = [
        {
          label : 'Annual Return',
          value : `${summary.annual_return_pct > 0 ? '+' : ''}${summary.annual_return_pct}%`,
          color : summary.annual_return_pct >= 0 ? C.green : C.red,
          bg    : summary.annual_return_pct >= 0 ? C.greenBg : C.redBg,
          bdr   : summary.annual_return_pct >= 0 ? C.green : C.red,
        },
        { label: 'Volatility',    value: `${summary.annual_volatility_pct}%`, color: C.orange, bg: C.orangeBg, bdr: C.orange },
        { label: 'Sharpe Ratio',  value: summary.sharpe_ratio.toFixed(2),     color: C.blue,   bg: C.lightBlue, bdr: C.blueMid },
        { label: 'Portfolio Beta',value: summary.portfolio_beta.toFixed(2),   color: C.purple, bg: C.purpleBg,  bdr: C.purple },
      ]

      const cardW = (cw - 9) / 4
      cards.forEach((card, i) => {
        const x = margin + i * (cardW + 3)
        pdf.setFillColor(...card.bg)
        pdf.roundedRect(x, y, cardW, 24, 2, 2, 'F')
        pdf.setDrawColor(...card.bdr)
        pdf.setLineWidth(0.4)
        pdf.roundedRect(x, y, cardW, 24, 2, 2, 'S')
        pdf.setFillColor(...card.color)
        pdf.rect(x, y, cardW, 2.5, 'F')
        pdf.setFontSize(6.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray400)
        pdf.text(card.label.toUpperCase(), x + 4, y + 10)
        pdf.setFontSize(15)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...card.color)
        pdf.text(card.value, x + 4, y + 20)
      })
      y += 32

      // ── HEALTH SCORE ──────────────────────────────────────────
      if (result.score) {
        y = checkPage(y, 38)
        y = sectionTitle(y, 'PORTFOLIO HEALTH SCORE')

        pdf.setFillColor(...C.lightBlue)
        pdf.roundedRect(margin, y, cw, 28, 3, 3, 'F')
        pdf.setDrawColor(...C.gray200)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(margin, y, cw, 28, 3, 3, 'S')

        pdf.setFillColor(...C.blue)
        pdf.circle(margin + 15, y + 14, 11, 'F')
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.white)
        pdf.text(`${result.score.total}`, margin + 15, y + 18, { align: 'center' })
        pdf.setFontSize(6.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray400)
        pdf.text('/100', margin + 21, y + 26)

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(`Grade: ${result.score.grade}  —  ${result.score.label}`, margin + 32, y + 12)

        if (result.score.breakdown) {
          const breakdown = Object.entries(result.score.breakdown)
          const bw = (cw - 36) / breakdown.length - 2
          breakdown.forEach(([, item], i) => {
            const bx = margin + 32 + i * (bw + 2)
            pdf.setFontSize(6)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(...C.gray400)
            pdf.text(item.label.split(' ')[0].toUpperCase(), bx, y + 20)
            pdf.setFontSize(7.5)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(...C.blue)
            pdf.text(`${item.score}/${item.max}`, bx, y + 26)
            pdf.setFillColor(...C.gray200)
            pdf.roundedRect(bx, y + 27, bw, 1.5, 0.5, 0.5, 'F')
            pdf.setFillColor(...C.blue)
            pdf.roundedRect(bx, y + 27, Math.max(0, bw * (item.score / item.max)), 1.5, 0.5, 0.5, 'F')
          })
        }
        y += 36
      }

      // ── KEY INSIGHTS ──────────────────────────────────────────
      if (result.insights?.length > 0) {
        y = checkPage(y, 50)
        y = sectionTitle(y, 'KEY INSIGHTS')

        result.insights.forEach((insight, i) => {
          const lines = pdf.splitTextToSize(insight, cw - 16)
          const boxH  = lines.length * 5 + 12
          y = checkPage(y, boxH + 4)

          pdf.setFillColor(...C.offWhite)
          pdf.roundedRect(margin, y, cw, boxH, 2, 2, 'F')
          pdf.setDrawColor(...C.gray200)
          pdf.setLineWidth(0.2)
          pdf.roundedRect(margin, y, cw, boxH, 2, 2, 'S')
          pdf.setFillColor(...C.blue)
          pdf.circle(margin + 5.5, y + boxH / 2, 3.5, 'F')
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.white)
          pdf.text(`${i + 1}`, margin + 5.5, y + boxH / 2 + 2, { align: 'center' })
          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...C.gray700)
          pdf.text(lines, margin + 13, y + 8)
          y += boxH + 4
        })
        y += 2
      }

      // ── INDIVIDUAL STOCKS TABLE ───────────────────────────────
      y = checkPage(y, 50)
      y = sectionTitle(y, 'INDIVIDUAL STOCKS')

      const cols = ['Stock', 'Weight', 'Return', 'Volatility', 'Beta', 'Risk Contrib']
      const colW = [34, 24, 26, 28, 20, 28]

      // Draw header — always on same page as first row
      const drawTableHeader = (yy) => {
        pdf.setFillColor(...C.blueDark)
        pdf.roundedRect(margin, yy, cw, 8, 2, 2, 'F')
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.white)
        let cx = margin + 3
        cols.forEach((col, i) => { pdf.text(col, cx, yy + 5.5); cx += colW[i] })
        return yy + 8
      }

      y = drawTableHeader(y)

      result.stocks.forEach((stock, idx) => {
        // If row would overflow, start new page with header
        if (y > pageHeight - 22) {
          y = newPage()
          y = drawTableHeader(y)
        }

        pdf.setFillColor(...(idx % 2 === 0 ? C.offWhite : C.white))
        pdf.rect(margin, y, cw, 8, 'F')
        pdf.setDrawColor(...C.gray200)
        pdf.setLineWidth(0.1)
        pdf.rect(margin, y, cw, 8, 'S')

        const rowData = [
          stock.ticker.replace('.NS', ''),
          `${stock.weight}%`,
          `${stock.annual_return > 0 ? '+' : ''}${stock.annual_return}%`,
          `${stock.annual_volatility}%`,
          stock.beta.toFixed(2),
          `${stock.risk_contribution_pct.toFixed(1)}%`,
        ]
        let cx = margin + 3
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
      y += 10

      // ── RETURN VS VOLATILITY ──────────────────────────────────
      y = checkPage(y, 75)
      y = sectionTitle(y, 'RETURN vs VOLATILITY')

      const cX  = margin
      const cY  = y
      const cW  = cw
      const cH  = 60
      const pL  = 22, pB = 14, pT = 6, pR = 6
      const pX  = cX + pL
      const pY  = cY + pT
      const pW  = cW - pL - pR
      const pH  = cH - pB - pT

      pdf.setFillColor(...C.offWhite)
      pdf.roundedRect(cX, cY, cW, cH, 2, 2, 'F')
      pdf.setDrawColor(...C.gray200)
      pdf.setLineWidth(0.2)
      pdf.roundedRect(cX, cY, cW, cH, 2, 2, 'S')

      const risks   = result.stocks.map(s => parseFloat(s.annual_volatility))
      const rets    = result.stocks.map(s => parseFloat(s.annual_return))
      const minRisk = Math.min(...risks)   - 3
      const maxRisk = Math.max(...risks)   + 3
      const minRet  = Math.min(...rets)    - 4
      const maxRet  = Math.max(...rets)    + 4

      const toX = v => pX + ((v - minRisk) / (maxRisk - minRisk)) * pW
      const toY = v => pY + pH - ((v - minRet) / (maxRet - minRet)) * pH

      // Grid lines
      pdf.setLineWidth(0.15)
      for (let g = 0; g <= 4; g++) {
        const gy = pY + (g / 4) * pH
        pdf.setDrawColor(...C.gray200)
        pdf.line(pX, gy, pX + pW, gy)
        const val = maxRet - (g / 4) * (maxRet - minRet)
        pdf.setFontSize(5.5)
        pdf.setTextColor(...C.gray400)
        pdf.text(`${val.toFixed(0)}%`, cX + 1, gy + 1.5)
      }
      for (let g = 0; g <= 4; g++) {
        const gx = pX + (g / 4) * pW
        pdf.setDrawColor(...C.gray200)
        pdf.line(gx, pY, gx, pY + pH)
        const val = minRisk + (g / 4) * (maxRisk - minRisk)
        pdf.setFontSize(5.5)
        pdf.setTextColor(...C.gray400)
        pdf.text(`${val.toFixed(0)}%`, gx - 3, cY + cH - 2)
      }

      // Zero line
      const zeroY = toY(0)
      if (zeroY > pY && zeroY < pY + pH) {
        pdf.setDrawColor(...C.gray400)
        pdf.setLineWidth(0.3)
        pdf.setLineDashPattern([2, 1], 0)
        pdf.line(pX, zeroY, pX + pW, zeroY)
        pdf.setLineDashPattern([], 0)
      }

      // Axis labels
      pdf.setFontSize(6.5)
      pdf.setTextColor(...C.gray400)
      pdf.text('Volatility (Risk) %', pX + pW / 2 - 12, cY + cH)
      pdf.setFontSize(6)
      pdf.text('Return %', cX, pY + pH / 2, { angle: 90 })

      // Dots + labels
      result.stocks.forEach((stock, i) => {
        const dx  = toX(parseFloat(stock.annual_volatility))
        const dy  = toY(parseFloat(stock.annual_return))
        const col = dotColors[i % dotColors.length]
        pdf.setFillColor(...col)
        pdf.circle(dx, dy, 2.8, 'F')
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...col)
        const label = stock.ticker.replace('.NS', '')
        // Offset label to avoid overlap
        const lx = dx + 3.5
        const ly = dy - 1
        pdf.text(label, lx, ly)
      })
      y += cH + 10

      // ── PORTFOLIO ALLOCATION ──────────────────────────────────
      y = checkPage(y, 65)
      y = sectionTitle(y, 'PORTFOLIO ALLOCATION')

      const alloc  = result.stocks
      const pieX   = margin + 28
      const pieY   = y + 28
      const pieR   = 24
      let startAng = -Math.PI / 2

      alloc.forEach((stock, i) => {
        const slice    = (stock.weight / 100) * 2 * Math.PI
        const steps    = Math.max(4, Math.round(slice * 24))
        const col      = dotColors[i % dotColors.length]
        pdf.setFillColor(...col)
        pdf.setDrawColor(...C.white)
        pdf.setLineWidth(0.4)
        for (let s = 0; s < steps; s++) {
          const a1 = startAng + (s / steps) * slice
          const a2 = startAng + ((s + 1) / steps) * slice
          pdf.triangle(
            pieX, pieY,
            pieX + pieR * Math.cos(a1), pieY + pieR * Math.sin(a1),
            pieX + pieR * Math.cos(a2), pieY + pieR * Math.sin(a2),
            'FD'
          )
        }
        startAng += slice
      })

      // White donut center
      pdf.setFillColor(...C.white)
      pdf.circle(pieX, pieY, pieR * 0.48, 'F')
      pdf.setFontSize(6.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C.blueDark)
      pdf.text('Alloc', pieX, pieY + 2, { align: 'center' })

      // Legend — 2 columns
      const legX1 = margin + 62
      const legX2 = legX1 + 62
      alloc.forEach((stock, i) => {
        const col   = dotColors[i % dotColors.length]
        const legX  = i < Math.ceil(alloc.length / 2) ? legX1 : legX2
        const legY  = y + (i < Math.ceil(alloc.length / 2) ? i : i - Math.ceil(alloc.length / 2)) * 10
        pdf.setFillColor(...col)
        pdf.roundedRect(legX, legY + 1.5, 7, 5, 1, 1, 'F')
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(stock.ticker.replace('.NS', ''), legX + 10, legY + 5.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(`${stock.weight}%`, legX + 48, legY + 5.5)
      })

      y += Math.max(58, Math.ceil(alloc.length / 2) * 10 + 14)

      // ── RISK CONTRIBUTION ─────────────────────────────────────
      y = checkPage(y, 40)
      y = sectionTitle(y, 'RISK CONTRIBUTION')

      result.stocks.forEach((stock, i) => {
        y = checkPage(y, 12)
        const barMaxW = cw - 58
        const barW    = barMaxW * (stock.risk_contribution_pct / 100)
        const col     = dotColors[i % dotColors.length]

        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.blueDark)
        pdf.text(stock.ticker.replace('.NS', ''), margin, y + 5)

        pdf.setFillColor(...C.gray100)
        pdf.roundedRect(margin + 32, y + 1, barMaxW, 5.5, 1, 1, 'F')
        pdf.setFillColor(...col)
        pdf.roundedRect(margin + 32, y + 1, Math.max(1, barW), 5.5, 1, 1, 'F')

        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(`${stock.risk_contribution_pct.toFixed(1)}%`, margin + cw - 22, y + 5.5)
        y += 10
      })
      y += 6

      // ── BENCHMARK COMPARISON ──────────────────────────────────
      if (benchData) {
        y = checkPage(y, 35)
        y = sectionTitle(y, 'BENCHMARK COMPARISON vs NIFTY 50')

        const portLast  = benchData.portfolio[benchData.portfolio.length - 1]
        const niftyLast = benchData.nifty50[benchData.nifty50.length - 1]
        const diff      = Math.abs(portLast - niftyLast).toFixed(2)
        const beating   = portLast > niftyLast

        pdf.setFillColor(...(beating ? C.greenBg : C.redBg))
        pdf.roundedRect(margin, y, cw, 24, 3, 3, 'F')
        pdf.setDrawColor(...(beating ? C.green : C.red))
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, cw, 24, 3, 3, 'S')
        pdf.setFillColor(...(beating ? C.green : C.red))
        pdf.rect(margin, y, 3, 24, 'F')

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...(beating ? C.green : C.red))
        pdf.text(
          beating
            ? `Outperforming NIFTY 50 by ${diff}%`
            : `Underperforming NIFTY 50 by ${diff}%`,
          margin + 8, y + 11
        )
        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(
          `Your Portfolio: ${portLast > 0 ? '+' : ''}${portLast}%   |   NIFTY 50: ${niftyLast > 0 ? '+' : ''}${niftyLast}%`,
          margin + 8, y + 19
        )
        y += 32
      }

      // ── OPTIMAL PORTFOLIO WEIGHTS ─────────────────────────────
      if (optData) {
        y = checkPage(y, 70)
        y = sectionTitle(y, 'OPTIMAL PORTFOLIO WEIGHTS')

        // ── Max Sharpe ──
        const sharpeWeights = Object.entries(optData.best_sharpe_weights || {})
        const sharpeRows    = Math.ceil(sharpeWeights.length / 3)
        const sharpeBoxH    = 22 + sharpeRows * 10

        y = checkPage(y, sharpeBoxH + 6)
        pdf.setFillColor(...C.amberBg)
        pdf.roundedRect(margin, y, cw, sharpeBoxH, 3, 3, 'F')
        pdf.setDrawColor(...C.amber)
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, cw, sharpeBoxH, 3, 3, 'S')
        pdf.setFillColor(...C.amber)
        pdf.rect(margin, y, 3, sharpeBoxH, 'F')

        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.amber)
        pdf.text('MAX SHARPE RATIO  —  Best Risk-Adjusted Return', margin + 7, y + 8)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(
          `Return: ${optData.max_sharpe.return.toFixed(2)}%   |   Risk: ${optData.max_sharpe.risk.toFixed(2)}%`,
          margin + 7, y + 15
        )

        // Weight badges in rows of 3
        const badgeW = (cw - 14) / 3 - 3
        sharpeWeights.forEach(([ticker, weight], i) => {
          const col  = i % 3
          const row  = Math.floor(i / 3)
          const bx   = margin + 7 + col * (badgeW + 3)
          const by   = y + 20 + row * 10

          pdf.setFillColor(...C.white)
          pdf.roundedRect(bx, by, badgeW, 7, 1.5, 1.5, 'F')
          pdf.setDrawColor(...C.amber)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(bx, by, badgeW, 7, 1.5, 1.5, 'S')
          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.amber)
          pdf.text(
            `${ticker.replace('.NS','')}: ${weight}%`,
            bx + badgeW / 2, by + 5, { align: 'center' }
          )
        })
        y += sharpeBoxH + 6

        // ── Min Variance ──
        const minVarWeights = Object.entries(optData.min_variance_weights || {})
        const minRows       = Math.ceil(minVarWeights.length / 3)
        const minBoxH       = 22 + minRows * 10

        y = checkPage(y, minBoxH + 6)
        pdf.setFillColor(...C.tealBg)
        pdf.roundedRect(margin, y, cw, minBoxH, 3, 3, 'F')
        pdf.setDrawColor(...C.teal)
        pdf.setLineWidth(0.4)
        pdf.roundedRect(margin, y, cw, minBoxH, 3, 3, 'S')
        pdf.setFillColor(...C.teal)
        pdf.rect(margin, y, 3, minBoxH, 'F')

        pdf.setFontSize(8.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(...C.teal)
        pdf.text('MINIMUM VARIANCE  —  Lowest Possible Risk', margin + 7, y + 8)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(...C.gray700)
        pdf.text(
          `Return: ${optData.min_variance.return.toFixed(2)}%   |   Risk: ${optData.min_variance.risk.toFixed(2)}%`,
          margin + 7, y + 15
        )

        minVarWeights.forEach(([ticker, weight], i) => {
          const col  = i % 3
          const row  = Math.floor(i / 3)
          const bx   = margin + 7 + col * (badgeW + 3)
          const by   = y + 20 + row * 10

          pdf.setFillColor(...C.white)
          pdf.roundedRect(bx, by, badgeW, 7, 1.5, 1.5, 'F')
          pdf.setDrawColor(...C.teal)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(bx, by, badgeW, 7, 1.5, 1.5, 'S')
          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.teal)
          pdf.text(
            `${ticker.replace('.NS','')}: ${weight}%`,
            bx + badgeW / 2, by + 5, { align: 'center' }
          )
        })
        y += minBoxH + 6
      }

      // ── VALUE AT RISK ─────────────────────────────────────────
      if (varData) {
        y = checkPage(y, 75)
        y = sectionTitle(y, 'VALUE AT RISK  (CVaR & Modified VaR)')

        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(...C.gray400)
        pdf.text(
          'Amounts shown per Rs.1,00,000 of portfolio value. Scale for your actual portfolio value.',
          margin, y
        )
        y += 8

        const levels = ['90', '95', '99']
        const varW   = (cw - 6) / 3

        levels.forEach((level, i) => {
          if (!varData[level]) return
          const x  = margin + i * (varW + 3)
          const vd = varData[level]
          const ref = 100000

          // Card
          pdf.setFillColor(...C.redBg)
          pdf.roundedRect(x, y, varW, 48, 3, 3, 'F')
          pdf.setDrawColor(...C.red)
          pdf.setLineWidth(0.3)
          pdf.roundedRect(x, y, varW, 48, 3, 3, 'S')
          pdf.setFillColor(...C.red)
          pdf.rect(x, y, varW, 2.5, 'F')

          // Confidence level header
          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.red)
          pdf.text(`${level}% Confidence`, x + 4, y + 10)

          pdf.setDrawColor(...C.gray200)
          pdf.setLineWidth(0.2)
          pdf.line(x + 4, y + 13, x + varW - 4, y + 13)

          // CVaR row
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.gray700)
          pdf.text('CVaR (Expected Shortfall)', x + 4, y + 20)

          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.red)
          pdf.text(`${vd.cvar}%`, x + 4, y + 27)

          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...C.gray700)
          pdf.text(rupee((vd.cvar / 100) * ref) + ' per Rs.1L', x + 4, y + 33)

          pdf.setDrawColor(...C.gray200)
          pdf.setLineWidth(0.15)
          pdf.line(x + 4, y + 36, x + varW - 4, y + 36)

          // Modified VaR row
          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.gray700)
          pdf.text('Modified VaR', x + 4, y + 41)

          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C.purple)
          pdf.text(`${vd.modified_var}%`, x + 4, y + 47)

          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...C.gray700)
          // note: card height is 48, so this fits just outside — extend card
        })

        // Second pass for Modified VaR amounts (below the card)
        levels.forEach((level, i) => {
          if (!varData[level]) return
          const x  = margin + i * (varW + 3)
          const vd = varData[level]
          const ref = 100000
          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...C.gray700)
          pdf.text(rupee((vd.modified_var / 100) * ref) + ' per Rs.1L', x + 4, y + 53)
        })

        y += 60
      }

      // ── FOOTER ON ALL PAGES ───────────────────────────────────
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
        pdf.setFontSize(6)
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