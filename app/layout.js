import Link from "next/link"
import Image from "next/image"
import { FileText, ShieldCheck } from "lucide-react"
import "./globals.css"

export const metadata = {
  title: { default: "NREP Forms", template: "%s | NREP Forms" },
  description: "Official public forms from the National Renewable Energy Platform.",
}

export default function RootLayout({ children }) {
  const logoUrl = process.env.NEXT_PUBLIC_NREP_LOGO_URL
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <Link className="brand" href="/">
              {logoUrl ? <Image src={logoUrl} alt="NREP" width={42} height={42} unoptimized /> : <span className="brand__mark"><FileText size={22} /></span>}
              <span><strong>NREP Forms</strong><small>National Renewable Energy Platform</small></span>
            </Link>
            <div className="site-trust"><ShieldCheck size={17} /><span>Official NREP service</span></div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer"><div><strong>NREP</strong><span>Secure information collection for programmes, events, and stakeholder engagement.</span></div><a href="https://www.nrep.ug" target="_blank" rel="noreferrer">nrep.ug</a></footer>
      </body>
    </html>
  )
}
