// Format angka ke Rupiah: 50000 → "Rp50.000"
export const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

// Format singkat: 1500000 → "1.5jt"
export const fmtShort = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "M"
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "jt"
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "rb"
  return n.toString()
}

// Generate unique ID
export const uid = () =>
  Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

// Tanggal hari ini format YYYY-MM-DD
export const today = () => new Date().toISOString().split("T")[0]

// Ambil "YYYY-MM" dari tanggal
export const getMonthKey = (d: string) => (d ? d.substring(0, 7) : "")