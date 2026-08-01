import { NextResponse } from "next/server"
import { hrFormsApi, publicRequestContext } from "@/lib/hr-forms-api"

export const runtime = "nodejs"

export async function POST(request, { params }) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 1_000_000) {
      return NextResponse.json({ error: "Submission payload is too large." }, { status: 413 })
    }
    const { slug } = await params
    const body = await request.json()
    const payload = await hrFormsApi(`/public/${encodeURIComponent(slug)}/submissions`, { method: "POST", body, ...publicRequestContext(request) })
    return NextResponse.json(payload, { status: payload.reused ? 200 : 201, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Submission failed.", details: error.details || undefined }, { status: error.status || 500 })
  }
}
