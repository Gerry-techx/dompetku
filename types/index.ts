// Tipe data untuk satu transaksi
export type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  note: string
  date: string
  recurring: boolean
  createdAt: number
  updatedAt: number
}

// Tipe data untuk savings goal
export type Goal = {
  id: string
  name: string
  target: number
  saved: number
  deadline: string
  icon: string
  createdAt: number
}

// Budget = object biasa, key = nama kategori, value = limit
export type Budgets = Record<string, number>

// Tipe untuk AI insight
export type Insight = {
  type: "success" | "warning" | "danger" | "info"
  icon: string
  text: string
}