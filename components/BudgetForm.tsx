"use client"

import { useState } from "react"
import { Budgets } from "@/types"
import { CATEGORIES_EXPENSE } from "@/lib/constants"
import Modal from "./Modal"

type Props = {
  budgets: Budgets
  onSave: (b: Budgets) => void
  onClose: () => void
  month: string
}

export default function BudgetForm({ budgets, onSave, onClose, month }: Props) {
  const [drafts, setDrafts] = useState(
    CATEGORIES_EXPENSE.map((c) => ({
      category: c.name,
      icon: c.icon,
      limit: budgets[c.name] || 0,
    }))
  )

  const updateDraft = (cat: string, val: string) => {
    setDrafts((d) =>
      d.map((x) => (x.category === cat ? { ...x, limit: parseFloat(val) || 0 } : x))
    )
  }

  const handleSave = () => {
    const result: Budgets = {}
    drafts.forEach((d) => {
      if (d.limit > 0) result[d.category] = d.limit
    })
    onSave(result)
    onClose()
  }

  return (
    <Modal onClose={onClose} title={`Budget — ${month}`} width={500}>
      <p className="mb-4 text-xs text-[#5A5E72]">
        Set batas pengeluaran per kategori bulan ini.
      </p>
      <div className="mb-5 flex flex-col gap-2">
        {drafts.map((d) => (
          <div key={d.category} className="flex items-center gap-2.5">
            <span className="w-7 text-center text-base">{d.icon}</span>
            <span className="flex-1 text-sm font-semibold text-[#C8CAD4]">{d.category}</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#5A5E72]">
                Rp
              </span>
              <input
                type="number"
                value={d.limit || ""}
                onChange={(e) => updateDraft(d.category, e.target.value)}
                placeholder="0"
                className="w-36 rounded-lg border border-[#2A2E42] bg-[#0E1019] py-2 pl-8 pr-2.5 text-sm font-semibold text-[#E2E4EA] outline-none"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        className="w-full rounded-xl border-none py-3 text-sm font-bold text-white cursor-pointer"
        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
      >
        💾 Simpan Budget
      </button>
    </Modal>
  )
}