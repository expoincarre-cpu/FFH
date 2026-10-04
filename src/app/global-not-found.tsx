import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = { title: '404 — FFH' }

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <main className="notfound">
          <p className="label">404 — FFH</p>
          <h1 className="display display--xl">
            <span>Introuvable.</span>
            <span className="muted">Not found.</span>
          </h1>
          <p className="notfound__links">
            <a className="link-arrow" href="/fr">Accueil →</a>
            <a className="link-arrow" href="/en">Home →</a>
          </p>
        </main>
      </body>
    </html>
  )
}
