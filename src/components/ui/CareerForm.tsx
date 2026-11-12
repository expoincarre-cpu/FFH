'use client'

import { useRef, useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'

type Labels = Dictionary['careers']['form']
const MAX_SIZE = 5 * 1024 * 1024
const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function CareerForm({ labels }: { labels: Labels }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errors, setErrors] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const validFile = (f: File | null) => !!f && f.size > 0 && f.size <= MAX_SIZE && /\.(pdf|docx?)$/i.test(f.name)

  const pick = (f: File | null) => {
    setFile(f)
    setErrors((e) => (validFile(f) ? e.filter((x) => x !== 'cv') : [...new Set([...e, 'cv'])]))
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (file) data.set('cv', file)
    const local: string[] = []
    if (!String(data.get('firstName') ?? '').trim()) local.push('firstName')
    if (!String(data.get('lastName') ?? '').trim()) local.push('lastName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get('email') ?? ''))) local.push('email')
    if (!data.get('field')) local.push('field')
    if (!validFile(file)) local.push('cv')
    if (data.get('consent') !== 'on') local.push('consent')
    if (local.length) {
      setErrors(local)
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/careers', { method: 'POST', body: data })
      const json = await res.json()
      if (json.ok) setStatus('sent')
      else {
        setErrors(json.errors ?? [])
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p className="form__sent display display--m" role="status">
        {labels.sent}
      </p>
    )
  }

  const err = (k: string) => errors.includes(k)

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form__grid">
        <Field name="firstName" label={labels.firstName} required invalid={err('firstName')} error={labels.required} autoComplete="given-name" />
        <Field name="lastName" label={labels.lastName} required invalid={err('lastName')} error={labels.required} autoComplete="family-name" />
        <Field name="email" type="email" label={labels.email} required invalid={err('email')} error={labels.required} autoComplete="email" />
        <Field name="phone" type="tel" label={labels.phone} autoComplete="tel" />
      </div>

      <label className="field select" data-invalid={err('field') || undefined}>
        <span className="label">{labels.field} *</span>
        <select name="field" defaultValue="" required aria-invalid={err('field') || undefined}>
          <option value="" disabled>
            —
          </option>
          {labels.fields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        {err('field') && <span className="field__error">{labels.required}</span>}
      </label>

      <div className="field" data-invalid={err('cv') || undefined}>
        <span className="label">{labels.cv} *</span>
        <button
          type="button"
          className="dropzone"
          data-drag={drag || undefined}
          data-filled={file ? true : undefined}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            pick(e.dataTransfer.files?.[0] ?? null)
          }}
        >
          <span aria-hidden="true" className="dropzone__icon">
            ↑
          </span>
          <span>{file ? `${file.name} — ${(file.size / 1024 / 1024).toFixed(1)} Mo` : labels.cvHint}</span>
        </button>
        <input ref={input} type="file" name="cvPicker" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        {err('cv') && <span className="field__error">{labels.fileError}</span>}
      </div>

      <label className="field field--area">
        <span className="label">{labels.message}</span>
        <textarea name="message" rows={4} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="form__hp" aria-hidden="true" />
      <label className="form__consent" data-invalid={err('consent') || undefined}>
        <input type="checkbox" name="consent" required />
        <span>{labels.consent}</span>
      </label>
      {status === 'error' && <p className="field__error">{labels.error}</p>}
      <button type="submit" className="btn btn--solid" disabled={status === 'sending'}>
        {status === 'sending' ? labels.sending : labels.send} <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  invalid,
  error,
  autoComplete,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  invalid?: boolean
  error?: string
  autoComplete?: string
}) {
  return (
    <label className="field" data-invalid={invalid || undefined}>
      <span className="label">
        {label}
        {required && ' *'}
      </span>
      <input name={name} type={type} required={required} aria-invalid={invalid || undefined} autoComplete={autoComplete} />
      {invalid && <span className="field__error">{error}</span>}
    </label>
  )
}
