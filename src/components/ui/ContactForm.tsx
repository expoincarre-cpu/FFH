'use client'

import { useState } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'

type Labels = Dictionary['contact']['form']
type Subject = keyof Labels['subjects']

export function ContactForm({ labels }: { labels: Labels }) {
  const [subject, setSubject] = useState<Subject>('partnership')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errors, setErrors] = useState<string[]>([])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      subject,
      name: form.get('name'),
      company: form.get('company'),
      email: form.get('email'),
      phone: form.get('phone'),
      message: form.get('message'),
      consent: form.get('consent') === 'on',
      website: form.get('website'),
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.ok) {
        setStatus('sent')
        setErrors([])
      } else {
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

  const err = (name: string) => errors.includes(name)

  return (
    <form className="form" onSubmit={submit} noValidate>
      <fieldset className="form__subjects">
        <legend className="label">{labels.subject}</legend>
        {(Object.keys(labels.subjects) as Subject[]).map((key) => (
          <label key={key} data-on={subject === key || undefined}>
            <input type="radio" name="subject" value={key} checked={subject === key} onChange={() => setSubject(key)} />
            {labels.subjects[key]}
          </label>
        ))}
      </fieldset>

      <div className="form__grid">
        <Field name="name" label={labels.name} required invalid={err('name')} error={labels.required} autoComplete="name" />
        <Field name="company" label={labels.company} autoComplete="organization" />
        <Field name="email" type="email" label={labels.email} required invalid={err('email')} error={labels.required} autoComplete="email" />
        <Field name="phone" type="tel" label={labels.phone} autoComplete="tel" />
      </div>
      <label className="field field--area" data-invalid={err('message') || undefined}>
        <span className="label">{labels.message} *</span>
        <textarea name="message" rows={5} required aria-invalid={err('message') || undefined} />
        {err('message') && <span className="field__error">{labels.required}</span>}
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="form__hp" aria-hidden="true" />
      <label className="form__consent" data-invalid={err('consent') || undefined}>
        <input type="checkbox" name="consent" required />
        <span>{labels.consent}</span>
      </label>
      <button type="submit" className="btn btn--solid" disabled={status === 'sending'}>
        {labels.send} <span aria-hidden="true">→</span>
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
