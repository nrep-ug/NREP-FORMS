import Link from "next/link"
import { Check, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"
import { hrFormsApi } from "@/lib/hr-forms-api"
import { resolveNrepFormAccent } from "@/lib/nrep-theme.mjs"

export const dynamic = "force-dynamic"

export default async function FormSuccessPage({ params, searchParams }) {
  const { slug } = await params
  const query = await searchParams
  let form
  try { form = (await hrFormsApi(`/public/${encodeURIComponent(slug)}`)).form } catch (error) { if (error.status === 404) notFound(); throw error }
  const reference = String(query?.reference || "").slice(0, 80)
  return <div className="form-page"><div className="form-shell" style={{ "--form-accent": resolveNrepFormAccent(form.theme?.accentColor) }}><div className="success"><div className="success__icon"><Check size={32} /></div><h2>{form.confirmation.title}</h2><p>{form.confirmation.message}</p>{reference && <div className="reference">{reference}</div>}<div className="footer-actions" style={{ justifyContent: "center" }}><Link className="button" href="/">Available forms</Link>{form.confirmation.redirectUrl && <a className="button button--primary" href={form.confirmation.redirectUrl} rel="noreferrer">Continue <ExternalLink size={16} /></a>}</div></div></div></div>
}
