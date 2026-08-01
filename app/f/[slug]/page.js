import { notFound } from "next/navigation"
import { hrFormsApi } from "@/lib/hr-forms-api"
import FormRunner from "@/components/FormRunner"

export const dynamic = "force-dynamic"

async function loadForm(slug) {
  try {
    const response = await hrFormsApi(`/public/${encodeURIComponent(slug)}`)
    return response.form
  } catch (error) {
    if (error.status === 404) notFound()
    throw error
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const form = await loadForm(slug)
  return {
    title: form.title,
    description: form.description || "Complete this official NREP form.",
    robots: form.accessMode === "unlisted" ? { index: false, follow: false } : undefined,
  }
}

export default async function PublicFormPage({ params }) {
  const { slug } = await params
  return <FormRunner form={await loadForm(slug)} />
}
