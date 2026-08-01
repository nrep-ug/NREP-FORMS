import Link from "next/link"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return <div className="form-page"><div className="empty-state"><FileQuestion size={40} /><h2>Form not found</h2><p>The link may be incorrect, unpublished, or no longer available.</p><Link className="button button--primary" href="/">View available forms</Link></div></div>
}
