"use client"

import { useState } from "react"
import { Transaction } from "@/types"
import { CATEGORIES_EXPENSE, CATEGORIES_INCOME } from "@/lib/constants"
import { uid, today } from "@/lib/utils"
import Modal from "./Modal"

type Props = {
  onSave: (tx: Transaction) => void
  onClose: () => void
  initial?: Transaction | null
}

export default function TransactionForm({ onSave, onClose, initial = null }: Props) {
  const [type, setType] = useState<"expense" | "income">(initial?.type || "expense")
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "")
  const [category, setCategory] = useState(initial?.category || "")
  const [note, setNote] = useState(initial?.note || "")
  const [date, setDate] = useState(initial?.date || today())
  const [isRecurring, setIsRecurring] = useState(initial?.recurring || false)

  const cats = type === "expense" ? CATEGORIES_EXPENSE : CATEGORIES_INCOME
  const valid = amount && category && parseFloat(amount) > 0

  const handleSave = () => {
    if (!valid) return
    onSave({
      id: initial?.id || uid(),
      type,
      amount: parseFloat(amount),
      category,
      note,
      date,
      recurring: isRecurring,
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
    })
    onClose()
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit Transaksi" : "Transaksi Baru"}>
      {/* Type toggle */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#0E1019] p-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setCategory("") }}
            className="flex-1 rounded-lg border-none py-2.5 text-sm font-bold cursor-pointer transition-all"
            style={{
              background: type === t ? (t === "expense" ? "#F97066" : "#22C55E") : "transparent",
              color: type === t ? "#fff" : "#5A5E72",
            }}
          >
            {t === "expense" ? "💸 Pengeluaran" : "💰 Pemasukan"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Jumlah (Rp)
      </label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        className="mb-4 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3.5 text-2xl font-extrabold text-[#E2E4EA] outline-none"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      />

      {/* Date */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Tanggal
      </label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3 text-sm text-[#E2E4EA] outline-none"
      />

      {/* Category */}
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Kategori
      </label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c.name}
            onClick={() => setCategory(c.name)}
            className="rounded-lg border-2 px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all"
            style={{
              borderColor: category === c.name ? c.color : "#2A2E42",
              background: category === c.name ? c.color + "20" : "#0E1019",
              color: category === c.name ? c.color : "#5A5E72",
            }}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Note */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Catatan
      </label>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Opsional..."
        className="mb-4 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3 text-sm text-[#E2E4EA] outline-none"
      />

      {/* Recurring */}
      <div
        onClick={() => setIsRecurring(!isRecurring)}
        className="mb-5 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 transition-all"
        style={{
          background: isRecurring ? "#8B5CF620" : "#0E1019",
          borderColor: isRecurring ? "#8B5CF6" : "#2A2E42",
        }}
      >
        <div
          className="flex h-5 w-5 items-center justify-center rounded-md border-2 text-xs text-white transition-all"
          style={{
            borderColor: isRecurring ? "#8B5CF6" : "#3A3E52",
            background: isRecurring ? "#8B5CF6" : "transparent",
          }}
        >
          {isRecurring && "✓"}
        </div>
        <span className="text-sm font-semibold" style={{ color: isRecurring ? "#C4B5FD" : "#5A5E72" }}>
          🔄 Recurring (tiap bulan)
        </span>
      </div>

      {/* Submit */}
      <button
        onClick={handleSave}
        disabled={!valid}
        className="w-full rounded-xl border-none py-3.5 text-sm font-bold text-white cursor-pointer transition-all"
        style={{
          background: !valid
            ? "#2A2E42"
            : type === "expense"
              ? "linear-gradient(135deg,#F97066,#E11D48)"
              : "linear-gradient(135deg,#22C55E,#059669)",
          cursor: valid ? "pointer" : "default",
        }}
      >
        {initial
          ? "💾 Simpan Perubahan"
          : type === "expense"
            ? "💸 Tambah Pengeluaran"
            : "💰 Tambah Pemasukan"}
      </button>
    </Modal>
  )
}