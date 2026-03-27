"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend,
} from "recharts"
import type { User } from "@supabase/supabase-js"

import { Transaction, Goal, Budgets } from "@/types"
import { CATEGORIES_EXPENSE, MONTHS_ID } from "@/lib/constants"
import { fmt, fmtShort, getMonthKey } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import {
  signInWithGoogle, signOut, getUser,
  loadTransactions, saveTransaction, deleteTransaction as deleteTxFromDB,
  loadBudgets, saveBudgets,
  loadGoals, saveGoal as saveGoalToDB, deleteGoalFromDB,
} from "@/lib/storage"
import { generateInsights } from "@/lib/insights"
import { exportCSV, exportJSON } from "@/lib/export"

import TxItem from "@/components/TxItem"
import TransactionForm from "@/components/TransactionForm"
import BudgetForm from "@/components/BudgetForm"
import GoalForm from "@/components/GoalForm"
import Modal from "@/components/Modal"
import ChartTooltip from "@/components/ChartTooltip"

const TABS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "transactions", icon: "📋", label: "Transaksi" },
  { id: "budget", icon: "🎯", label: "Budget" },
  { id: "goals", icon: "⭐", label: "Goals" },
  { id: "insights", icon: "🧠", label: "Insights" },
]

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budgets>({})
  const [goals, setGoals] = useState<Goal[]>([])
  const [loaded, setLoaded] = useState(false)

  const [activeTab, setActiveTab] = useState("dashboard")
  const [showTxForm, setShowTxForm] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showExport, setShowExport] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth listener
  useEffect(() => {
    getUser().then((u) => { setUser(u ?? null); setAuthLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load data when user logs in
  useEffect(() => {
    if (!user) { setLoaded(false); return }
    Promise.all([loadTransactions(), loadBudgets(selectedMonth), loadGoals()])
      .then(([tx, b, g]) => {
        setTransactions(tx)
        setBudgets(b)
        setGoals(g)
        setLoaded(true)
      })
  }, [user])

  // Reload budgets when month changes
  useEffect(() => {
    if (!user || !loaded) return
    loadBudgets(selectedMonth).then(setBudgets)
  }, [selectedMonth, user, loaded])

  // Derived data
  const monthTxs = useMemo(
    () => transactions.filter((t) => t.date?.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  )
  const totalIncome = useMemo(
    () => monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  )
  const totalExpense = useMemo(
    () => monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthTxs]
  )
  const balance = totalIncome - totalExpense

  const expByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([name, value]) => {
        const cat = CATEGORIES_EXPENSE.find((c) => c.name === name) || { color: "#94A3B8" }
        return { name, value, color: cat.color }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthTxs])

  const dailyData = useMemo(() => {
    const map: Record<number, { day: number; expense: number; income: number }> = {}
    monthTxs.forEach((t) => {
      const day = parseInt(t.date.split("-")[2])
      if (!map[day]) map[day] = { day, expense: 0, income: 0 }
      if (t.type === "expense") map[day].expense += t.amount
      else map[day].income += t.amount
    })
    const days = Object.values(map).sort((a, b) => a.day - b.day)
    let ce = 0, ci = 0
    return days.map((d) => {
      ce += d.expense; ci += d.income
      return { ...d, cumExpense: ce, cumIncome: ci }
    })
  }, [monthTxs])

  const monthlyTrend = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const mTxs = transactions.filter((t) => t.date?.startsWith(key))
      return {
        month: MONTHS_ID[d.getMonth()],
        income: mTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: mTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions])

  const sortedTxs = useMemo(
    () => [...monthTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt),
    [monthTxs]
  )

  const insights = useMemo(
    () => generateInsights(transactions, monthTxs, budgets, selectedMonth),
    [transactions, monthTxs, budgets, selectedMonth]
  )

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-")
    return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
  }, [selectedMonth])

  const budgetData = useMemo(() => {
    return Object.entries(budgets).map(([cat, limit]) => {
      const spent = expByCategory.find((e) => e.name === cat)?.value || 0
      const pct = limit > 0 ? Math.min((spent / limit) * 100, 150) : 0
      const catInfo = CATEGORIES_EXPENSE.find((c) => c.name === cat) || { icon: "📦", color: "#94A3B8" }
      return { cat, limit, spent, pct, icon: catInfo.icon, color: catInfo.color }
    }).sort((a, b) => b.pct - a.pct)
  }, [budgets, expByCategory])

  // Handlers
  const saveTx = useCallback(async (tx: Transaction) => {
    if (!user) return
    setTransactions((prev) => {
      const exists = prev.find((t) => t.id === tx.id)
      if (exists) return prev.map((t) => (t.id === tx.id ? tx : t))
      return [tx, ...prev]
    })
    await saveTransaction(tx, user.id)
  }, [user])

  const deleteTx = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    await deleteTxFromDB(id)
  }, [])

  const handleSaveBudgets = useCallback(async (newBudgets: Budgets) => {
    if (!user) return
    setBudgets(newBudgets)
    await saveBudgets(newBudgets, selectedMonth, user.id)
  }, [user, selectedMonth])

  const saveGoalHandler = useCallback(async (g: Goal) => {
    if (!user) return
    setGoals((prev) => {
      const exists = prev.find((x) => x.id === g.id)
      if (exists) return prev.map((x) => (x.id === g.id ? g : x))
      return [...prev, g]
    })
    await saveGoalToDB(g, user.id)
  }, [user])

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    await deleteGoalFromDB(id)
  }, [])

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.transactions) {
          setTransactions(data.transactions)
          for (const tx of data.transactions) {
            await saveTransaction(tx, user.id)
          }
        }
        if (data.goals) {
          setGoals(data.goals)
          for (const g of data.goals) {
            await saveGoalToDB(g, user.id)
          }
        }
        alert("Import berhasil! ✅")
      } catch {
        alert("File tidak valid ❌")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  // ══ LOGIN SCREEN ══
  if (authLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#0C0E16]">
      <div className="text-center">
        <div className="mb-3 text-4xl animate-pulse">💎</div>
        <div className="text-sm text-[#5A5E72]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Loading...</div>
      </div>
    </div>
  )

  if (!user) return (
    <div className="flex h-screen items-center justify-center bg-[#0C0E16] px-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
      <div className="w-full max-w-sm rounded-2xl border border-[#1E2030] bg-[#161825] p-8 text-center">
        <div className="mb-2 text-5xl">💎</div>
        <h1 className="mb-1 text-2xl font-extrabold text-[#E2E4EA]">DompetKu</h1>
        <p className="mb-8 text-sm text-[#5A5E72]">Smart Finance Tracker</p>
        <button
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3.5 text-sm font-semibold text-[#E2E4EA] cursor-pointer transition-all hover:border-[#6366F1]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Login dengan Google
        </button>
        <p className="mt-6 text-xs text-[#3A3E52]">Data kamu aman & tersimpan di cloud</p>
      </div>
    </div>
  )

  if (!loaded) return (
    <div className="flex h-screen items-center justify-center bg-[#0C0E16]">
      <div className="text-center">
        <div className="mb-3 text-4xl animate-pulse">💎</div>
        <div className="text-sm text-[#5A5E72]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Loading DompetKu...</div>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-[#0C0E16] text-[#E2E4EA]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#1E2030] px-5 py-4" style={{ background: "rgba(12,14,22,0.88)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg text-base" style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)" }}>💎</div>
          <div>
            <div className="text-base font-extrabold" style={{ background: "linear-gradient(135deg,#C7D2FE,#E2E4EA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DompetKu</div>
            <div className="text-[10px] font-medium text-[#5A5E72]">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rounded-lg border border-[#1E2030] bg-[#161825] px-2.5 py-1.5 text-xs text-[#E2E4EA] outline-none" />
          <button onClick={() => setShowExport(true)} className="rounded-lg border border-[#1E2030] bg-[#161825] px-2.5 py-1.5 text-xs text-[#5A5E72] cursor-pointer">⚙️</button>
          <button onClick={signOut} className="rounded-lg border border-[#F9706630] bg-[#F9706610] px-2.5 py-1.5 text-xs font-semibold text-[#F97066] cursor-pointer">Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-[#1E2030] px-3" style={{ background: "rgba(12,14,22,0.6)" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="shrink-0 border-none bg-none px-3.5 py-3 text-xs font-bold cursor-pointer whitespace-nowrap transition-all" style={{ color: activeTab === tab.id ? "#E2E4EA" : "#5A5E72", borderBottom: activeTab === tab.id ? "2px solid #6366F1" : "2px solid transparent" }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-[920px] p-5">

        {/* ══ DASHBOARD ══ */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Saldo", value: fmt(balance), accent: balance >= 0 ? "#22C55E" : "#F97066", icon: "💎", sub: monthLabel },
                { label: "Pemasukan", value: fmt(totalIncome), accent: "#22C55E", icon: "📈", sub: `${monthTxs.filter((t) => t.type === "income").length} transaksi` },
                { label: "Pengeluaran", value: fmt(totalExpense), accent: "#F97066", icon: "📉", sub: `${monthTxs.filter((t) => t.type === "expense").length} transaksi` },
              ].map((s) => (
                <div key={s.label} className="relative overflow-hidden rounded-2xl border border-[#1E2030] bg-[#161825] px-4 py-4">
                  <div className="absolute -right-2 -top-2 text-4xl opacity-5">{s.icon}</div>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#5A5E72]">{s.label}</div>
                  <div className="text-xl font-extrabold" style={{ color: s.accent, fontFamily: "'IBM Plex Mono', monospace" }}>{s.value}</div>
                  <div className="mt-1 text-[10px] text-[#5A5E72]">{s.sub}</div>
                </div>
              ))}
            </div>

            {insights.length > 0 && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3" style={{
                background: insights[0].type === "success" ? "#22C55E10" : insights[0].type === "danger" ? "#F9706610" : insights[0].type === "warning" ? "#F59E0B10" : "#6366F110",
                borderColor: insights[0].type === "success" ? "#22C55E30" : insights[0].type === "danger" ? "#F9706630" : insights[0].type === "warning" ? "#F59E0B30" : "#6366F130",
              }}>
                <span className="text-xl">{insights[0].icon}</span>
                <span className="text-sm font-medium leading-relaxed text-[#C8CAD4]">{insights[0].text}</span>
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <div className="rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
                <div className="mb-3.5 text-sm font-bold">Breakdown Pengeluaran</div>
                {expByCategory.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3.5">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart><Pie data={expByCategory} dataKey="value" cx="50%" cy="50%" outerRadius={62} innerRadius={36} strokeWidth={0} paddingAngle={2}>{expByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-1 flex-col gap-1.5">
                      {expByCategory.slice(0, 6).map((c) => (
                        <div key={c.name} className="flex items-center gap-1.5 text-xs">
                          <div className="h-2 w-2 shrink-0 rounded-sm" style={{ background: c.color }} />
                          <span className="flex-1 text-[#5A5E72]">{c.name}</span>
                          <span className="text-[10px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtShort(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="py-10 text-center text-xs text-[#5A5E72]">Belum ada data</div>}
              </div>
              <div className="rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
                <div className="mb-3.5 text-sm font-bold">Kumulatif Harian</div>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} /><stop offset="95%" stopColor="#22C55E" stopOpacity={0} /></linearGradient>
                        <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F97066" stopOpacity={0.25} /><stop offset="95%" stopColor="#F97066" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2030" />
                      <XAxis dataKey="day" tick={{ fill: "#5A5E72", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#5A5E72", fontSize: 9 }} tickFormatter={fmtShort} />
                      <Tooltip content={<ChartTooltip formatter={fmt} />} />
                      <Area type="monotone" dataKey="cumIncome" stroke="#22C55E" fill="url(#gi)" strokeWidth={2} name="Pemasukan" />
                      <Area type="monotone" dataKey="cumExpense" stroke="#F97066" fill="url(#ge)" strokeWidth={2} name="Pengeluaran" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="py-10 text-center text-xs text-[#5A5E72]">Belum ada data</div>}
              </div>
            </div>

            {budgetData.length > 0 && (
              <div className="mb-6 rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="text-sm font-bold">🎯 Budget Bulan Ini</div>
                  <button onClick={() => setActiveTab("budget")} className="border-none bg-none text-xs font-semibold text-[#6366F1] cursor-pointer">Lihat Semua →</button>
                </div>
                {budgetData.slice(0, 4).map((b) => (
                  <div key={b.cat} className="mb-2.5">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold">{b.icon} {b.cat}</span>
                      <span className="text-[11px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: b.pct >= 100 ? "#F97066" : b.pct >= 80 ? "#F59E0B" : "#22C55E" }}>{fmtShort(b.spent)} / {fmtShort(b.limit)} ({b.pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#1E2030]">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: Math.min(b.pct, 100) + "%", background: b.pct >= 100 ? "#F97066" : b.pct >= 80 ? "#F59E0B" : "#22C55E" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
              <div className="mb-2.5 text-sm font-bold">Transaksi Terbaru</div>
              {sortedTxs.length > 0 ? sortedTxs.slice(0, 5).map((tx) => (
                <TxItem key={tx.id} tx={tx} onEdit={(t) => { setEditingTx(t); setShowTxForm(true) }} onDelete={deleteTx} />
              )) : <div className="py-10 text-center text-xs text-[#5A5E72]">Belum ada transaksi. Tap ➕ untuk mulai!</div>}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-base font-bold">Semua Transaksi — {monthLabel}</div>
              <div className="text-xs text-[#5A5E72]">{sortedTxs.length} item</div>
            </div>
            {sortedTxs.length > 0 ? sortedTxs.map((tx) => (
              <TxItem key={tx.id} tx={tx} onEdit={(t) => { setEditingTx(t); setShowTxForm(true) }} onDelete={deleteTx} />
            )) : <div className="py-14 text-center text-xs text-[#5A5E72]">Belum ada transaksi untuk {monthLabel}</div>}
          </div>
        )}

        {activeTab === "budget" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">Budget — {monthLabel}</div>
                <div className="mt-0.5 text-xs text-[#5A5E72]">Atur batas pengeluaran per kategori</div>
              </div>
              <button onClick={() => setShowBudgetForm(true)} className="rounded-lg border-none px-4 py-2 text-xs font-bold text-white cursor-pointer" style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>✏️ Set Budget</button>
            </div>
            {budgetData.length > 0 ? (
              <div className="flex flex-col gap-3">
                {budgetData.map((b) => {
                  const status = b.pct >= 100 ? "over" : b.pct >= 80 ? "warn" : "ok"
                  return (
                    <div key={b.cat} className="rounded-2xl border bg-[#161825] p-4" style={{ borderColor: status === "over" ? "#F9706630" : status === "warn" ? "#F59E0B20" : "#1E2030" }}>
                      <div className="mb-2.5 flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg" style={{ background: b.color + "15" }}>{b.icon}</div>
                        <div className="flex-1">
                          <div className="text-sm font-bold">{b.cat}</div>
                          <div className="text-xs text-[#5A5E72]">Budget: {fmt(b.limit)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-extrabold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: status === "over" ? "#F97066" : status === "warn" ? "#F59E0B" : "#22C55E" }}>{b.pct.toFixed(0)}%</div>
                          <div className="text-xs text-[#5A5E72]">{fmt(b.spent)}</div>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#1E2030]">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: Math.min(b.pct, 100) + "%", background: status === "over" ? "linear-gradient(90deg,#F97066,#E11D48)" : status === "warn" ? "linear-gradient(90deg,#F59E0B,#F97316)" : "linear-gradient(90deg,#22C55E,#10B981)" }} />
                      </div>
                      <div className="mt-1.5 text-xs font-semibold" style={{ color: status === "over" ? "#F97066" : status === "warn" ? "#F59E0B" : "#22C55E" }}>
                        {status === "over" ? `⚠️ Melebihi budget ${fmt(b.spent - b.limit)}!` : status === "warn" ? `⚡ Sisa ${fmt(b.limit - b.spent)} — hampir habis!` : `✅ Sisa ${fmt(b.limit - b.spent)}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#1E2030] bg-[#161825] py-12 text-center">
                <div className="mb-3 text-4xl">🎯</div>
                <div className="text-sm font-semibold">Belum ada budget</div>
                <div className="text-xs text-[#5A5E72]">Set budget untuk mengontrol pengeluaran.</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "goals" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">Savings Goals</div>
                <div className="mt-0.5 text-xs text-[#5A5E72]">Target menabung kamu</div>
              </div>
              <button onClick={() => { setEditingGoal(null); setShowGoalForm(true) }} className="rounded-lg border-none px-4 py-2 text-xs font-bold text-white cursor-pointer" style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)" }}>➕ Goal Baru</button>
            </div>
            {goals.length > 0 ? (
              <div className="flex flex-col gap-3">
                {goals.map((g) => {
                  const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0
                  const remaining = g.target - g.saved
                  let monthsLeft: number | null = null
                  if (g.deadline) {
                    const dl = new Date(g.deadline); const now = new Date()
                    monthsLeft = Math.max(0, (dl.getFullYear() - now.getFullYear()) * 12 + dl.getMonth() - now.getMonth())
                  }
                  const perMonth = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null
                  return (
                    <div key={g.id} className="relative overflow-hidden rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
                      <div className="absolute -right-2 -top-2 text-6xl opacity-[0.04]">{g.icon}</div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: "linear-gradient(135deg,#F59E0B20,#F9731620)" }}>{g.icon}</div>
                        <div className="flex-1">
                          <div className="text-base font-bold">{g.name}</div>
                          {g.deadline && <div className="text-xs text-[#5A5E72]">Target: {new Date(g.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} {monthsLeft !== null && `(${monthsLeft} bulan lagi)`}</div>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingGoal(g); setShowGoalForm(true) }} className="cursor-pointer border-none bg-transparent text-sm text-[#5A5E72]">✏️</button>
                          <button onClick={() => deleteGoal(g.id)} className="cursor-pointer border-none bg-transparent text-sm text-[#5A5E72] opacity-60">🗑</button>
                        </div>
                      </div>
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-[#F59E0B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(g.saved)}</span>
                        <span className="text-xs text-[#5A5E72]">dari {fmt(g.target)}</span>
                      </div>
                      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[#1E2030]">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: pct >= 100 ? "linear-gradient(90deg,#22C55E,#10B981)" : "linear-gradient(90deg,#F59E0B,#F97316)" }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold" style={{ color: pct >= 100 ? "#22C55E" : "#5A5E72" }}>{pct >= 100 ? "🎉 TERCAPAI!" : `${pct.toFixed(0)}% — sisa ${fmt(remaining)}`}</span>
                        {perMonth && remaining > 0 && <span className="font-semibold text-[#A78BFA]">~{fmt(perMonth)}/bulan</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#1E2030] bg-[#161825] py-12 text-center">
                <div className="mb-3 text-4xl">⭐</div>
                <div className="text-sm font-semibold">Belum ada goals</div>
                <div className="text-xs text-[#5A5E72]">Buat target menabung pertama kamu!</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <div>
            <div className="text-lg font-bold">🧠 Smart Insights</div>
            <div className="mb-5 text-xs text-[#5A5E72]">Analisis otomatis — {monthLabel}</div>
            {insights.length > 0 ? (
              <div className="mb-7 flex flex-col gap-2.5">
                {insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border bg-[#161825] px-4 py-3.5" style={{
                    borderColor: ins.type === "success" ? "#22C55E20" : ins.type === "danger" ? "#F9706620" : ins.type === "warning" ? "#F59E0B20" : "#1E2030",
                    borderLeftWidth: 3, borderLeftColor: ins.type === "success" ? "#22C55E" : ins.type === "danger" ? "#F97066" : ins.type === "warning" ? "#F59E0B" : "#6366F1",
                  }}>
                    <span className="mt-0.5 shrink-0 text-xl">{ins.icon}</span>
                    <span className="text-sm font-medium leading-relaxed text-[#C8CAD4]">{ins.text}</span>
                  </div>
                ))}
              </div>
            ) : <div className="mb-7 rounded-2xl border border-[#1E2030] bg-[#161825] py-10 text-center text-xs text-[#5A5E72]">Tambahkan transaksi untuk insights!</div>}

            <div className="mb-5 rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
              <div className="mb-3.5 text-sm font-bold">📊 Tren 6 Bulan</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTrend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2030" />
                  <XAxis dataKey="month" tick={{ fill: "#5A5E72", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#5A5E72", fontSize: 10 }} tickFormatter={fmtShort} />
                  <Tooltip content={<ChartTooltip formatter={fmt} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" fill="#22C55E" radius={[5, 5, 0, 0]} name="Pemasukan" />
                  <Bar dataKey="expense" fill="#F97066" radius={[5, 5, 0, 0]} name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-[#1E2030] bg-[#161825] p-4">
              <div className="mb-3.5 text-sm font-bold">📋 Laporan — {monthLabel}</div>
              <div className="mb-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-[#22C55E20] bg-[#22C55E08] p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#22C55E]">Pemasukan</div>
                  <div className="mt-1 text-lg font-extrabold text-[#22C55E]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(totalIncome)}</div>
                </div>
                <div className="rounded-lg border border-[#F9706620] bg-[#F9706608] p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#F97066]">Pengeluaran</div>
                  <div className="mt-1 text-lg font-extrabold text-[#F97066]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(totalExpense)}</div>
                </div>
              </div>
              <div className="rounded-lg border border-[#1E2030] p-3.5 text-center" style={{ background: balance >= 0 ? "#22C55E05" : "#F9706605" }}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A5E72]">Net Savings</div>
                <div className="mt-1 text-2xl font-extrabold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: balance >= 0 ? "#22C55E" : "#F97066" }}>{fmt(balance)}</div>
                {totalIncome > 0 && <div className="mt-1 text-xs text-[#5A5E72]">Savings rate: {((balance / totalIncome) * 100).toFixed(1)}%</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setEditingTx(null); setShowTxForm(true) }} className="fixed bottom-5 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-2xl border-none text-2xl text-white cursor-pointer transition-transform hover:scale-110" style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>+</button>

      {/* Modals */}
      {showTxForm && <TransactionForm onSave={saveTx} onClose={() => { setShowTxForm(false); setEditingTx(null) }} initial={editingTx} />}
      {showBudgetForm && <BudgetForm budgets={budgets} onSave={handleSaveBudgets} onClose={() => setShowBudgetForm(false)} month={monthLabel} />}
      {showGoalForm && <GoalForm onSave={saveGoalHandler} onClose={() => { setShowGoalForm(false); setEditingGoal(null) }} initial={editingGoal} />}

      {showExport && (
        <Modal onClose={() => setShowExport(false)} title="⚙️ Settings & Export" width={400}>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => exportCSV(transactions)} className="w-full rounded-lg border border-[#1E2030] bg-[#161825] py-3 pl-4 text-left text-sm font-semibold text-[#E2E4EA] cursor-pointer">📄 Export CSV</button>
            <button onClick={() => exportJSON({ transactions, budgets, goals })} className="w-full rounded-lg border border-[#1E2030] bg-[#161825] py-3 pl-4 text-left text-sm font-semibold text-[#E2E4EA] cursor-pointer">💾 Backup JSON</button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-lg border border-[#1E2030] bg-[#161825] py-3 pl-4 text-left text-sm font-semibold text-[#E2E4EA] cursor-pointer">📥 Import JSON</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
          <p className="mt-3.5 text-center text-[10px] text-[#5A5E72]">DompetKu v2.0 — Data tersimpan di Supabase cloud ☁️</p>
        </Modal>
      )}
    </div>
  )
}