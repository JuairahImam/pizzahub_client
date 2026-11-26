/** Only allow local absolute paths, never protocol-relative or external URLs. */
export function getSafeNext(): string | null {
  const next = new URLSearchParams(window.location.search).get("next")
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null
}
