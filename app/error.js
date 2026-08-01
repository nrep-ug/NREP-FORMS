"use client"

import { useEffect } from "react"
import { CircleAlert } from "lucide-react"

export default function ErrorPage({ error, reset }) {
  useEffect(() => { console.error(error) }, [error])
  return <div className="form-page"><div className="service-error"><CircleAlert size={40} /><h1>Unable to display this page</h1><p>Please retry. Your browser draft remains on this device.</p><button className="button button--primary" onClick={reset}>Try again</button></div></div>
}
