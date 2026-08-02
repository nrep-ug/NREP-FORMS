"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarClock, FileText, LockKeyhole, MapPin, Paperclip, Send, Trash2, TriangleAlert } from "lucide-react"
import { acceptedFileExtensions, completionPercent, validateClientFiles, validateClientStep } from "@/lib/form-client-rules.mjs"
import { resolveNrepFormAccent } from "@/lib/nrep-theme.mjs"

function newToken(prefix) {
  return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "")}`.slice(0, 64)
}

function storedDraft(storageKey) {
  try { return JSON.parse(localStorage.getItem(storageKey) || "null") } catch { return null }
}

function formatBytes(value) {
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

function FileUploadControl({ field, files, error, disabled, onChange }) {
  const values = Array.isArray(files) ? files : []
  const accept = acceptedFileExtensions(field.allowedFileCategories || []).map((extension) => `.${extension}`).join(",")
  return <div className="file-upload-control"><label className={`file-picker${error ? " file-picker--error" : ""}`}><input type="file" multiple={(field.maxFiles || 1) > 1} accept={accept} disabled={disabled} onChange={(event) => onChange(Array.from(event.target.files || []))} /><Paperclip size={20} /><span><strong>Choose {field.maxFiles === 1 ? "a file" : "files"}</strong><small>Up to {field.maxFiles || 1}; {field.maxFileSizeMb || 10} MB per file; {field.maxTotalSizeMb || 10} MB combined</small></span></label>{values.length > 0 && <div className="selected-files">{values.map((file, index) => <div className="selected-file" key={`${file.name}-${file.size}-${index}`}><FileText size={16} /><span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></span><button type="button" title={`Remove ${file.name}`} disabled={disabled} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button></div>)}</div>}</div>
}

function AdministrativeLocationControl({ formSlug, field, value, error, disabled, onChange }) {
  const path = useMemo(() => Array.isArray(value?.path) ? value.path : [], [value])
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const loadNext = useCallback(async (prefix) => {
    const query = new URLSearchParams({ path: JSON.stringify(prefix) })
    const response = await fetch(`/api/forms/${encodeURIComponent(formSlug)}/geography/${encodeURIComponent(field.id)}?${query}`, { cache: "no-store" })
    const payload = await response.json().catch(() => null)
    if (!response.ok) throw new Error(payload?.error || "Location options could not be loaded.")
    return payload
  }, [field.id, formSlug])

  useEffect(() => {
    let cancelled = false
    async function loadHierarchy() {
      setLoading(true)
      setLoadError("")
      try {
        const nextLevels = []
        let prefix = []
        let next = await loadNext(prefix)
        if (next.level) nextLevels.push(next)
        for (const selected of path) {
          const canonical = next?.options?.find((item) => item.code === selected.code)
          if (!canonical || next.level !== selected.level) break
          prefix = [...prefix, { level: next.level, code: canonical.code, name: canonical.name }]
          next = await loadNext(prefix)
          if (next.level) nextLevels.push(next)
        }
        if (!cancelled) setLevels(nextLevels)
      } catch (loadFailure) {
        if (!cancelled) setLoadError(loadFailure.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHierarchy()
    return () => { cancelled = true }
  }, [loadNext, path])

  async function selectLevel(index, code) {
    if (!code) {
      onChange(index === 0 ? null : { path: path.slice(0, index), complete: false })
      return
    }
    const level = levels[index]
    const selected = level.options.find((item) => item.code === code)
    if (!selected) return
    const nextPath = [...path.slice(0, index), { level: level.level, code: selected.code, name: selected.name }]
    setLoading(true)
    try {
      const next = await loadNext(nextPath)
      onChange({ path: nextPath, complete: Boolean(next.complete) })
    } catch (loadFailure) {
      setLoadError(loadFailure.message)
    } finally {
      setLoading(false)
    }
  }

  return <div className={`location-control${error ? " location-control--error" : ""}`}><div className="location-control__heading"><MapPin size={16} /><span>Select each available administrative level</span>{loading && <span className="spinner" />}</div><div className="location-grid">{levels.map((level, index) => <label key={`${level.level}-${index}`}><span>{level.label}</span><select className="select" value={path[index]?.code || ""} disabled={disabled || loading} onChange={(event) => selectLevel(index, event.target.value)}><option value="">Select {level.label.toLocaleLowerCase()}</option>{level.options.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>)}</div>{loadError && <p className="field-error">{loadError}</p>}</div>
}

function FieldControl({ formSlug, field, value, files, error, disabled, onChange, onFilesChange }) {
  const errorClass = error ? " input--error" : ""
  if (field.type === "information") return <div className="information">{field.description || field.label}</div>
  if (field.type === "long_text") return <textarea className={`textarea${errorClass}`} value={value || ""} maxLength={field.maxLength || 4000} placeholder={field.placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
  if (["single_choice", "multiple_choice"].includes(field.type)) {
    const multiple = field.type === "multiple_choice"
    const values = multiple && Array.isArray(value) ? value : []
    return <div className="choice-list">{field.options.map((option) => <label className="choice" key={option.id || option.value}><input type={multiple ? "checkbox" : "radio"} name={field.id} checked={multiple ? values.includes(option.value) : value === option.value} disabled={disabled} onChange={(event) => { if (multiple) onChange(event.target.checked ? [...values, option.value] : values.filter((item) => item !== option.value)); else onChange(option.value) }} /><span>{option.label}</span></label>)}</div>
  }
  if (field.type === "dropdown") return <select className={`select${errorClass}`} value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)}><option value="">Select an option</option>{field.options.map((option) => <option key={option.id || option.value} value={option.value}>{option.label}</option>)}</select>
  if (field.type === "yes_no") return <div className="choice-list"><label className="choice"><input type="radio" name={field.id} checked={value === true} disabled={disabled} onChange={() => onChange(true)} /> Yes</label><label className="choice"><input type="radio" name={field.id} checked={value === false} disabled={disabled} onChange={() => onChange(false)} /> No</label></div>
  if (field.type === "consent") return <label className="choice"><input type="checkbox" checked={value === true} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span>{field.consentText || field.description || "I agree"}</span></label>
  if (field.type === "rating") return <div className="rating">{Array.from({ length: field.ratingMax || 5 }, (_, index) => <button type="button" key={index} aria-pressed={Number(value) === index + 1} disabled={disabled} onClick={() => onChange(index + 1)}>{index + 1}</button>)}</div>
  if (field.type === "file_upload") return <FileUploadControl field={field} files={files} error={error} disabled={disabled} onChange={onFilesChange} />
  if (field.type === "administrative_location") return <AdministrativeLocationControl formSlug={formSlug} field={field} value={value} error={error} disabled={disabled} onChange={onChange} />
  const type = { email: "email", phone: "tel", number: "number", currency: "number", date: "date", time: "time" }[field.type] || "text"
  return <input className={`input${errorClass}`} type={type} value={value ?? ""} min={field.min ?? undefined} max={field.max ?? undefined} maxLength={field.maxLength || undefined} inputMode={["number", "currency"].includes(field.type) ? "decimal" : undefined} placeholder={field.placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
}

export default function FormRunner({ form }) {
  const router = useRouter()
  const steps = form.definition.steps || []
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [fileSelections, setFileSelections] = useState({})
  const [respondentName, setRespondentName] = useState("")
  const [respondentEmail, setRespondentEmail] = useState("")
  const [consents, setConsents] = useState({ general: false, form: false })
  const [website, setWebsite] = useState("")
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [clientSessionId, setClientSessionId] = useState("")
  const [idempotencyKey, setIdempotencyKey] = useState("")
  const [startedAt, setStartedAt] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const storageKey = useMemo(() => `nrep-form-draft:${form.id}:${form.version.id}`, [form.id, form.version.id])
  const currentStep = steps[stepIndex] || steps[0]
  const finalStep = stepIndex === steps.length - 1
  const accent = resolveNrepFormAccent(form.theme?.accentColor)

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const stored = storedDraft(storageKey)
      const sessionId = stored?.clientSessionId || newToken("session")
      setAnswers(stored?.answers || {})
      setRespondentName(stored?.respondentName || "")
      setRespondentEmail(stored?.respondentEmail || "")
      setConsents(stored?.consents || { general: false, form: false })
      setStepIndex(Math.min(Number(stored?.stepIndex) || 0, Math.max(0, steps.length - 1)))
      setClientSessionId(sessionId)
      setIdempotencyKey(stored?.idempotencyKey || newToken("submit"))
      setStartedAt(stored?.startedAt || new Date().toISOString())
      setHydrated(true)
      if (!stored?.startedEvent) {
        fetch(`/api/forms/${encodeURIComponent(form.slug)}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "started", clientSessionId: sessionId, stepIndex: 0 }),
          keepalive: true,
        }).catch(() => null)
      }
    }, 0)
    return () => window.clearTimeout(restoreTimer)
  }, [form.slug, steps.length, storageKey])

  useEffect(() => {
    if (!hydrated || !clientSessionId) return
    const timeout = setTimeout(() => localStorage.setItem(storageKey, JSON.stringify({
      answers, respondentName, respondentEmail, consents, stepIndex, clientSessionId, idempotencyKey, startedAt, startedEvent: true,
    })), 250)
    return () => clearTimeout(timeout)
  }, [answers, clientSessionId, consents, hydrated, idempotencyKey, respondentEmail, respondentName, startedAt, stepIndex, storageKey])

  function setAnswer(fieldId, value) {
    setAnswers((current) => ({ ...current, [fieldId]: value }))
    setErrors((current) => ({ ...current, [fieldId]: undefined }))
  }

  function setFiles(field, files) {
    setFileSelections((current) => ({ ...current, [field.id]: files }))
    const validationError = validateClientFiles(field, files)
    setErrors((current) => ({ ...current, [field.id]: validationError || undefined }))
  }

  function validateIdentity() {
    const next = {}
    if (form.collectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail.trim())) next.respondentEmail = "Enter a valid email address."
    return next
  }

  function recordEvent(eventType, index) {
    fetch(`/api/forms/${encodeURIComponent(form.slug)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, clientSessionId, stepIndex: index }),
      keepalive: true,
    }).catch(() => null)
  }

  function nextStep() {
    const nextErrors = { ...validateClientStep(currentStep, answers, fileSelections), ...(stepIndex === 0 ? validateIdentity() : {}) }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      recordEvent("validation_failed", stepIndex)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    recordEvent("step_completed", stepIndex)
    setStepIndex((current) => current + 1)
    setErrors({})
    window.scrollTo({ top: 0, behavior: "smooth" })
    recordEvent("step_viewed", stepIndex + 1)
  }

  async function uploadSelectedFiles() {
    const fileFields = steps.flatMap((step) => step.fields || []).filter((field) => field.type === "file_upload")
    const total = fileFields.reduce((sum, field) => sum + (fileSelections[field.id]?.length || 0), 0)
    const submittedAnswers = { ...answers }
    let completed = 0
    if (total) setUploadProgress({ completed, total, fileName: "Preparing uploads" })

    for (const field of fileFields) {
      const clearResponse = await fetch(`/api/forms/${encodeURIComponent(form.slug)}/uploads`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: field.id, idempotencyKey, clientSessionId }),
      })
      const clearPayload = await clearResponse.json().catch(() => null)
      if (!clearResponse.ok) throw new Error(clearPayload?.error || "Previous pending uploads could not be cleared.")

      const uploadIds = []
      for (const file of fileSelections[field.id] || []) {
        setUploadProgress({ completed, total, fileName: file.name })
        const formData = new FormData()
        formData.append("fieldId", field.id)
        formData.append("idempotencyKey", idempotencyKey)
        formData.append("clientSessionId", clientSessionId)
        formData.append("startedAt", startedAt)
        formData.append("file", file, file.name)
        const response = await fetch(`/api/forms/${encodeURIComponent(form.slug)}/uploads`, { method: "POST", body: formData })
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          const uploadError = new Error(payload?.error || `${file.name} could not be uploaded.`)
          uploadError.details = { [field.id]: payload?.error || `${file.name} could not be uploaded.` }
          throw uploadError
        }
        uploadIds.push(payload.upload.uploadId)
        completed += 1
        setUploadProgress({ completed, total, fileName: file.name })
      }
      if (uploadIds.length) submittedAnswers[field.id] = uploadIds
      else delete submittedAnswers[field.id]
    }
    return submittedAnswers
  }

  async function submit(event) {
    event.preventDefault()
    const nextErrors = { ...validateIdentity() }
    for (const step of steps) Object.assign(nextErrors, validateClientStep(step, answers, fileSelections))
    if (form.generalConsent?.required && !consents.general) nextErrors.generalConsent = "General consent is required."
    if (form.formConsent?.required && !consents.form) nextErrors.formConsent = "Form consent is required."
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setSubmitError("Review the highlighted fields before submitting.")
      recordEvent("validation_failed", stepIndex)
      return
    }
    setSubmitting(true)
    setSubmitError("")
    try {
      const submittedAnswers = await uploadSelectedFiles()
      const response = await fetch(`/api/forms/${encodeURIComponent(form.slug)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: submittedAnswers,
          respondentName,
          respondentEmail,
          consents,
          website,
          clientSessionId,
          idempotencyKey,
          startedAt,
          metadata: { locale: navigator.language, referrer: document.referrer },
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const error = new Error(payload?.error || "Your response could not be submitted.")
        error.details = payload?.details || {}
        throw error
      }
      localStorage.removeItem(storageKey)
      router.push(`/f/${encodeURIComponent(form.slug)}/success?reference=${encodeURIComponent(payload.submissionNumber || "")}`)
    } catch (error) {
      setSubmitError(error.message)
      setErrors(error.details || {})
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  if (!form.availability.accepting) {
    return <div className="form-page"><div className="form-shell" style={{ "--form-accent": accent }}><div className="form-header"><div className="form-header__brand"><FileText size={15} /> NREP form</div><h1>{form.title}</h1>{form.description && <p>{form.description}</p>}</div><div className="unavailable"><CalendarClock size={42} /><h2>Responses are unavailable</h2><p>{form.availability.reason}</p><Link className="button" href="/"><ArrowLeft size={16} /> Available forms</Link></div></div></div>
  }

  return (
    <div className="form-page">
      <form className="form-shell" style={{ "--form-accent": accent }} onSubmit={submit} noValidate>
        <div className="form-header"><div className="form-header__brand"><FileText size={15} /> Official NREP form</div><h1>{form.title}</h1>{form.description && <p>{form.description}</p>}</div>
        {form.layout === "steps" && <><div className="progress"><span style={{ width: `${completionPercent(stepIndex, steps.length)}%` }} /></div><div className="step-meta"><span>Step {stepIndex + 1} of {steps.length}</span><span>{completionPercent(stepIndex, steps.length)}% complete</span></div></>}
        <div className="form-body">
          {submitError && <div className="alert"><TriangleAlert size={18} /><span>{submitError}</span></div>}
          {uploadProgress && <div className="upload-progress" role="status"><span className="spinner" /><span><strong>Uploading attachments {uploadProgress.completed} of {uploadProgress.total}</strong><small>{uploadProgress.fileName}</small></span></div>}
          {stepIndex === 0 && <div className="identity-band"><div className="field"><label className="field-label" htmlFor="respondent-name">Your name</label><input id="respondent-name" className="input" value={respondentName} onChange={(event) => setRespondentName(event.target.value)} autoComplete="name" /></div>{form.collectEmail && <div className="field"><label className="field-label" htmlFor="respondent-email">Email <span className="required">*</span></label><input id="respondent-email" className={`input${errors.respondentEmail ? " input--error" : ""}`} type="email" value={respondentEmail} onChange={(event) => { setRespondentEmail(event.target.value); setErrors((current) => ({ ...current, respondentEmail: undefined })) }} autoComplete="email" aria-invalid={Boolean(errors.respondentEmail)} />{errors.respondentEmail && <p className="field-error">{errors.respondentEmail}</p>}</div>}</div>}
          <section>
            {(form.layout === "steps" || steps.length > 1) && <h2 className="step-title">{currentStep.title}</h2>}
            {currentStep.description && <p className="step-description">{currentStep.description}</p>}
            {currentStep.fields.map((field) => <div className="field" key={field.id}>{field.type !== "information" && <label className="field-label">{field.label} {field.required && <span className="required">*</span>}</label>}{field.description && !["information", "consent"].includes(field.type) && <p className="field-help">{field.description}</p>}<FieldControl formSlug={form.slug} field={field} value={answers[field.id]} files={fileSelections[field.id]} error={errors[field.id]} disabled={submitting} onChange={(value) => setAnswer(field.id, value)} onFilesChange={(files) => setFiles(field, files)} />{errors[field.id] && <p className="field-error">{errors[field.id]}</p>}</div>)}
          </section>
          {finalStep && form.generalConsent && <div className="field consent-box"><h3>{form.generalConsent.title}</h3><p>{form.generalConsent.text}</p><label className="choice"><input type="checkbox" checked={consents.general} onChange={(event) => { setConsents((current) => ({ ...current, general: event.target.checked })); setErrors((current) => ({ ...current, generalConsent: undefined })) }} /><span>I accept this consent statement {form.generalConsent.required && <span className="required">*</span>}</span></label>{errors.generalConsent && <p className="field-error">{errors.generalConsent}</p>}</div>}
          {finalStep && form.formConsent && <div className="field consent-box"><h3>{form.formConsent.title}</h3><p>{form.formConsent.text}</p><label className="choice"><input type="checkbox" checked={consents.form} onChange={(event) => { setConsents((current) => ({ ...current, form: event.target.checked })); setErrors((current) => ({ ...current, formConsent: undefined })) }} /><span>I accept this consent statement {form.formConsent.required && <span className="required">*</span>}</span></label>{errors.formConsent && <p className="field-error">{errors.formConsent}</p>}</div>}
          <div className="honeypot" aria-hidden="true"><label>Website<input tabIndex="-1" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label></div>
        </div>
        <div className="form-footer">
          <div className="privacy-note"><LockKeyhole size={14} /> Answers are saved on this device; selected files remain in this browser until submission</div>
          <div className="footer-actions">
            {stepIndex > 0 && <button className="button" type="button" onClick={() => { setStepIndex((current) => current - 1); setErrors({}); window.scrollTo({ top: 0, behavior: "smooth" }) }}><ArrowLeft size={16} /> Back</button>}
            {!finalStep ? <button className="button button--primary" type="button" onClick={nextStep}>Next <ArrowRight size={16} /></button> : <button className="button button--primary" type="submit" disabled={submitting || !hydrated}>{submitting ? <><span className="spinner" /> Submitting...</> : <><Send size={16} /> Submit response</>}</button>}
          </div>
        </div>
      </form>
    </div>
  )
}
