export const NREP_THEME = Object.freeze({
  primary: "#176F91",
  primaryLight: "#2E9ECC",
  primaryDark: "#0B5E78",
  secondary: "#EFA74F",
  secondaryLight: "#F5C078",
  secondaryDark: "#B45309",
})

const LEGACY_ACCENTS = new Map([
  ["#087f8c", NREP_THEME.primary],
  ["#066873", NREP_THEME.primaryDark],
  ["#075f69", NREP_THEME.primaryDark],
  ["#076b76", NREP_THEME.primaryDark],
  ["#0d5964", NREP_THEME.primaryDark],
])

export function resolveNrepFormAccent(value) {
  const normalized = String(value || "").trim().toLowerCase()
  if (LEGACY_ACCENTS.has(normalized)) return LEGACY_ACCENTS.get(normalized)
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : NREP_THEME.primary
}
