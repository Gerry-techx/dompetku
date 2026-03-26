type TooltipPayload = {
  name: string
  value: number
  color: string
}

type Props = {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  formatter?: (v: number) => string
}

export default function ChartTooltip({ active, payload, label, formatter }: Props) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#2A2E42] bg-[#1E2030] px-3.5 py-2.5 text-xs shadow-lg">
      {label && <div className="mb-1 font-semibold text-[#8B8FA3]">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="mt-0.5 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#C8CAD4]">{p.name}:</span>
          <span
            className="font-bold text-white"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}