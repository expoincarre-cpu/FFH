import { NextResponse } from 'next/server'

const SUBJECTS = ['partnership', 'commercial', 'press', 'other']
const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/**
 * Contact endpoint. Validates the payload; connect `deliver()` to the group's
 * mail service / CRM (e.g. SMTP, Resend, HubSpot) before going live.
 */
export async function POST(request: Request) {
  let data: Record<string, unknown>
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const errors: string[] = []
  if (!SUBJECTS.includes(String(data.subject))) errors.push('subject')
  if (typeof data.name !== 'string' || data.name.trim().length < 2) errors.push('name')
  if (!isEmail(data.email)) errors.push('email')
  if (typeof data.message !== 'string' || data.message.trim().length < 10) errors.push('message')
  if (data.consent !== true) errors.push('consent')
  // Honeypot: bots fill hidden fields.
  if (data.website) return NextResponse.json({ ok: true })
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 })

  await deliver(data)
  return NextResponse.json({ ok: true })
}

async function deliver(data: Record<string, unknown>) {
  // TODO: route by subject to the right inbox (partnerships, sales, press).
  console.info('[contact]', data.subject, data.email)
}
