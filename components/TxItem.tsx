"use client"

import { Transaction } from "@/types"
import { CATEGORIES_EXPENSE, CATEGORIES_INCOME } from "@/lib/constants"
import { fmt } from "@/lib/utils"

type TxItemProps = {
  tx: Transaction
  onEdit: (tx: Transaction) => void
  onDelete: (id: string) => void
}

export default function TxItem({ tx, onEdit, onDelete }: TxItemProps) {
  const allCats = [...CATEGORIES_EXPENSE, ...CATEGORIES_INCOME]
  const cat = allCats.find((c) => c.name === tx.category) || {
    icon: "📦",
    color: "#94A3B8",
  }
  const isExp = tx.type === "expense"

  return (
    <div className="flex items-center gap-3 border-b border-[#1E2030] py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: cat.color + "15" }}
      >
        {cat.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-[#E2E4EA]">{tx.category}</span>
          {tx.recurring && (
            <span className="rounded bg-[#8B5CF630] px-1.5 py-0.5 text-[9px] font-bold text-[#A78BFA]">
              🔄
            </span>
          )}
        </div>
        <div className="truncate text-xs text-[#5A5E72]">{tx.note || tx.date}</div>
      </div>
      <div
        className="shrink-0 text-sm font-bold"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          color: isExp ? "#F97066" : "#22C55E",
        }}
      >
        {isExp ? "-" : "+"}
        {fmt(tx.amount)}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <button
          onClick={() => onEdit(tx)}
          className="cursor-pointer border-none bg-transparent p-1 text-sm text-[#C8CAD4] opacity-50 hover:opacity-100"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(tx.id)}
          className="cursor-pointer border-none bg-transparent p-1 text-sm text-[#C8CAD4] opacity-40 hover:opacity-100"
        >
          🗑
        </button>
      </div>
    </div>
  )
}