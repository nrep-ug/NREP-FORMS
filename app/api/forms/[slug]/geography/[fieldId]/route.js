import { NextResponse } from "next/server"
import { hrFormsApi, publicRequestContext } from "@/lib/hr-forms-api"

export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  try {
    const { slug, fieldId } = await params
    const path = new URL(request.url).searchParams.get("path") || "[]"
    const payload = await hrFormsApi(`/public/${encodeURIComponent(slug)}/geography/${encodeURIComponent(fieldId)}?path=${encodeURIComponent(path)}`, {
      ...publicRequestContext(request),
    })
    return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to load location options." }, { status: error.status || 500 })
  }
}
