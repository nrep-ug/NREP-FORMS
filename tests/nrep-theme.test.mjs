import assert from "node:assert/strict"
import test from "node:test"
import { NREP_THEME, resolveNrepFormAccent } from "../lib/nrep-theme.mjs"

test("missing and invalid form accents use the NREP primary colour", () => {
  assert.equal(resolveNrepFormAccent(), NREP_THEME.primary)
  assert.equal(resolveNrepFormAccent("blue"), NREP_THEME.primary)
  assert.equal(resolveNrepFormAccent("#123"), NREP_THEME.primary)
})

test("retired teal accents are migrated at render time", () => {
  assert.equal(resolveNrepFormAccent("#087F8C"), NREP_THEME.primary)
  assert.equal(resolveNrepFormAccent("#066873"), NREP_THEME.primaryDark)
  assert.equal(resolveNrepFormAccent("#0d5964"), NREP_THEME.primaryDark)
})

test("valid custom form accents remain available", () => {
  assert.equal(resolveNrepFormAccent("#9A3412"), "#9a3412")
})
