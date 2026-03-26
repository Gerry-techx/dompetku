import { Transaction, Budgets, Goal } from "@/types"

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCSV(transactions: Transaction[]) {
  const header = "Date,Type,Category,Amount,Note,Recurring\n"
  const rows = transactions
    .map(
      (t) =>
        `${t.date},${t.type},${t.category},${t.amount},"${(t.note || "").replace(/"/g, '""')}",${t.recurring ? "Yes" : "No"}`
    )
    .join("\n")
  downloadFile(header + rows, "dompetku-export.csv", "text/csv")
}

export function exportJSON(data: {
  transactions: Transaction[]
  budgets: Budgets
  goals: Goal[]
}) {
  downloadFile(JSON.stringify(data, null, 2), "dompetku-backup.json", "application/json")
}