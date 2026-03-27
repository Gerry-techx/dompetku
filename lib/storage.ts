import { supabase } from "./supabase"
import { Transaction, Budgets, Goal } from "@/types"

// ══ AUTH ══
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  })
  if (error) console.error("Login error:", error)
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ══ TRANSACTIONS ══
export async function loadTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) { console.error("Load tx error:", error); return [] }

  return (data || []).map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    note: row.note || "",
    date: row.date,
    recurring: row.recurring || false,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }))
}

export async function saveTransaction(tx: Transaction, userId: string) {
  const { error } = await supabase.from("transactions").upsert({
    id: tx.id,
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    note: tx.note,
    date: tx.date,
    recurring: tx.recurring,
    created_at: tx.createdAt,
    updated_at: tx.updatedAt,
  })
  if (error) console.error("Save tx error:", error)
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) console.error("Delete tx error:", error)
}

// ══ BUDGETS ══
export async function loadBudgets(month: string): Promise<Budgets> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("month", month)

  if (error) { console.error("Load budgets error:", error); return {} }

  const result: Budgets = {}
  ;(data || []).forEach((row) => {
    result[row.category] = Number(row.amount)
  })
  return result
}

export async function saveBudgets(budgets: Budgets, month: string, userId: string) {
  // Delete existing budgets for this month
  await supabase.from("budgets").delete().eq("month", month).eq("user_id", userId)

  // Insert new
  const rows = Object.entries(budgets).map(([category, amount]) => ({
    user_id: userId,
    month,
    category,
    amount,
  }))

  if (rows.length > 0) {
    const { error } = await supabase.from("budgets").insert(rows)
    if (error) console.error("Save budgets error:", error)
  }
}

// ══ GOALS ══
export async function loadGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) { console.error("Load goals error:", error); return [] }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    target: Number(row.target),
    saved: Number(row.saved),
    deadline: row.deadline || "",
    icon: row.icon || "🎯",
    createdAt: Number(row.created_at),
  }))
}

export async function saveGoal(goal: Goal, userId: string) {
  const { error } = await supabase.from("goals").upsert({
    id: goal.id,
    user_id: userId,
    name: goal.name,
    target: goal.target,
    saved: goal.saved,
    deadline: goal.deadline,
    icon: goal.icon,
    created_at: goal.createdAt,
  })
  if (error) console.error("Save goal error:", error)
}

export async function deleteGoalFromDB(id: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id)
  if (error) console.error("Delete goal error:", error)
}