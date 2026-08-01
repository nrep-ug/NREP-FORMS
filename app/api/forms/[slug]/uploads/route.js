import { NextResponse } from "next/server"
import { hrFormsApi, publicRequestContext } from "@/lib/hr-forms-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request, { params }) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 106_000_000) {
      return NextResponse.json({ error: "The upload exceeds the server's 100 MB storage limit." }, { status: 413 })
    }
    const { slug } = await params
    const body = await request.formData()
    const payload = await hrFormsApi(`/public/${encodeURIComponent(slug)}/uploads`, {
      method: "POST",
      body,
      ...publicRequestContext(request),
    })
    return NextResponse.json(payload, { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Upload failed.", details: error.details || undefined }, { status: error.status || 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = await params
    const body = await request.json()
    const payload = await hrFormsApi(`/public/${encodeURIComponent(slug)}/uploads`, {
      method: "DELETE",
      body,
      ...publicRequestContext(request),
    })
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to clear uploads." }, { status: error.status || 500 })
  }
}
