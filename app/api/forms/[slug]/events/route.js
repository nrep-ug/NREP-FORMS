import { NextResponse } from "next/server"
import { hrFormsApi, publicRequestContext } from "@/lib/hr-forms-api"

export const runtime = "nodejs"

export async function POST(request, { params }) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 20_000) {
      return NextResponse.json({ error: "Event payload is too large." }, { status: 413 })
    }
    const { slug } = await params
    const body = await request.json()
    return NextResponse.json(await hrFormsApi(`/public/${encodeURIComponent(slug)}/events`, { method: "POST", body, ...publicRequestContext(request) }), { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Event could not be recorded." }, { status: error.status || 500 })
  }
}
