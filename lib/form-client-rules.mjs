export const INPUT_TYPES = new Set([
  "short_text", "long_text", "email", "phone", "number", "currency", "date", "time",
  "single_choice", "multiple_choice", "dropdown", "yes_no", "rating", "consent", "file_upload",
  "administrative_location", "repeatable_list",
])

const MB = 1024 * 1024
const MAX_REPEATABLE_RESPONSE_LENGTH = 7800
const CATEGORY_EXTENSIONS = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tif", "tiff"],
  document: ["pdf", "txt", "csv", "rtf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"],
  audio: ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac"],
  video: ["mp4", "m4v", "mov", "webm", "avi", "mkv", "mpeg", "mpg"],
  archive: ["zip", "7z", "rar"],
}

function empty(value) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)
}

export function acceptedFileExtensions(categories = []) {
  return [...new Set(categories.flatMap((category) => CATEGORY_EXTENSIONS[category] || []))]
}

export function validateClientFiles(field, files) {
  const values = Array.isArray(files) ? files : []
  if (field.required && !values.length) return `${field.label} is required.`
  if (!values.length) return ""
  const maxFiles = Math.max(1, Number(field.maxFiles) || 1)
  if (values.length > maxFiles) return `Select no more than ${maxFiles} files.`
  const accepted = new Set(acceptedFileExtensions(field.allowedFileCategories || []))
  const maxFileBytes = Math.max(1, Number(field.maxFileSizeMb) || 10) * MB
  for (const file of values) {
    const extension = String(file?.name || "").toLocaleLowerCase().match(/\.([a-z0-9]{1,10})$/)?.[1] || ""
    if (!accepted.has(extension)) return `${file?.name || "A selected file"} is not an accepted file type.`
    if (Number(file?.size) > maxFileBytes) return `${file.name} must be ${field.maxFileSizeMb || 10} MB or smaller.`
    if (!Number(file?.size)) return `${file?.name || "A selected file"} is empty.`
  }
  const maxTotalBytes = Math.max(1, Number(field.maxTotalSizeMb) || maxFiles * (Number(field.maxFileSizeMb) || 10)) * MB
  if (values.reduce((total, file) => total + Number(file.size || 0), 0) > maxTotalBytes) {
    return `Selected files must total ${field.maxTotalSizeMb} MB or less.`
  }
  return ""
}

export function validateClientField(field, value, files = []) {
  if (!INPUT_TYPES.has(field.type)) return ""
  if (field.type === "file_upload") return validateClientFiles(field, files)
  if (field.type === "repeatable_list") {
    if (!empty(value) && !Array.isArray(value)) return "Provide the response as a list of items."
    const values = Array.isArray(value) ? value : []
    if (values.some((item) => typeof item !== "string")) return "Each list item must be text."
    const items = values.map((item) => item.trim()).filter(Boolean)
    const minimumItems = Math.max(field.required ? 1 : 0, Number(field.min) || 0)
    const maximumItems = Math.max(1, Number(field.max) || 10)
    if (field.required && !items.length) return `${field.label} is required.`
    if (items.length && items.length < minimumItems) return `Add at least ${minimumItems} item${minimumItems === 1 ? "" : "s"}.`
    if (items.length > maximumItems) return `Add no more than ${maximumItems} item${maximumItems === 1 ? "" : "s"}.`
    const maxLength = Math.max(1, Number(field.maxLength) || 500)
    if (items.some((item) => item.length > maxLength)) return `Each item must be ${maxLength} characters or fewer.`
    if (JSON.stringify(items).length > MAX_REPEATABLE_RESPONSE_LENGTH) return "Shorten the list response. Its combined content is too long."
    return ""
  }
  if (field.required && empty(value)) return `${field.label} is required.`
  if (empty(value)) return ""
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return "Enter a valid email address."
  if (field.type === "phone" && !/^[+0-9()\s-]{7,30}$/.test(String(value))) return "Enter a valid phone number."
  if (["number", "currency", "rating"].includes(field.type)) {
    const number = Number(value)
    if (!Number.isFinite(number)) return "Enter a valid number."
    if (field.min !== null && field.min !== undefined && number < Number(field.min)) return `Value must be at least ${field.min}.`
    if (field.max !== null && field.max !== undefined && number > Number(field.max)) return `Value must be at most ${field.max}.`
  }
  if (field.type === "consent" && field.required && value !== true) return "Consent is required."
  if (field.type === "administrative_location" && value?.complete !== true) return "Complete the location selection."
  return ""
}

export function validateClientStep(step, answers, fileSelections = {}) {
  const errors = {}
  for (const field of step?.fields || []) {
    const error = validateClientField(field, answers[field.id], fileSelections[field.id])
    if (error) errors[field.id] = error
  }
  return errors
}

export function completionPercent(stepIndex, totalSteps) {
  if (!totalSteps) return 0
  return Math.min(100, Math.max(0, Math.round(((stepIndex + 1) / totalSteps) * 100)))
}
