const KEYS = {
  tx: "dompetku-transactions",
  budgets: "dompetku-budgets",
  goals: "dompetku-goals",
}

export { KEYS }

export async function loadFromStorage<T>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error("Save error:", e)
  }
}

export async function removeFromStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error("Remove error:", e)
  }
}