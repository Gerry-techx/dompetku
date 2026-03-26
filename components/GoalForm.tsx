"use client"

import { useState } from "react"
import { Goal } from "@/types"
import { uid } from "@/lib/utils"
import Modal from "./Modal"

type Props = {
  onSave: (g: Goal) => void
  onClose: () => void
  initial?: Goal | null
}

const ICONS = ["🎯", "📱", "🏍️", "💻", "🎓", "✈️", "🏠", "💍", "🎮", "🚗"]

export default function GoalForm({ onSave, onClose, initial = null }: Props) {
  const [name, setName] = useState(initial?.name || "")
  const [target, setTarget] = useState(initial ? String(initial.target) : "")
  const [saved, setSaved] = useState(initial ? String(initial.saved) : "0")
  const [deadline, setDeadline] = useState(initial?.deadline || "")
  const [icon, setIcon] = useState(initial?.icon || "🎯")

  const valid = name && target && parseFloat(target) > 0

  const handleSave = () => {
    if (!valid) return
    onSave({
      id: initial?.id || uid(),
      name,
      target: parseFloat(target),
      saved: parseFloat(saved) || 0,
      deadline,
      icon,
      createdAt: initial?.createdAt || Date.now(),
    })
    onClose()
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit Goal" : "Goal Baru"} width={420}>
      {/* Icon picker */}
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Icon
      </label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ICONS.map((ic) => (
          <button
            key={ic}
            onClick={() => setIcon(ic)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border-2 text-lg"
            style={{
              borderColor: icon === ic ? "#8B5CF6" : "#2A2E42",
              background: icon === ic ? "#8B5CF620" : "#0E1019",
            }}
          >
            {ic}
          </button>
        ))}
      </div>

      {/* Name */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Nama Goal
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='contoh: "Beli iPhone baru"'
        className="mb-4 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3 text-sm text-[#E2E4EA] outline-none"
      />

      {/* Target */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Target (Rp)
      </label>
      <input
        type="number"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="0"
        className="mb-4 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3 text-lg font-bold text-[#E2E4EA] outline-none"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      />

      {/* Saved */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Sudah Terkumpul (Rp)
      </label>
      <input
        type="number"
        value={saved}
        onChange={(e) => setSaved(e.target.value)}
        placeholder="0"
        className="mb-4 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3 text-lg font-bold text-[#E2E4EA] outline-none"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      />

      {/* Deadline */}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5E72]">
        Target Date (opsional)
      </label>
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="mb-5 w-full rounded-xl border border-[#2A2E42] bg-[#0E1019] px-4 py-3 text-sm text-[#E2E4EA] outline-none"
      />

      <button
        onClick={handleSave}
        disabled={!valid}
        className="w-full rounded-xl border-none py-3 text-sm font-bold text-white cursor-pointer"
        style={{
          background: valid ? "linear-gradient(135deg,#F59E0B,#F97316)" : "#2A2E42",
          cursor: valid ? "pointer" : "default",
        }}
      >
        {initial ? "💾 Update Goal" : "🎯 Buat Goal"}
      </button>
    </Modal>
  )
}