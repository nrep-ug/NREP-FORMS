import "server-only"

function configuration() {
  const baseUrl = String(process.env.NREP_FORMS_API_BASE_URL || "").replace(/\/$/, "")
  const apiKey = process.env.NREP_FORMS_PUBLIC_API_KEY || ""
  if (!baseUrl) throw new Error("NREP_FORMS_API_BASE_URL is not configured.")
  if (!apiKey && process.env.NODE_ENV === "production") throw new Error("NREP_FORMS_PUBLIC_API_KEY is not configured.")
  return { baseUrl, apiKey }
}

export async function hrFormsApi(path, { method = "GET", body, forwardedFor = "", userAgent = "" } = {}) {
  const { baseUrl, apiKey } = configuration()
  const multipart = typeof FormData !== "undefined" && body instanceof FormData
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    cache: "no-store",
    headers: {
      ...(!multipart && body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(apiKey ? { "X-NREP-Forms-Key": apiKey } : {}),
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      ...(userAgent ? { "User-Agent": userAgent } : {}),
    },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(payload?.error || "The forms service is unavailable.")
    error.status = response.status
    error.details = payload?.details || null
    throw error
  }
  return payload
}

export function publicRequestContext(request) {
  return {
    forwardedFor: String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim(),
    userAgent: request.headers.get("user-agent") || "",
  }
}
