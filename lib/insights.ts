import { Transaction, Insight, Budgets } from "@/types"
import { CATEGORIES_EXPENSE, MONTHS_ID, DAYS_ID } from "./constants"
import { fmt } from "./utils"

export function generateInsights(
  txs: Transaction[],
  monthTxs: Transaction[],
  budgets: Budgets,
  selectedMonth: string
): Insight[] {
  const insights: Insight[] = []
  const expenses = monthTxs.filter((t) => t.type === "expense")
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0)
  const totalInc = monthTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)

  // Savings rate
  if (totalInc > 0) {
    const rate = ((totalInc - totalExp) / totalInc) * 100
    if (rate >= 30)
      insights.push({
        type: "success",
        icon: "🏆",
        text: `Savings rate kamu ${rate.toFixed(0)}% — luar biasa! Kamu menabung lebih dari sepertiga pemasukan.`,
      })
    else if (rate >= 10)
      insights.push({
        type: "info",
        icon: "👍",
        text: `Savings rate ${rate.toFixed(0)}%. Lumayan, tapi coba target 30% untuk kesehatan keuangan ideal.`,
      })
    else if (rate >= 0)
      insights.push({
        type: "warning",
        icon: "⚠️",
        text: `Savings rate cuma ${rate.toFixed(0)}%. Hati-hati, coba kurangi pengeluaran non-essential.`,
      })
    else
      insights.push({
        type: "danger",
        icon: "🚨",
        text: `Kamu defisit ${fmt(Math.abs(totalInc - totalExp))}! Pengeluaran melebihi pemasukan bulan ini.`,
      })
  }

  // Compare with previous month
  const [y, m] = selectedMonth.split("-").map(Number)
  const prevKey = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`
  const prevExp = txs
    .filter((t) => t.date?.startsWith(prevKey) && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)
  if (prevExp > 0 && totalExp > 0) {
    const diff = ((totalExp - prevExp) / prevExp) * 100
    if (diff > 20)
      insights.push({
        type: "warning",
        icon: "📈",
        text: `Pengeluaran naik ${diff.toFixed(0)}% dari bulan lalu. Cek kategori mana yang melonjak.`,
      })
    else if (diff < -10)
      insights.push({
        type: "success",
        icon: "📉",
        text: `Bagus! Pengeluaran turun ${Math.abs(diff).toFixed(0)}% dari bulan lalu.`,
      })
  }

  // Biggest spending category
  const catMap: Record<string, number> = {}
  expenses.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  if (sorted.length > 0) {
    const [topCat, topAmt] = sorted[0]
    const pct = ((topAmt / totalExp) * 100).toFixed(0)
    const catInfo = CATEGORIES_EXPENSE.find((c) => c.name === topCat)
    insights.push({
      type: "info",
      icon: catInfo?.icon || "📊",
      text: `${topCat} mendominasi ${pct}% pengeluaran kamu (${fmt(topAmt)}).${Number(pct) > 40 ? " Ini cukup tinggi — perlu dikurangi?" : ""}`,
    })
  }

  // Biggest spending day
  const dayMap: Record<string, number> = {}
  expenses.forEach((t) => {
    dayMap[t.date] = (dayMap[t.date] || 0) + t.amount
  })
  const daysSorted = Object.entries(dayMap).sort((a, b) => b[1] - a[1])
  if (daysSorted.length > 0) {
    const [bigDay, bigAmt] = daysSorted[0]
    const d = new Date(bigDay)
    insights.push({
      type: "info",
      icon: "📅",
      text: `Hari paling boros: ${DAYS_ID[d.getDay()]} ${d.getDate()} ${MONTHS_ID[d.getMonth()]} — ${fmt(bigAmt)} dalam sehari.`,
    })
  }

  // Budget warnings
  Object.entries(budgets).forEach(([cat, limit]) => {
    const spent = catMap[cat] || 0
    const pct = (spent / limit) * 100
    if (pct >= 100)
      insights.push({
        type: "danger",
        icon: "🔴",
        text: `Budget ${cat} JEBOL! Sudah ${fmt(spent)} dari limit ${fmt(limit)} (${pct.toFixed(0)}%).`,
      })
    else if (pct >= 80)
      insights.push({
        type: "warning",
        icon: "🟡",
        text: `Budget ${cat} hampir habis: ${pct.toFixed(0)}% terpakai (sisa ${fmt(limit - spent)}).`,
      })
  })

  // End-of-month prediction
  const now = new Date()
  const [sy, sm] = selectedMonth.split("-").map(Number)
  if (sy === now.getFullYear() && sm === now.getMonth() + 1) {
    const daysInMonth = new Date(sy, sm, 0).getDate()
    const dayPassed = now.getDate()
    if (dayPassed > 3 && dayPassed < daysInMonth) {
      const dailyAvg = totalExp / dayPassed
      const predicted = dailyAvg * daysInMonth
      insights.push({
        type: "info",
        icon: "🔮",
        text: `Prediksi total pengeluaran akhir bulan: ${fmt(predicted)} (rata-rata ${fmt(dailyAvg)}/hari). ${totalInc > 0 && predicted > totalInc ? "⚠️ Bisa defisit!" : "Masih aman."}`,
      })
    }
  }

  // Average transaction
  if (expenses.length > 3) {
    const avg = totalExp / expenses.length
    insights.push({
      type: "info",
      icon: "🧮",
      text: `Rata-rata pengeluaran per transaksi: ${fmt(avg)} dari ${expenses.length} transaksi.`,
    })
  }

  return insights.slice(0, 8)
}