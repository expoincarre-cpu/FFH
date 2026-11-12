import { NextResponse } from 'next/server'

const MAX_SIZE = 5 * 1024 * 1024
const TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const isEmail = (v: unknown) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/**
 * Application endpoint (multipart/form-data). Validates the candidate's
 * details and résumé; connect `deliver()` to the HR mailbox or ATS before going live.
 */
export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_form' }, { status: 400 })
  }
  if (form.get('website')) return NextResponse.json({ ok: true }) // honeypot

  const errors: string[] = []
  const text = (k: string) => String(form.get(k) ?? '').trim()
  if (text('firstName').length < 2) errors.push('firstName')
  if (text('lastName').length < 2) errors.push('lastName')
  if (!isEmail(text('email'))) errors.push('email')
  if (!text('field')) errors.push('field')
  if (form.get('consent') !== 'on') errors.push('consent')
  const cv = form.get('cv')
  if (!(cv instanceof File) || cv.size === 0 || cv.size > MAX_SIZE || !TYPES.includes(cv.type)) errors.push('cv')
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 })

  await deliver(form)
  return NextResponse.json({ ok: true })
}

async function deliver(form: FormData) {
  // TODO: forward to the HR mailbox (e.g. careers@ffh.ma) or the applicant tracking system.
  console.info('[careers] application received', form.get('field'))
}
