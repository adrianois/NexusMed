/**
 * Normaliza data para yyyy-mm-dd independente do formato retornado pelo banco.
 * Ex: "2026-03-09T00:00:00+00:00" -> "2026-03-09"
 */
export function normalizarData(valor) {
  if (!valor) return null
  return String(valor).substring(0, 10)
}
