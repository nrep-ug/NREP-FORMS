import Link from "next/link"
import { ArrowRight, CalendarClock, FileSearch, Search, ShieldCheck } from "lucide-react"
import { hrFormsApi } from "@/lib/hr-forms-api"

export const dynamic = "force-dynamic"

function formatDate(value) {
  if (!value) return "No closing date"
  return new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kampala" }).format(new Date(value))
}

export default async function FormsHomePage({ searchParams }) {
  const queryParams = await searchParams
  const q = String(queryParams?.q || "").trim().slice(0, 100)
  const page = Math.max(1, Number(queryParams?.page) || 1)
  let data = { documents: [], total: 0, page: 1, totalPages: 1 }
  let error = ""
  try {
    const query = new URLSearchParams({ page: String(page), limit: "12" })
    if (q) query.set("search", q)
    data = await hrFormsApi(`/public?${query}`)
  } catch (err) {
    error = err.message
  }

  return (
    <div className="home">
      <section className="home-heading">
        <h1>NREP Forms</h1>
        <p>Complete official forms for NREP programmes, events, consultations, and stakeholder engagement.</p>
      </section>
      <form className="home-toolbar" action="/" method="get">
        <div className="search"><Search size={18} /><input className="input" name="q" defaultValue={q} placeholder="Search available forms" aria-label="Search available forms" /></div>
        <button className="button button--primary" type="submit"><Search size={17} /> Search</button>
      </form>
      {error ? (
        <div className="service-error"><ShieldCheck size={36} /><h1>Forms are temporarily unavailable</h1><p>{error}</p></div>
      ) : data.documents.length === 0 ? (
        <div className="empty-state"><FileSearch size={36} /><h2>{q ? "No matching forms" : "No public forms are open"}</h2><p>{q ? "Try a different search phrase." : "Published forms will appear here when they become available."}</p></div>
      ) : (
        <>
          <div className="forms-list">
            {data.documents.map((form) => <article className="form-card" style={{ "--card-accent": form.theme?.accentColor || "#087f8c" }} key={form.id}><div className="form-card__body"><h2>{form.title}</h2><p>{form.description || "Open this form to view its questions and submission details."}</p><div className="form-card__meta"><span><CalendarClock size={15} /> {form.closesAt ? `Closes ${formatDate(form.closesAt)}` : "No closing date"}</span><span><ShieldCheck size={15} /> Secure NREP form</span></div></div><div className="form-card__footer"><Link className="button button--primary" href={`/f/${form.slug}`}>Open form <ArrowRight size={16} /></Link></div></article>)}
          </div>
          {data.totalPages > 1 && <div className="pager"><span>Page {data.page} of {data.totalPages}</span><div className="pager__buttons">{data.page > 1 && <Link className="button" href={`/?${new URLSearchParams({ ...(q ? { q } : {}), page: String(data.page - 1) })}`}>Previous</Link>}{data.page < data.totalPages && <Link className="button" href={`/?${new URLSearchParams({ ...(q ? { q } : {}), page: String(data.page + 1) })}`}>Next</Link>}</div></div>}
        </>
      )}
    </div>
  )
}
