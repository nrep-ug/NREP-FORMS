import assert from "node:assert/strict"
import test from "node:test"
import { acceptedFileExtensions, completionPercent, validateClientField, validateClientFiles, validateClientStep } from "../lib/form-client-rules.mjs"

test("step validation reports required and invalid email responses", () => {
  const step = { fields: [
    { id: "name", type: "short_text", label: "Name", required: true },
    { id: "email", type: "email", label: "Email", required: true },
  ] }
  assert.deepEqual(validateClientStep(step, { email: "wrong" }), {
    name: "Name is required.",
    email: "Enter a valid email address.",
  })
})

test("numeric and consent validation matches the public controls", () => {
  assert.match(validateClientField({ type: "number", label: "Age", min: 18 }, 16), /at least 18/)
  assert.match(validateClientField({ type: "consent", label: "Consent", required: true }, false), /required/)
})

test("progress remains within zero and one hundred percent", () => {
  assert.equal(completionPercent(0, 4), 25)
  assert.equal(completionPercent(4, 4), 100)
  assert.equal(completionPercent(0, 0), 0)
})

test("file validation enforces category, count, per-file, and combined limits", () => {
  const field = {
    id: "evidence",
    type: "file_upload",
    label: "Evidence",
    required: true,
    allowedFileCategories: ["image", "document"],
    maxFiles: 2,
    maxFileSizeMb: 5,
    maxTotalSizeMb: 8,
  }
  assert.ok(acceptedFileExtensions(field.allowedFileCategories).includes("pdf"))
  assert.match(validateClientFiles(field, []), /required/)
  assert.match(validateClientFiles(field, [{ name: "clip.mp4", size: 1000 }]), /not an accepted/i)
  assert.match(validateClientFiles(field, [{ name: "one.pdf", size: 5 * 1024 * 1024 }, { name: "two.png", size: 4 * 1024 * 1024 }]), /total 8 MB/i)
  assert.equal(validateClientFiles(field, [{ name: "one.pdf", size: 1024 }]), "")
})

test("location validation requires the configured hierarchy to be complete", () => {
  const field = { type: "administrative_location", label: "Location", required: true }
  assert.match(validateClientField(field, { path: [{ level: "country", code: "UG", name: "Uganda" }], complete: false }), /complete/i)
  assert.equal(validateClientField(field, { path: [{ level: "country", code: "UG", name: "Uganda" }], complete: true }), "")
})
